import {WebhookRequest} from "../type/request";
import env, { MsgQueueEnv} from "@env";
import mqClient, {RabbitMQClient} from "@client/mq";

class MessageQueueAction {
    constructor(
        private readonly mqClient: RabbitMQClient,
        private readonly env: Pick<MsgQueueEnv, "TG_MESSAGE_QUEUE">,
    ) {
    }

    public publish = async (request: WebhookRequest) => {
        const json = JSON.stringify(request);
        await this.mqClient.connect();
        await this.mqClient.publish(this.env.TG_MESSAGE_QUEUE, json);
    }
}

const chatAction = new MessageQueueAction(
    mqClient,
    env
);

export default chatAction;