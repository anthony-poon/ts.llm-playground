import {MQContext} from "@client/mq";
import loggerFactory from "@core/logger";
import llmProvider, {LLMProvider} from "@client/llm";
import telegramClient, {TelegramClient} from "@client/telegram";
import {Chat} from "@core/chat";
import {ChatEntity} from "@entity/chat.entity";
import {WebhookRequest} from "../../http/route/webhook/type/request";
import chatCommandService, {ChatCommandContext, ChatCommandService} from "@service/chat-command";
import chatRepository, {ChatRepository} from "@repository/chat-repository";
import env, {AppEnv, TelegramEnv} from "@env";
import path from "path";

const logger = loggerFactory.create('telegram-queue-worker');

export interface TelegramQueueWorkerMessage {
    namespace: string;
    request: WebhookRequest
}

export class TelegramQueueWorker {
    constructor(
        private readonly llmProvider: LLMProvider,
        private readonly telegramClient: TelegramClient,
        private readonly chatRepository: ChatRepository,
        private readonly commands: ChatCommandService,
        private readonly env: TelegramEnv & Pick<AppEnv, "SESSIONS_FOLDER"|"PROMPTS_FOLDER">,
    ) {}

    public handle = async (msg: string, context: MQContext) => {
        try {
            const request = JSON.parse(msg) as TelegramQueueWorkerMessage;
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
    public handleWithEntityAndChat = async (message: TelegramQueueWorkerMessage, entity: ChatEntity, chat: Chat) => {
        try {
            const content = message.request.message.text;
            if (!content.startsWith("/")) {
                await this.handleChat(message, chat);
            } else {
                const context = this.createContext(message, chat, entity);
                await this.commands.handle(content, context)
            }
        } catch (e) {
            const error = (e as Error);
            const msg = `Error: ${error.message}`;
            logger.error(msg)
            await this.telegramReply(message, msg);
        } finally {
            await this.updateEntityAndReleaseLock(entity, chat);
        }
    }

    private getEntityAndChat = async (message: TelegramQueueWorkerMessage) => {
        let entity = await this.chatRepository.findOneBy({
            remoteId: message.request.message.chat.id
        });
        const chat = new Chat();
        if (!entity || !entity.json){
            entity = ChatEntity.getNewChat(message.request.message.chat.id, {
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

    private createContext = (message: TelegramQueueWorkerMessage, chat: Chat, chatEntity: ChatEntity): ChatCommandContext => {
        const botEnv = this.getBotEnv(message);
        const chatId = message.request.message.chat.id;
        const userId = message.request.message.from.id;
        const pathToSessions = botEnv.SESSIONS_FOLDER || path.join(this.env.SESSIONS_FOLDER, botEnv.NAMESPACE);
        return {
            done: false,
            repaint: () => {}, // Not sure if we can repaint in telegram,
            retry: async () => await this.llmExchange(message, chat),
            write: async (msg: string) => await this.telegramReply(message, msg),
            reset: async () => {
                await this.chatRepository.remove(chatEntity);
                chat.clear();
            },
            chat,
            provider: botEnv.PROVIDER,
            pathToPrompts: botEnv.PROMPTS_FOLDER || path.join(this.env.PROMPTS_FOLDER, botEnv.NAMESPACE),
            pathToSessions: path.join(pathToSessions, `chat_${userId}_${chatId}`)
        }
    }

    private handleChat = async (message: TelegramQueueWorkerMessage, chat: Chat) => {
        chat.addUserMsg(message.request.message.text);
        await this.llmExchange(message, chat);
    }

    private llmExchange = async (message: TelegramQueueWorkerMessage, chat: Chat) => {
        const botEnv = this.getBotEnv(message);
        const client = this.llmProvider.getClient(botEnv.PROVIDER);
        const response = await client.chat(chat);
        if (!response.message) {
            logger.alert('Response from LLM client is empty');
            await this.telegramReply(message, '**Error: LLM engine return empty content**')
            return;
        }
        chat.addAssistantMsg(response.message);
        await this.telegramReply(message, response.message)
    }

    private telegramReply = async (message: TelegramQueueWorkerMessage, text: string) => {
        await this.telegramClient.sendMessage({
            chat_id: message.request.message.chat.id,
            text,
            namespace: message.namespace,
        })
    }

    private getBotEnv = (message: TelegramQueueWorkerMessage) => {
        const provider = this.env.TELEGRAM_BOTS.find(({ NAMESPACE }) => message.namespace.toLowerCase() === NAMESPACE)
        if (!provider) {
            throw new Error(`Cannot find provider by name ${provider}`);
        }
        return provider;
    }
}

const telegramQueueWorker = new TelegramQueueWorker(
    llmProvider,
    telegramClient,
    chatRepository,
    chatCommandService,
    env,
)

export default telegramQueueWorker;