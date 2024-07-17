import OpenAI from 'openai';
import env, { Env, OpenAIEnv } from '@env';
import loggerFactory from '@core/logger';
import { ChatCompletionClient, ChatCompletionRequest, ChatCompletionResponse } from '@client/index';

const logger = loggerFactory.create('open-ai-client');

export class OpenAIClient implements ChatCompletionClient {
  private readonly client;
  private readonly env;

  constructor(env: OpenAIEnv) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API Key");
    }
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.env = env;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    logger.debug('Request', request);
    const response = await this.client.chat.completions.create({
      ...request,
      model: this.env.OPENAI_MODEL || "gpt-4o",
    }) as OpenAI.Chat.ChatCompletion;
    const content = response?.choices[0]?.message?.content;
    if (!content) {
      logger.error("Invalid response returned from OpenAI", response)
      throw new Error("Invalid response returned from OpenAI");
    }
    return {
      message: response.choices[0].message.content || ""
    }
  }

  async ping() {
    const response = await this.client.chat.completions.create("/api/chat", {
      model: this.env.OLLAMA_MODEL || "llama3",
    });
    logger.debug('Response', response.data);
  }
}

const openai = new OpenAIClient(env);

export default openai;