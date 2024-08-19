import fileIO, {FileIO} from "@core/io";
import env, {AppEnv} from "@env";
import path from "path";
import {Chat} from "@core/chat";
import _ from "lodash";
import fs from "fs";
import loggerFactory from "@core/logger";
import llmClient, {LLMClient} from "@client/llm";

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
        private readonly llmClient: LLMClient,
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
                this.debug(context, args);
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
            context.write(this.printArray(files));
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
            context.write("History is empty");
        } else {
            context.write("History:");
            context.write(histories.join("\n"))
        }
    }

    private story(context: ChatCommandContext, args: string) {
        if (args.length === 0) {
            return;
        }
        context.chat.story = args;
    }

    private model = async (context: ChatCommandContext, args: string) => {
        const models = await this.llmClient.getModels();
        if (!models || models.length === 0) {
            context.write("No models available.");
            return;
        }
        if (args.length === 0) {
            context.write(this.printArray(models));
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
            context.write("Invalid models selected");
            return;
        }
        context.chat.model = selected;
        context.write("Model selected.");
    }

    private printArray = (arr: string[]) => {
        let offset = 0;
        let rtn = "";
        arr.forEach(a => rtn += (offset++) + ". " + a + "\n");
        return rtn;
    }

    private debug(context: ChatCommandContext, args: string) {
        const message = context.chat.messages.map(msg => msg.slice(0, 100));
        context.write(JSON.stringify({
            prompt: context.chat.prompt,
            story: context.chat.story,
            message
        }, null, 4))
    }
}

const chatCommandService = new ChatCommandServiceImpl(fileIO, llmClient, env);

export default chatCommandService