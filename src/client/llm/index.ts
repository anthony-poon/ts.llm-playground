import env, {AppEnv} from "@env";
import {OllamaClient} from "@client/llm/ollama";
import {OpenAIClient} from "@client/llm/openai";
import {MockClient} from "@client/llm/mock";
import httpClient from "@client/http";
import {Chat} from "@core/chat";
import loggerFactory from "@core/logger";

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

const logger = loggerFactory.create('llm-provider');

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

interface LLMProviderMapping {
  [key: string]: () => LLMClient;
}

export class LLMProvider {
  constructor(
      private readonly mapping: LLMProviderMapping,
      private readonly env: Pick<AppEnv, "LLM_PROVIDER">
  ) {}

  public getDefaultClient = (): LLMClient => {
    return this.getClient(this.env.LLM_PROVIDER);
  }

  public getClient = (provider: string): LLMClient => {
    const factory = this.mapping[provider] ?? null;
    if (!factory) {
      logger.error('Invalid provider', {
        provider
      })
      throw new Error("Invalid provider name");
    }
    return factory();
  }
}

const llmProvider = new LLMProvider({
  openai: () => new OpenAIClient(env),
  ollama: () => new OllamaClient(httpClient, env),
  mock: () => new MockClient()
}, env)

export default llmProvider;