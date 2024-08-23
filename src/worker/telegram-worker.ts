import {MQContext} from "@client/mq";
import loggerFactory from "@core/logger";
import llmProvider, {LLMProvider} from "@client/llm";
import telegramClient, {TelegramClient} from "@client/telegram";
import {Chat} from "@core/chat";
import {ChatEntity} from "@entity/chat.entity";
import telegramCommand, {TelegramCommand} from "./telegram-command";
import chatRepository, {ChatRepository} from "@repository/chat-repository";
import env, { AppEnv, TelegramBotEnv, TelegramEnv } from '@env';
import { TelegramCommandContext } from './telegram-command';
import { WebhookRequest } from '../http/route/webhook/type/request';

const logger = loggerFactory.create('telegram-queue-worker');

export interface TelegramWorkerMessage {
    namespace: string;
    request: WebhookRequest

    sendRequest: (chat: Chat) => Promise<void>
}

export class TelegramWorker {
    constructor(
        private readonly llmProvider: LLMProvider,
        private readonly telegramClient: TelegramClient,
        private readonly chatRepository: ChatRepository,
        private readonly commands: TelegramCommand,
        private readonly env: TelegramEnv & Pick<AppEnv, "SESSIONS_FOLDER"|"PROMPTS_FOLDER">,
    ) {}

    public handle = async (msg: string, context: MQContext) => {
        try {
            const request = JSON.parse(msg) as TelegramWorkerMessage;
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
    public handleWithEntityAndChat = async (message: TelegramWorkerMessage, entity: ChatEntity, chat: Chat) => {
        try {
            const content = message.request.message.text;
            const botEnv = this.getBotEnv(message);
            if (!content.startsWith("/")) {
                chat.addUserMsg(message.request.message.text);
                await this.sendRequest(message, chat, botEnv);
            } else {
                const context = this.createContext(message, chat, botEnv);
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

    private getEntityAndChat = async (message: TelegramWorkerMessage) => {
        const remoteId = `${message.request.message.chat.id}`;
        let entity = await this.chatRepository.findOneBy({
            namespace: message.namespace,
            remoteId
        });
        const chat = new Chat();
        if (!entity || !entity.json){
            entity = ChatEntity.getNewChat({
                namespace: message.namespace,
                userId: message.request.message.from.id.toString(),
                remoteId: message.request.message.chat.id.toString(),
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

    private createContext = (message: TelegramWorkerMessage, chat: Chat, botEnv: TelegramBotEnv): TelegramCommandContext => {
        const client = this.llmProvider.getClient(botEnv.PROVIDER)
        return {
            done: false,
            reply: async (msg: string) => await this.telegramReply(message, msg),
            chat,
            env: botEnv,
            client: client,
            sendRequest: async (chat: Chat) => await this.sendRequest(message, chat, botEnv),
        }
    }

    private sendRequest = async (message: TelegramWorkerMessage, chat: Chat, botEnv: TelegramBotEnv) => {
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

    private telegramReply = async (message: TelegramWorkerMessage, text: string) => {
        await this.telegramClient.sendMessage({
            chat_id: message.request.message.chat.id,
            text,
            namespace: message.namespace,
        })
    }

    private getBotEnv = (message: TelegramWorkerMessage) => {
        const provider = this.env.TELEGRAM_BOTS.find(({ NAMESPACE }) => message.namespace.toLowerCase() === NAMESPACE)
        if (!provider) {
            throw new Error(`Cannot find provider by name ${provider}`);
        }
        return provider;
    }
}

const telegramQueueWorker = new TelegramWorker(
    llmProvider,
    telegramClient,
    chatRepository,
    telegramCommand,
    env,
)

export default telegramQueueWorker;