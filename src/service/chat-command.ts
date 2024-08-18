import fileIO, {FileIO} from "@core/io";
import env, {AppEnv} from "@env";
import path from "path";
import {Chat} from "@core/chat";
import _ from "lodash";
import fs from "fs";
import loggerFactory from "@core/logger";

const PROMPT_FILE_REGEX = /^(?!.*\.dist\.txt$).*\.(\*\.txt|txt)$/;

export interface ChatCommandContext {
    done: boolean,
    repaint: () => void,
    retry: () => void,
    write: (msg: string) => void,
    reset: () => Promise<void>,
    chat: Chat,
}

export interface ChatCommandService {
    handle: (command: string, context: ChatCommandContext) => Promise<void>;
}

const logger = loggerFactory.create('chat-command-service');

class ChatCommandServiceImpl implements ChatCommandService{
    constructor(
        private readonly fileIO: FileIO,
        private readonly env: Pick<AppEnv, "SESSIONS_FOLDER"|"PROMPTS_FOLDER">,
    ) {}
    public handle = async (command: string, context: ChatCommandContext) => {
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
                context.write('Chat saved');
                return;
            case "load":
                await this.load(context, args);
                context.write('Chat loaded');
                return;
            case "undo":
                context.chat.undo();
                context.repaint();
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
                await context.reset();
                context.write('Chat reset');
                return;
            case "debug":
                context.write(JSON.stringify(context.chat.dehydrate(),null, 4))
                return;
            default:
                context.write("Invalid command");
        }
    }

    private save = async (context: ChatCommandContext, args: string) => {
        let name = "last_session";
        if (args) {
            const match = args.match(/^[0-9a-zA-Z ]+$/);
            if (!match) {
                throw new Error("Invalid file name");
            }
            name = match[0];
        }
        const json = context.chat.dehydrate();
        await this.fileIO.write(path.join(this.env.SESSIONS_FOLDER, `${name}.json`), json);
    }

    private load = async (context: ChatCommandContext, args: string) => {
        if (args && !args.match(/^([0-9a-zA-Z]+$)/)) {
            throw new Error("Invalid sessions id");
        }
        const name = args ? args : "last_session";
        const content = await this.fileIO.read(path.join(this.env.SESSIONS_FOLDER, `${name}.json`));
        context.chat.hydrate(content.toString());
    }

    private retry = async (context: ChatCommandContext) => {
        const messages = context.chat.messages;
        const index = _.findLastIndex(messages, msg => msg.role === "user");
        if (index === -1) {
            return;
        }
        const lastMsg = messages[index];
        context.chat.undo();
        context.chat.addUserMsg(lastMsg.content);
        await context.retry();
    }

    // TODO: caching?
    private prompts = async (context: ChatCommandContext, args: string) => {
        const files = fs.readdirSync(this.env.PROMPTS_FOLDER)
            .filter(file => file.match(PROMPT_FILE_REGEX))
            .sort()
            .map(file => file.slice(0, -4));
        if (args === "") {
            const msg = files.join("\n");
            context.write(msg);
            return;
        } else {
            const match = args.match(/(\d+)$/);
            let fileName;
            if (match) {
                const offset = parseInt(match[1], 10);
                // User input is 1 based
                fileName = files[offset - 1];
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
                await context.write("Prompt loaded.");
            } catch (e) {
                logger.info('Unable to read prompts', {
                    error: e
                });
                throw new Error("File not found");
            }
        }
    }

    private history = async (context: ChatCommandContext) => {
        const histories = context.chat.histories;
        if (histories.length === 0) {
            await context.write("History is empty");
        } else {
            await context.write("History:");
            await context.write(histories.join("\n"))
        }
    }
}

const chatCommandService = new ChatCommandServiceImpl(fileIO, env);

export default chatCommandService