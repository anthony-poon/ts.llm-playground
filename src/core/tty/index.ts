import {Chat, ChatMessage} from "@core/chat";
import ioStream, {IOStream} from "@core/stream";
import llmClient, {LLMClient} from "@client/llm";
import chatCommandService, {ChatCommandContext, ChatCommandService} from "@service/chat-command";

const formatMsg = (msg: ChatMessage) => {
    return `\x1b[33m[${msg.role}]: \x1b[37m${msg.content}`;
}

class TTY {
    constructor(
        private readonly cmd: ChatCommandService,
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
        await this.ioStream.clear();
        await chat.messages
            .map(msg => formatMsg(msg))
            .forEach(msg => this.ioStream.writeln(msg))
    }

    private handleHistory = async (story: Chat) => {
        const last = story.messages[story.messages.length - 1];
        if (!last) {
            return;
        }
        const history = new Chat();
        history.prompt = "" +
            "You are an assistant tasked with summarizing parts of a story into concise summaries. You will be provided with " +
            "previous summaries and the latest segment of the story. Please create a one line summary that seamlessly flows with " +
            "the earlier summaries. Please provide a concise summary of the following story paragraph, focusing only on the " +
            "factual events and character descriptions. Discard any opinions, interpretations, or non-factual content. " +
            "The summary should strictly include what happened and describe the characters involved. You will write only the summary but nothing else\n";
        story.histories.forEach(h => history.addHistory(h));
        history.addUserMsg(`Please summarise the following: ` + last.content);
        const response = await this.client.chat(history);
        story.addHistory(response.message);
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
            chat
        }
    }
}

const tty = new TTY(chatCommandService, ioStream, llmClient);

export default tty;