import {ChatCompletionEnv, OllamaEnv} from '@env';
import loggerFactory from '@core/logger';
import {LLMClient, ChatCompletionResponse, toCompletionRequest} from '@client/llm';
import { AxiosInstance } from "axios"
import {Chat} from "@core/chat";
const logger = loggerFactory.create('ollama-client');

// https://github.com/ollama/ollama/blob/main/docs/api.md
interface OllamaChatCompletionResponse {
  message: {
    role: string,
    content: string,
    images: null|string
  }
}

interface OllamaListModelsResponse {
  models: {
    name: string,
  } & Record<string, any>[] ;
}


export class OllamaClient implements LLMClient{
  constructor(
      private readonly client: AxiosInstance,
      private readonly env: OllamaEnv & ChatCompletionEnv,
  ) {
    if (!env.OLLAMA_BASE_URL || !env.OLLAMA_BASIC_AUTH_USER || !env.OLLAMA_BASIC_AUTH_PASS) {
      throw new Error("Missing required environment variable");
    }
  }
  async chat(chat: Chat): Promise<ChatCompletionResponse> {
    const request = toCompletionRequest(chat);
    const model = chat.model || this.env.OLLAMA_MODEL;
    if (!model) {
      throw new Error('No model selected');
    }
    const response = await this.client.post<OllamaChatCompletionResponse>("/api/chat", {
      ...request,
      model,
      stream: false,
      options: {
        // https://github.com/ollama/ollama/blob/main/docs/modelfile.md
        // repeat_last_n: -1,
        // repeat_penalty: 1.5,
        num_ctx: this.env.CHAT_COMPLETION_CONTEXT_SIZE,
        // temperature: 1.2,   // creativeness; default 0.7
        // num_predict: -2,
        // top_k: 80,        // low = conservative, high = diverse; default 40
        // top_p: 1.2,       // low = conservative, high = diverse; default 0.9
        // min_p: 0.05      // ensure p value not too low; default 0
      }
    }, { ...this.getConfig() });
    return {
      message: response.data.message.content
    };
  }

  async ping() {
    const response = await this.client.post<OllamaChatCompletionResponse>("/api/chat", {
      model: this.env.OLLAMA_MODEL || "llama3",
      options: {
        num_ctx: 4096
      }
    }, { ...this.getConfig() });
    logger.debug('Response', response.data);
  }

  private getConfig = () => {
    return {
      baseURL: this.env.OLLAMA_BASE_URL,
      auth: {
        username: this.env.OLLAMA_BASIC_AUTH_USER,
        password: this.env.OLLAMA_BASIC_AUTH_PASS
      }
    }
  }

  getModels = async () => {
    const response = await this.client.get<OllamaListModelsResponse>("/api/tags", { ...this.getConfig() });
    return response.data.models.map(m => m.name);
  }
}