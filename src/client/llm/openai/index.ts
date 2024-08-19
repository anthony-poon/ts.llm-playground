import OpenAI from 'openai';
import { OpenAIEnv } from '@env';
import loggerFactory from '@core/logger';
import {LLMClient, ChatCompletionRequest, ChatCompletionResponse, toCompletionRequest} from '@client/llm';
import {Chat} from "@core/chat";

const logger = loggerFactory.create('open-ai-client');

export class OpenAIClient implements LLMClient {
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

  async chat(chat: Chat): Promise<ChatCompletionResponse> {
    const request = toCompletionRequest(chat);
    logger.debug('Request', request);
    const response = await this.client.chat.completions.create({
      ...request,
      model: this.env.OPENAI_MODEL || "gpt-4o",
      stream: false,
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
    return; // No need to ping to warm up the endpoint
  }

  public getModels() {
    return Promise.resolve(null);
  }
}