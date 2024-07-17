export interface ChatCompletionClient {
  chat: (request: ChatCompletionRequest) => Promise<ChatCompletionResponse>
  ping: () => Promise<void>
}

export interface ChatCompletionRequest {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

export interface ChatCompletionResponse {
  message: string;
}