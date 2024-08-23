import fileIO, {FileIO} from "@core/io";
import path from "path";
import {Chat} from "@core/chat";
import _ from "lodash";
import loggerFactory from "@core/logger";
import llmProvider, { LLMClient, LLMProvider } from '@client/llm';
import env, { AppEnv } from '@env';
import ioStream, { IOStream } from './io-stream';
import { formatMsg, sendRequest } from './index';

const PROMPT_FILE_REGEX = /^(?!.*\.dist\.txt$).*\.(\*\.txt|txt)$/;

export interface TTYCommandContext {
    done: boolean,
    chat: Chat,
    sendRequest: (chat: Chat) => Promise<void>,
    client: LLMClient,
}

const logger = loggerFactory.create('tty-command');

export class TTYCommand {
    constructor(
        private readonly fileIO: FileIO,
        private readonly ioStream: IOStream,
        private readonly env: Pick<AppEnv, "SESSIONS_FOLDER"|"PROMPTS_FOLDER">,
    ) {}
    public handle = async (command: string, context: TTYCommandContext) => {
        const match = command.match(/^\/([a-zA-Z]+) *(.*)/)
        if (!match) {
            throw new Error("Invalid input");
        }
        const [, prefix, args] = match;
        switch (prefix) {
            case "exit":
                context.done = true;
                return;
            case "save":
                await this.save(context, args);
                return;
            case "load":
                await this.load(context, args);
                return;
            case "undo":
                context.chat.undo();
                this.ioStream.clear();
                context.chat.messages
                  .map(msg => formatMsg(msg))
                  .forEach(msg => this.ioStream.writeln(msg))
                return;
            case "retry":
                await this.retry(context);
                return;
            case "p":
            case "prompts":
            case "prompt":
                await this.prompts(context, args);
                return;
            case "h":
            case "history":
                await this.history(context);
                return
            case "reset":
                context.chat.clear();
                this.ioStream.clear();
                await this.ioStream.writeln('Chat reset');
                return;
            case "debug":
                await this.debug(context);
                return;
            case "s":
            case "story":
                this.story(context, args);
                return;
            case "m":
            case "model":
            case "models":
                await this.model(context, args);
                return;
            default:
                await this.ioStream.writeln("Invalid command");
        }
    }

    private save = async (context: TTYCommandContext, args: string) => {
        let name = "last_session";
        if (args) {
            const match = args.match(/^[0-9a-zA-Z ]+$/);
            if (!match) {
                throw new Error("Invalid file name");
            }
            name = match[0];
        }
        const json = context.chat.dehydrate();
        this.fileIO.mkdir(this.env.SESSIONS_FOLDER);
        await this.fileIO.write(path.join(this.env.SESSIONS_FOLDER, `${name}.json`), json);
        await this.ioStream.writeln('Chat saved');
    }

    private load = async (context: TTYCommandContext, args: string) => {
        if (args && !args.match(/^([0-9a-zA-Z]+$)/)) {
            throw new Error("Invalid sessions id");
        }
        const name = args ? args : "last_session";
        const content = await this.fileIO.read(path.join(this.env.SESSIONS_FOLDER, `${name}.json`));
        context.chat.hydrate(content.toString());
        await this.ioStream.writeln('Chat loaded');
    }

    private retry = async (context: TTYCommandContext) => {
        const messages = context.chat.messages;
        const index = _.findLastIndex(messages, msg => msg.role === "user");
        if (index === -1) {
            return;
        }
        const lastMsg = messages[index];
        context.chat.undo();
        context.chat.addUserMsg(lastMsg.content);
        await context.sendRequest(context.chat);
    }

    // TODO: caching?
    private prompts = async (context: TTYCommandContext, args: string) => {
        const folder = this.env.PROMPTS_FOLDER;
        this.fileIO.mkdir(folder);
        const files = this.fileIO.ls(this.env.PROMPTS_FOLDER)
            .filter(file => file.match(PROMPT_FILE_REGEX))
            .map(file => file.slice(0, -4));
        if (!files || files.length === 0) {
            await this.ioStream.writeln("No prompt available.");
            return;
        }
        if (args === "") {
            await this.ioStream.writeln(this.printArray(files));
            return;
        } else {
            const match = args.match(/(\d+)$/);
            let fileName;
            if (match) {
                const offset = parseInt(match[1], 10);
                fileName = files[offset];
                if (!fileName) {
                    throw new Error("Invalid prompt offset");
                }
            } else {
                if (!files.includes(args)) {
                    throw new Error("Invalid prompt name");
                }
                fileName = args;
            }
            try {
                const content = await this.fileIO.read(path.join(this.env.PROMPTS_FOLDER, `${fileName}.txt`));
                context.chat.prompt = content.toString();
                await this.ioStream.writeln("Prompt loaded.");
            } catch (e) {
                logger.info('Unable to read prompts', {
                    error: e
                });
                throw new Error("File not found");
            }
        }
    }

    private history = async (context: TTYCommandContext) => {
        const histories = context.chat.histories;
        if (histories.length === 0) {
            await this.ioStream.writeln("History is empty");
        } else {
            await this.ioStream.writeln("History:");
            await this.ioStream.writeln(histories.join("\n"))
        }
    }

    private story(context: TTYCommandContext, args: string) {
        if (args.length === 0) {
            return;
        }
        context.chat.story = args;
    }

    private model = async (context: TTYCommandContext, args: string) => {
        const models = await context.client.getModels();
        if (!models || models.length === 0) {
            await this.ioStream.writeln("No models available.");
            return;
        }
        if (args.length === 0) {
            await this.ioStream.writeln(this.printArray(models));
            return;
        }
        const match = args.match(/(\d+)$/);
        let selected;
        if (match) {
            const offset = parseInt(match[1], 10);
            selected = models[offset]
        } else {
            selected = args;
        }
        if (!selected || !models.includes(selected)) {
            await this.ioStream.writeln("Invalid models selected");
            return;
        }
        context.chat.model = selected;
        await this.ioStream.writeln("Model selected.");
    }

    private printArray = (arr: string[]) => {
        let offset = 0;
        let rtn = "";
        arr.forEach(a => rtn += (offset++) + ". " + a + "\n");
        return rtn;
    }

    private debug = async (context: TTYCommandContext) => {
        const message = context.chat.messages.map(msg => msg.content.length >= 100 ? msg.content.slice(0, 100) + "..." : msg.content);
        await this.ioStream.writeln(JSON.stringify({
            prompt: context.chat.prompt,
            story: context.chat.story,
            message
        }, null, 4))
    }
}

const ttyCommand = new TTYCommand(fileIO, ioStream, env);

export default ttyCommand