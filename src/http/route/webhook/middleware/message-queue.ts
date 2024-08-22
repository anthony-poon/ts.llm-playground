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
        let chat = await this.chatRepository.findOneBy({
            remoteId: payload.request.message.chat.id,
        })
        if (!chat) {
            chat = await this.initChat(payload.request);
        }
        if (this.isLockValid(chat.lock)) {
            chat.lock!.expireAt = DateTime.now().plus({ second: 60 }).toJSDate();
            await this.chatRepository.save(chat);
            const json = JSON.stringify(req.payload);
            await this.mqClient.connect();
            await this.mqClient.publish(this.env.TG_MESSAGE_QUEUE, json);
        } else {
            await this.telegramClient.sendMessage({
                chat_id: req.payload.message.chat.id,
                text: "A message already in queue. Please wait",
                namespace: payload.namespace
            })
        }
    }

    private initChat = async (req: WebhookRequest) => {
        const chat = ChatEntity.getNewChat(req.message.chat.id)
        await this.chatRepository.save(chat);
        return chat;
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