import {AxiosInstance} from "axios";
import env, {TelegramEnv} from "@env";
import loggerFactory from "@core/logger";
import httpClient from "@client/http";
import {SendMessageClientRequest} from "@client/telegram/type";

const API_BASE_URL = "https://api.telegram.org"

const logger = loggerFactory.create("telegram-client")




export class TelegramClient {
    constructor(
        private readonly axios: AxiosInstance,
        private readonly env: TelegramEnv,
    ) {
       if (!env.TELEGRAM_BOT_WEBHOOK_URL || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_BOT_USERNAME) {
           throw new Error("Missing required environment variable")
       }
    }

    // https://core.telegram.org/bots/api#setwebhook
    public setWebhook = async () => {
        logger.debug("Calling setWebhook endpoint");
        await this.axios.post(this.getFullPath('setWebhook'), {
            url: this.env.TELEGRAM_BOT_WEBHOOK_URL
        });
        return true;
    }

    public sendMessage = async (request: SendMessageClientRequest) => {
        logger.debug("Calling setWebhook endpoint");
        await this.axios.post(this.getFullPath("sendMessage"), {
            ...request
        })
    }

    private getFullPath = (path: string) => {
        return API_BASE_URL + `/bot${this.env.TELEGRAM_BOT_TOKEN}/${path}`
    }
}

const telegramClient = new TelegramClient(
    httpClient,
    env,
)

export default telegramClient;
