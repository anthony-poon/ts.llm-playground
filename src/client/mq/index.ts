import amqplib, {Channel, Message} from "amqplib"
import env, {MsgQueueEnv} from "@env";
import loggerFactory from "@core/logger";

const logger = loggerFactory.create('rabbitmq-client')

export interface MQContext {
    ack: () => void,
}

export class RabbitMQClient {
    private channel: Channel|null = null;
    constructor(private readonly env: MsgQueueEnv) {
        if (!this.env.MQ_HOSTNAME || !this.env.MQ_PORT || !this.env.MQ_USERNAME || !this.env.MQ_PASSWORD || !this.env.MQ_VHOST) {
            throw new Error("Missing required environment variable")
        }
    }
    public connect = async () => {
        if (this.channel) {
            return;
        }
        const connection = await amqplib.connect(
            `amqp://${this.env.MQ_USERNAME}:${this.env.MQ_PASSWORD}@${this.env.MQ_HOSTNAME}:${this.env.MQ_PORT}/${this.env.MQ_VHOST}`
        );
        this.channel = await connection.createChannel();
        logger.info("AMQP connected")
    }

    public listen = async (queue: string, onMsg: (msg: string, context: MQContext) => Promise<void>) => {
        if (!this.channel) {
            throw new Error("Channel is not established. Call connect() first.");
        }

        await this.channel.assertQueue(queue, { durable: true });
        logger.info("AMQP listening");
        await this.channel.consume(queue, async (msg) => {
            if (msg === null) {
                logger.info('Consumer cancelled by server');
            } else {
                logger.info('Message Received');
                const context = await this.createContext(msg);
                await onMsg(msg.content.toString(), context);
            }
        })
    }

    public publish = async (queue: string, payload: string) => {
        if (!this.channel) {
            throw new Error("Channel is not established. Call connect() first.");
        }
        await this.channel.assertQueue(queue, { durable: true });
        this.channel.sendToQueue(queue, Buffer.from(payload))
    }

    private createContext = (msg: Message): MQContext => {
        return {
            ack: () => {
                logger.debug('Message acknowledged')
                this.channel?.ack(msg);
            },
        }
    }
}

const mqClient = new RabbitMQClient(env);

export default mqClient;