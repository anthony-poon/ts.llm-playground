import {WebhookRequest} from "../type/request";
import env, { MsgQueueEnv} from "@env";
import mqClient, {RabbitMQClient} from "@client/mq";
import chatRepository, {ChatRepository} from "@repository/chat-repository";
import {ChatEntity} from "@entity/chat.entity";
import {ChatLockEntity} from "@entity/chat-lock.entity";
import {DateTime} from "luxon";
import telegramClient, {TelegramClient} from "@client/telegram";
import {NextFunction, Request, Response} from "express";
import { WebhookPayload } from '../webhook';
import {TelegramWorkerMessage} from "../../../../worker/telegram-worker";

class MessageQueue {
    constructor(
        private readonly mqClient: RabbitMQClient,
        private readonly telegramClient: TelegramClient,
        private readonly chatRepository: ChatRepository,
        private readonly env: Pick<MsgQueueEnv, "TG_MESSAGE_QUEUE">,
    ) {
    }

    public publish = async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.payload as WebhookPayload;
        const remoteId = `${payload.request.message.chat.id}`
        let chat = await this.chatRepository.findOneBy({
            namespace: payload.namespace,
            remoteId,
        })
        if (!chat) {
            const userId = `${payload.user?.id!}`
            chat = ChatEntity.getNewChat({
                namespace: payload.namespace,
                remoteId,
                userId,
            });
            await this.chatRepository.save(chat);
        }
        if (this.isLockValid(chat.lock)) {
            chat.lock!.expireAt = DateTime.now().plus({ second: 60 }).toJSDate();
            await this.chatRepository.save(chat);
            const json = this.format(req.payload);
            await this.mqClient.connect();
            await this.mqClient.publish(this.env.TG_MESSAGE_QUEUE, json);
        } else {
            await this.telegramClient.sendMessage({
                chat_id: payload.request.message.chat.id,
                text: "A message already in queue. Please wait",
                namespace: payload.namespace
            })
        }
    }

    // Just to ensure TelegramQueueWorkerMessage = WebhookPayload. if not, do a conversion
    private format = (payload: TelegramWorkerMessage) => {
        return JSON.stringify(payload)
    }

    private isLockValid = (lock?: ChatLockEntity) => {
        const dt = lock?.expireAt ? DateTime.fromJSDate(lock.expireAt) : null;
        return !dt || dt < DateTime.now();
    }
}

const messageQueue = new MessageQueue(
    mqClient,
    telegramClient,
    chatRepository,
    env
);

export default messageQueue;