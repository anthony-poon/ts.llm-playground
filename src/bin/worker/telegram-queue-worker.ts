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

const logger = loggerFactory.create('telegram-queue-worker');

export class TelegramQueueWorker {
    constructor(
        private readonly llmClient: LLMClient,
        private readonly telegramClient: TelegramClient,
        private readonly chatRepository: ChatRepository,
        private readonly chatCommandService: ChatCommandService,
    ) {}

    public handle = async (msg: string, context: MQContext) => {
        const request = JSON.parse(msg) as WebhookRequest;
        try {
            let chatEntity = await this.chatRepository.findOneBy({
                remoteId: request.message.chat.id
            });
            const chat = new Chat();
            if (chatEntity && chatEntity.json) {
                chat.hydrate(JSON.stringify(chatEntity.json));
            } else {
                chatEntity = new ChatEntity();
                chatEntity.remoteId = request.message.chat.id
                chatEntity.json = JSON.parse(chat.dehydrate());
                await this.chatRepository.save(chatEntity);
            }
            const content = request.message.text;
            if (!content.startsWith("/")) {
                await this.handleChat(request, chat);
            } else {
                const context = this.createContext(request, chat, chatEntity);
                await this.chatCommandService.handle(content, context)
            }
            chatEntity.json = JSON.parse(chat.dehydrate());
            logger.debug('json', {
                "json": chatEntity.json
            });
            await this.chatRepository.save(chatEntity)
        } catch (e) {
            const error = (e as Error);
            const msg = `Error: ${error.message}`;
            logger.error(msg)
            await this.reply(request, msg);
        } finally {
            context.ack();
        }

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