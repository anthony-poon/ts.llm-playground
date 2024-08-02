import {TTYContext, TTYHandler} from "@core/tty";
import client, {ChatCompletionClient, ChatCompletionRequest} from "@client/index";
import {Chat} from "@core/chat";

const toCompletionRequest = (chat: Chat) => {
    const prompt = chat.prompt;
    const messages = [
        {
            role: "system",
            content: prompt
        },
        ...chat.messages // TODO: Limit the window size
    ];
    return {
        messages,
    } as ChatCompletionRequest;
}

class CompletionHandler implements TTYHandler {
    constructor(private readonly client: ChatCompletionClient) {
    }
    handle = async (context: TTYContext) => {
        if (!context.hasRequest) {
            context.next();
            return;
        }
        const request = toCompletionRequest(context.chat);
        const response = await this.client.chat(request);
        context.chat.addAssistantMsg(response.message);
    }
}

const completionHandler = new CompletionHandler(client);

export default completionHandler;