import {AxiosInstance} from "axios";
import env, {TelegramEnv} from "@env";
import loggerFactory from "@core/logger";
import httpClient from "@client/http";

const API_BASE_URL = "https://api.telegram.org"

const logger = loggerFactory.create("telegram-client")

export interface SendMessageClientRequest {
    chat_id: number,
    text: string,
}

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
        const chunks = this.textToChunk(request.text); // Split into size of 4000
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

    private textToChunk = (text: string) => {
        const size = this.env.TELEGRAM_MAX_TEXT_LENGTH || 4000;
        const rtn = [];
        let trimmed = text.trim();
        while (trimmed.length > 0) {
            let end = size;
            if (end >= trimmed.length) {   // Push the remaining
                rtn.push(trimmed);
                break;
            }
            let space = this.lastIndexOfAny([' ', '\n', '\r'], trimmed, end);
            if (space === -1) {
                space = end;  // This means we split at maxChunkSize, even if it splits a word
            }
            rtn.push(trimmed.slice(0, space).trim());
            trimmed = trimmed.slice(space).trim()
        }
        return rtn;
    }

    private lastIndexOfAny(needles: string[], arr: string, end: number) {
        let last = -1;
        for (let i = 0; i < needles.length; i++) {
            const index = arr.lastIndexOf(needles[i], end);
            if (index > last) {
                last = index;
            }
        }
        return last;
    }
}

const telegramClient = new TelegramClient(
    httpClient,
    env,
)

export default telegramClient;
