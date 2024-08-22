import userRepository, {UserRepository} from "@repository/user-repository";
import {WebhookRequest} from "../type/request";
import loggerFactory from "@core/logger";
import telegramClient, {TelegramClient} from "@client/telegram";
import {NextFunction, Request, Response} from "express";
import { WebhookPayload } from '../webhook';
import env, {TelegramEnv} from "@env";

const logger = loggerFactory.create('initialization-action')

class Initialization {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly telegramClient: TelegramClient,
        private readonly env: TelegramEnv,
    ) {
    }

    public onRequest = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.payload as WebhookPayload;
            const user = payload.request.message.from;
            const botEnv = this.getBotEnvByNamespace(payload.namespace);
            if (botEnv.USER_WHITELIST.length > 0 && (!user.username || !botEnv.USER_WHITELIST.includes(user.username))) {
                await this.telegramClient.sendMessage({
                    chat_id: payload.request.message.chat.id,
                    text: "Access Denied.",
                    namespace: payload.namespace
                })
                return;
            }
            const upserted = await this.userRepository.upsertByRemoteId({
                remoteId: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                languageCode: user.language_code,
                lastSeenAt: new Date(),
                isBot: user.is_bot
            });
            const allowed = upserted.isAllowed;
            if (!allowed) {
                await this.telegramClient.sendMessage({
                    chat_id: payload.request.message.chat.id,
                    text: "Your account have been disabled.",
                    namespace: payload.namespace
                })
            } else {
                next();
            }
        } catch (e) {
            next(e)
        }
    }

    private getBotEnvByNamespace(namespace: string) {
        const botEnv = this.env.TELEGRAM_BOTS.find((botEnv) => botEnv.NAMESPACE.toUpperCase() === namespace.toUpperCase());
        if (!botEnv) {
            throw new Error("Invalid bot namespace");
        }
        return botEnv;
    }
}

const initialization = new Initialization(userRepository, telegramClient, env);

export default initialization;