import client, {ChatCompletionClient} from "@client/index";
import {TTYContext, TTYHandler} from "@core/tty";

class PingHandler implements TTYHandler {
    private isDone = false;
    constructor(private readonly client: ChatCompletionClient) {}
    handle = async (context: TTYContext): Promise<void> => {
        if (this.isDone) {
            context.next();
        } else {
            await this.client.ping();
            this.isDone = true;
            context.next();
        }
    }
}

const pingHandler = new PingHandler(client);

export default pingHandler;