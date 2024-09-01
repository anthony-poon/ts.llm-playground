import {ArliAIEnv, ChatCompletionEnv, OllamaEnv} from '@env';
import loggerFactory from '@core/logger';
import {LLMClient, ChatCompletionResponse, toCompletionRequest} from '@client/llm';
import { AxiosInstance } from "axios"
import {Chat} from "@core/chat";
const logger = loggerFactory.create('ollama-client');

// https://github.com/ollama/ollama/blob/main/docs/api.md
interface ArliAIClientChatCompletionResponse {
  choices: {
    index: number
    message: {
      role: string,
      content: string,
      images: null|string
    }
  }[]
}


export class ArliAIClient implements LLMClient{
  constructor(
      private readonly client: AxiosInstance,
      private readonly env: ArliAIEnv & ChatCompletionEnv,
  ) {
    if (!env.ARLI_AI_BASE_URL || !env.ARLI_AI_API_KEY) {
      throw new Error("Missing required environment variable");
    }
  }
  async chat(chat: Chat): Promise<ChatCompletionResponse> {
    const request = toCompletionRequest(chat);
    const model = chat.model || this.env.ARLI_AI_MODEL;
    if (!model) {
      throw new Error('No model selected');
    }
    const response = await this.client.post<ArliAIClientChatCompletionResponse>("/chat/completions", {
      ...request,
      model,
      stream: false,
      options: {
        repetition_penalty: 1.1,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        max_tokens: this.env.CHAT_COMPLETION_CONTEXT_SIZE,
      }
    }, { ...this.getConfig() });
    return {
      message: response.data.choices[0]?.message?.content
    };
  }

  async ping() {
    const response = await this.client.post<ArliAIClientChatCompletionResponse>("/chat/completions", {
      model: this.env.ARLI_AI_MODEL,
      options: {
        num_ctx: 4096
      }
    }, { ...this.getConfig() });
    logger.debug('Response', response.data);
  }

  private getConfig = () => {
    return {
      baseURL: this.env.ARLI_AI_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.env.ARLI_AI_API_KEY}`
      }
    }
  }

  getModels = async () => {
    return Promise.resolve([
        "Meta-Llama-3.1-8B-Instruct",
        "Mistral-Nemo-12B-Instruct-2407",
        "Mistral-Nemo-12B-ArliAI-RPMax-v1.1",
        "Llama-3.1-70B-Instruct-Abliterated",
        "Llama-3.1-8B-Chinese-Chat"
    ])
  }
}