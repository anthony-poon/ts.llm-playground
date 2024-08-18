import userRepository, {UserRepository} from "@repository/user-repository";
import {WebhookRequest} from "../type/request";
import loggerFactory from "@core/logger";
import telegramClient, {TelegramClient} from "@client/telegram";
import {NextFunction, Request, Response} from "express";

const logger = loggerFactory.create('initialization-action')

class Initialization {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly telegramClient: TelegramClient,
    ) {
    }

    // Maybe should make it into a middleware so that I can call next or not call next?
    public onRequest = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { message: { from: user } } = req.payload
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
                    chat_id: req.payload.message.chat.id,
                    text: "Your account have been disabled.",
                })
            } else {
                next();
            }
        } catch (e) {
            next(e)
        }
    }
}

const initialization = new Initialization(userRepository, telegramClient);

export default initialization;