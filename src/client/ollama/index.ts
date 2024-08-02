import env, {ChatCompletionEnv, OllamaEnv} from '@env';
import loggerFactory from '@core/logger';
import { ChatCompletionClient, ChatCompletionRequest, ChatCompletionResponse } from '@client/index';
import axios, { AxiosInstance } from "axios"
const logger = loggerFactory.create('open-ai-client');

// https://github.com/ollama/ollama/blob/main/docs/api.md
interface OllamaChatCompletionResponse {
  message: {
    role: string,
    content: string,
    images: null|string
  }
}

export class OllamaClient implements ChatCompletionClient{
  private readonly client: AxiosInstance;
  private readonly env: OllamaEnv;

  constructor(env: OllamaEnv & ChatCompletionEnv) {
    if (!env.OLLAMA_BASE_URL) {
      throw new Error("Missing OLLAMA_BASE_URL")
    }
    this.client = axios.create({
      baseURL: env.OLLAMA_BASE_URL,
    });
    this.env = env;
  }
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    logger.debug('Request', request);
    const response = await this.client.post<OllamaChatCompletionResponse>("/api/chat", {
      ...request,
      model: this.env.OLLAMA_MODEL || "llama3",
      stream: false,
      options: {
        // https://github.com/ollama/ollama/blob/main/docs/modelfile.md
        num_ctx: 4096,
        temperature: 1,   // creativeness; default 0.7
        num_predict: -2,
        top_k: 60,        // low = conservative, high = diverse; default 40
        top_p: 0.9,       // low = conservative, high = diverse; default 0.9
        min_p: 0.05      // ensure p value not too low; default 0
      }
    });
    logger.debug('Response', response.data);
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
    });
    logger.debug('Response', response.data);
  }
}