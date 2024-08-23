import {Chat, ChatMessage} from "@core/chat";
import ioStream, {IOStream} from "./io-stream";
import {LLMClient} from "@client/llm";
import llmProvider from "@client/llm";
import ttyCommand, { TTYCommand } from './command';
import { TTYCommandContext } from './command';

export const formatMsg = (msg: ChatMessage) => {
    return `\x1b[33m[${msg.role}]: \x1b[37m${msg.content}`;
}

export const sendRequest = async (client: LLMClient, ioStream: IOStream, chat: Chat) => {
    const response = await client.chat(chat);
    chat.addAssistantMsg(response.message);
    ioStream.clear();
    chat.messages
      .map(msg => formatMsg(msg))
      .forEach(msg => ioStream.writeln(msg))
}

class TTY {
    constructor(
        private readonly cmd: TTYCommand,
        private readonly ioStream: IOStream,
        private readonly client: LLMClient,
    ) {}
    start = async (chat: Chat) => {
        await this.client.ping();
        let context
        do {
            context = this.createContext(chat);
            try {
                const input = (await this.ioStream.read(">> ")).trim();
                if (!input.startsWith("/")) {
                    context.chat.addUserMsg(input);
                    await sendRequest(this.client, this.ioStream, context.chat);
                } else {
                    await this.cmd.handle(input, context);
                }
            } catch (e) {
                await this.ioStream.writeln((e as Error).message);
            }
        } while (!context.done);
    }

    private handleRequest = async (chat: Chat) => {
        const response = await this.client.chat(chat);
        chat.addAssistantMsg(response.message);
        this.ioStream.clear();
        chat.messages
            .map(msg => formatMsg(msg))
            .forEach(msg => this.ioStream.writeln(msg))
    }

    private createContext = (chat: Chat): TTYCommandContext => {
        return {
            done: false,
            chat,
            sendRequest: async (chat: Chat) => sendRequest(this.client, this.ioStream, chat),
            client: this.client
        }
    }
}

const tty = new TTY(ttyCommand, ioStream, llmProvider.getDefaultClient());

export default tty;