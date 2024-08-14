import {ChatCompletionClient, ChatCompletionRequest, ChatCompletionResponse} from "@client/index";

export class MockClient implements ChatCompletionClient {
    async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const last = request.messages[request.messages.length - 1]
        return {
            message: `I have received the following chat: ${last.content}`
        };
    }

    async ping(): Promise<void> {
        return;
    }
}