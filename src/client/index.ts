import env from "@env";
import {OllamaClient} from "@client/ollama";
import {OpenAIClient} from "@client/openai";
import {MockClient} from "@client/mock";

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

let client: ChatCompletionClient;
switch (env.CHAT_COMPLETION_PROVIDER) {
  case "ollama":
    client = new OllamaClient(env);
    break;
  case "openai":
    client = new OpenAIClient(env);
    break;
  case "mock":
    client = new MockClient();
    break;
  default:
    throw new Error("Invalid chat completion provider");
}

export default client;