import {LLMClient, ChatCompletionRequest, ChatCompletionResponse} from "@client/llm";

export class MockClient implements LLMClient {
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