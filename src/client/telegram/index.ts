import {AxiosInstance} from "axios";
import env, {TelegramEnv} from "@env";
import loggerFactory from "@core/logger";
import httpClient from "@client/http";
import {SendMessageClientRequest} from "@client/telegram/type";
import _ from "lodash";

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
        if (request.text.length === 0) {
            logger.debug("Skipped setWebhook endpoint. Reason: 0 length input");
            return;
        }
        logger.debug("Calling setWebhook endpoint");
        const chunks = request.text.match(/.{1,4000}/g); // Split into size of 4000
        // Cannot use Promise.all, must be in order
        for (const chunk of chunks!) {
            await this.axios.post(this.getFullPath("sendMessage"), {
                ...request,
                text: chunk
            });
        }
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
