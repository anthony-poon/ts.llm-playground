import {AxiosInstance} from "axios";
import {TelegramEnv} from "@env";
import {TelegramClient} from "@client/telegram/index";

const mock = () => {
    const axios = {
        post: jest.fn()
    } as unknown as AxiosInstance
    const env = {
        TELEGRAM_BOT_USERNAME: "some-username",
        TELEGRAM_BOT_TOKEN: "some-token",
        TELEGRAM_BOT_WEBHOOK_URL: "https://some-url.com"
    } as TelegramEnv
    return { axios, env };
}

describe("Telegram client test", () => {
    it("should call API when send message", async () => {
        const { axios, env } = mock();
        const client = new TelegramClient(axios, env);
        await client.sendMessage({
            chat_id: 1234,
            text: "some-text"
        });
        expect(axios.post).toHaveBeenCalledWith("https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "some-text"})
    })

    it("should call API one with multi-line message", async () => {
        const { axios, env } = mock();
        env.TELEGRAM_MAX_TEXT_LENGTH = 4;
        const client = new TelegramClient(axios, env);
        await client.sendMessage({
            chat_id: 1234,
            text: "some text\nsome test two"
        });
        expect(axios.post).toHaveBeenCalledTimes(5);
        expect(axios.post).toHaveBeenNthCalledWith(1, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "some"})
        expect(axios.post).toHaveBeenNthCalledWith(2, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "text"})
        expect(axios.post).toHaveBeenNthCalledWith(3, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "some"})
        expect(axios.post).toHaveBeenNthCalledWith(4, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "test"})
        expect(axios.post).toHaveBeenNthCalledWith(5, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "two"})
    })

    it("should avoid splitting words if possible", async () => {
        const { axios, env } = mock();
        env.TELEGRAM_MAX_TEXT_LENGTH = 4;
        const client = new TelegramClient(axios, env);
        await client.sendMessage({
            chat_id: 1234,
            text: "so me-text\nsome test two"
        });
        expect(axios.post).toHaveBeenCalledTimes(6);
        expect(axios.post).toHaveBeenNthCalledWith(1, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "so"})
        expect(axios.post).toHaveBeenNthCalledWith(2, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "me-t"})
        expect(axios.post).toHaveBeenNthCalledWith(3, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "ext"})
        expect(axios.post).toHaveBeenNthCalledWith(4, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "some"})
        expect(axios.post).toHaveBeenNthCalledWith(5, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "test"})
        expect(axios.post).toHaveBeenNthCalledWith(6, "https://api.telegram.org/botsome-token/sendMessage", {"chat_id": 1234, "text": "two"})
    })
})
