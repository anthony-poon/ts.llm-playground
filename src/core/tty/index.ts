import {Chat, ChatMessage} from "@core/chat";
import commandHandler, {CommandHandlerImpl} from "@core/tty/command-handler";
import ioStream, {IOStream} from "@core/stream";
import client, {ChatCompletionClient, ChatCompletionRequest} from "@client/index";

const toCompletionRequest = (chat: Chat) => {
    const prompt = chat.prompt;
    const messages = [];
    if (prompt) {
        messages.push({
            role: "system",
            content: prompt
        })
    }
    if (chat.histories.length > 0) {
        const history = `History of the story so far:\n` + chat.histories.join("\n");
        messages.push({
            role: "system",
            content: history
        })
    }
    if (chat.messages.length > 0) {
        messages.push(...chat.messages);
    }
    return {
        messages,
    } as ChatCompletionRequest;
}

const formatMsg = (msg: ChatMessage) => {
    return `\x1b[33m[${msg.role}]: \x1b[37m${msg.content}`;
}

export interface CommandHandler {
    handle: (command: string, context: TTYContext) => Promise<void>;
}

export class TTYContext {
    private _isDone: boolean = false;
    constructor(
        private readonly _chat: Chat,
        private readonly ioStream: IOStream,
        private readonly retryHandler: (chat: Chat) => Promise<void>
    ) {}

    done = () => {
        this._isDone = true;
    }

    repaint = () => {
        this.ioStream.clear();
        this._chat.messages
            .map(msg => formatMsg(msg))
            .forEach(msg => this.ioStream.writeln(msg))
    }

    retry = () => {
        return this.retryHandler(this._chat)
    }

    get isDone(): boolean {
        return this._isDone;
    }

    get chat(): Chat {
        return this._chat;
    }
}

class TTY {
    constructor(
        private readonly cmd: CommandHandlerImpl,
        private readonly ioStream: IOStream,
        private readonly client: ChatCompletionClient,
    ) {}
    start = async (chat: Chat) => {
        await this.client.ping();
        let context
        do {
            context = new TTYContext(chat, this.ioStream, this.handleRequest);
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
        } while (!context.isDone);
    }

    private handleRequest = async (chat: Chat) => {
        const request = toCompletionRequest(chat);
        const response = await this.client.chat(request);
        chat.addAssistantMsg(response.message);
        await this.handleHistory(chat);
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
        const response = await this.client.chat(toCompletionRequest(history));
        story.addHistory(response.message);
    }
}

const tty = new TTY(commandHandler, ioStream, client);

export default tty;