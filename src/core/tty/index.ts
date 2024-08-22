import {Chat, ChatMessage} from "@core/chat";
import ioStream, {IOStream} from "@core/stream";
import llmClient, {LLMClient} from "@client/llm";
import chatCommandService, {ChatCommandContext, ChatCommandService} from "@service/chat-command";
import llmProvider from "@client/llm";
import env, {AppEnv} from "@env";
import path from "path";

const formatMsg = (msg: ChatMessage) => {
    return `\x1b[33m[${msg.role}]: \x1b[37m${msg.content}`;
}

class TTY {
    constructor(
        private readonly cmd: ChatCommandService,
        private readonly ioStream: IOStream,
        private readonly client: LLMClient,
        private readonly env: Pick<AppEnv, "LLM_PROVIDER"|"PROMPTS_FOLDER"|"SESSIONS_FOLDER">
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
                    await this.handleRequest(context.chat);
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
        // await this.handleHistory(chat);
        this.ioStream.clear();
        chat.messages
            .map(msg => formatMsg(msg))
            .forEach(msg => this.ioStream.writeln(msg))
    }

    private createContext = (chat: Chat): ChatCommandContext => {
        return {
            done: false,
            repaint: async () => {
                this.ioStream.clear();
                chat.messages
                    .map(msg => formatMsg(msg))
                    .forEach(msg => this.ioStream.writeln(msg))
            },
            retry: async () => await this.handleRequest(chat),
            write: async (msg: string) => await this.ioStream.writeln(msg),
            reset: async () => {
                chat.clear();
                this.ioStream.clear();
            },
            chat,
            provider: this.env.LLM_PROVIDER,
            pathToPrompts: path.join(this.env.PROMPTS_FOLDER),
            pathToSessions: path.join(this.env.SESSIONS_FOLDER),
        }
    }
}

const tty = new TTY(chatCommandService, ioStream, llmProvider.getDefaultClient(), env);

export default tty;