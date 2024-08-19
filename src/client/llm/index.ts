import env, {AppEnv} from "@env";
import {OllamaClient} from "@client/llm/ollama";
import {OpenAIClient} from "@client/llm/openai";
import {MockClient} from "@client/llm/mock";
import httpClient from "@client/http";
import {Chat} from "@core/chat";

export interface LLMClient {
  chat: (request: Chat) => Promise<ChatCompletionResponse>
  ping: () => Promise<void>
  getModels: () => Promise<ListModelResponse|null>
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

type ListModelResponse = string[]

export const toCompletionRequest = (chat: Chat) => {
  const prompt = chat.prompt;
  const messages = [];
  if (prompt) {
    messages.push({
      role: "system",
      content: prompt
    })
  }
  if (chat.story) {
    messages.push({
      role: "system",
      content: "The story setting is as follow: " + chat.story + "\n"
    })
  }
  if (chat.histories.length > 0) {
    const history = `History of the story so far:\n` + chat.histories.join("\n");
    messages.push({
      role: "system",
      content: history
    })
  }
  if (chat.messages.length > 0) {
    messages.push(...chat.messages);
  }
  return {
    messages,
  } as ChatCompletionRequest;
}

let llmClient: LLMClient;
switch (env.LLM_PROVIDER) {
  case "ollama":
    llmClient = new OllamaClient(httpClient, env);
    break;
  case "openai":
    llmClient = new OpenAIClient(env);
    break;
  case "mock":
    llmClient = new MockClient();
    break;
  default:
    throw new Error("Invalid chat completion provider");
}

export default llmClient;