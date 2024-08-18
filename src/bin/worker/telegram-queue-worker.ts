import env from "@env";
import mqClient, {MQContext} from "@client/mq";
import loggerFactory from "@core/logger";
import llmClient, {LLMClient} from "@client/llm";
import telegramClient, {TelegramClient} from "@client/telegram";
import {Chat} from "@core/chat";
import {ChatEntity} from "@entity/chat.entity";
import {WebhookRequest} from "../../http/route/webhook/type/request";
import chatCommandService, {ChatCommandContext, ChatCommandService} from "@service/chat-command";
import chatRepository, {ChatRepository} from "@repository/chat-repository";
import database from "@database";
import {ChatLockEntity} from "@entity/chat-lock.entity";

const logger = loggerFactory.create('telegram-queue-worker');

export class TelegramQueueWorker {
    constructor(
        private readonly llmClient: LLMClient,
        private readonly telegramClient: TelegramClient,
        private readonly chatRepository: ChatRepository,
        private readonly commands: ChatCommandService,
    ) {}

    public handle = async (msg: string, context: MQContext) => {
        try {
            const request = JSON.parse(msg) as WebhookRequest;
            const { entity, chat } = await this.getEntityAndChat(request);
            await this.handleWithEntityAndChat(request, entity, chat);
        } catch (e) {
            // Might fail without the needed data for a reply, thus we cannot call this.reply or release msg lock
            const error = (e as Error);
            const msg = `Error: ${error.message}`;
            logger.error(msg);
        } finally {
            context.ack();
        }
    }

    // handling  with ChatEntity and Chat already established so that we can reply if an error is raised
    public handleWithEntityAndChat = async (request: WebhookRequest, entity: ChatEntity, chat: Chat) => {
        try {
            const content = request.message.text;
            if (!content.startsWith("/")) {
                await this.handleChat(request, chat);
            } else {
                const context = this.createContext(request, chat, entity);
                await this.commands.handle(content, context)
            }
        } catch (e) {
            const error = (e as Error);
            const msg = `Error: ${error.message}`;
            logger.error(msg)
            await this.reply(request, msg);
        } finally {
            await this.updateEntityAndReleaseLock(entity, chat);
        }
    }

    private getEntityAndChat = async (request: WebhookRequest) => {
        let entity = await this.chatRepository.findOneBy({
            remoteId: request.message.chat.id
        });
        const chat = new Chat();
        if (!entity || !entity.json){
            entity = ChatEntity.getNewChat(request.message.chat.id, {
                ttl: 60,
                chat,
            });
            await this.chatRepository.save(entity);
        }
        chat.hydrate(JSON.stringify(entity.json));
        return { entity, chat };
    }

    private updateEntityAndReleaseLock = async (entity: ChatEntity, chat: Chat) => {
        entity.json = JSON.parse(chat.dehydrate());
        entity.lock!.expireAt = null;
        await this.chatRepository.save(entity)
    }

    private createContext = (request: WebhookRequest, chat: Chat, chatEntity: ChatEntity): ChatCommandContext => {
        return {
            done: false,
            repaint: () => {}, // Not sure if we can repaint in telegram,
            retry: async () => await this.handleChat(request, chat),
            write: async (msg: string) => await this.reply(request, msg),
            reset: async () => {
                await this.chatRepository.remove(chatEntity);
                chat.clear();
            },
            chat
        }
    }

    private handleChat = async (request: WebhookRequest, chat: Chat) => {
        chat.addUserMsg(request.message.text);
        const response = await this.llmClient.chat(chat);
        if (!response.message) {
            logger.alert('Response from LLM client is empty');
            await this.telegramClient.sendMessage({
                chat_id: request.message.chat.id,
                text: '**Error: LLM engine return empty content**',
            })
            return;
        }
        chat.addAssistantMsg(response.message);
        await this.reply(request, response.message)
    }

    private reply = async (request: WebhookRequest, msg: string) => {
        await this.telegramClient.sendMessage({
            chat_id: request.message.chat.id,
            text: msg,
        })
    }
}

const telegramQueueWorker = new TelegramQueueWorker(
    llmClient,
    telegramClient,
    chatRepository,
    chatCommandService,
)

export default telegramQueueWorker;