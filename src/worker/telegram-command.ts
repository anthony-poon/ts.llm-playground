import fileIO, {FileIO} from "@core/io";
import path from "path";
import {Chat} from "@core/chat";
import _ from "lodash";
import loggerFactory from "@core/logger";
import llmProvider, { LLMClient, LLMProvider } from '@client/llm';
import env, { AppEnv, TelegramBotEnv } from '@env';

const PROMPT_FILE_REGEX = /^(?!.*\.dist\.txt$).*\.(\*\.txt|txt)$/;

export interface TelegramCommandContext {
    done: boolean,
    chat: Chat,
    sendRequest: (chat: Chat) => Promise<void>,
    reply: (content: string) => Promise<void>,
    client: LLMClient,
    env: TelegramBotEnv,
}

const logger = loggerFactory.create('chat-command-service');

export class TelegramCommand {
    constructor(
        private readonly fileIO: FileIO,
        private readonly env: Pick<AppEnv, "PROMPTS_FOLDER">
    ) {}
    public handle = async (command: string, context: TelegramCommandContext) => {
        const match = command.match(/^\/([a-zA-Z]+) *(.*)/)
        if (!match) {
            throw new Error("Invalid input");
        }
        const [, prefix, args] = match;
        switch (prefix) {
            case "exit":
                context.done = true;
                return;
            case "undo":
                context.chat.undo();
                await context.reply('Message undone.');
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
                await this.reset(context, args);
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
                await context.reply("Invalid command");
        }
    }

    private retry = async (context: TelegramCommandContext) => {
        const messages = context.chat.messages;
        const index = _.findLastIndex(messages, msg => msg.role === "user");
        if (index === -1) {
            return;
        }
        const lastMsg = messages[index];
        context.chat.undo();
        context.chat.addUserMsg(lastMsg.content);
        await context.reply("Retrying");
        await context.sendRequest(context.chat);
    }

    // TODO: caching?
    private prompts = async (context: TelegramCommandContext, args: string) => {
        const folder = context.env.PROMPTS_FOLDER || path.join(this.env.PROMPTS_FOLDER, context.env.NAMESPACE);
        this.fileIO.mkdir(folder);
        const files = this.fileIO.ls(folder)
            .filter(file => file.match(PROMPT_FILE_REGEX))
            .map(file => file.slice(0, -4));
        if (!files || files.length === 0) {
            await context.reply("No prompt available.");
            return;
        }
        if (args === "") {
            await context.reply(this.printArray(files));
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
                const content = await this.fileIO.read(path.join(folder, `${fileName}.txt`));
                context.chat.prompt = content.toString();
                await context.reply("Prompt loaded.");
            } catch (e) {
                logger.info('Unable to read prompts', {
                    error: e
                });
                throw new Error("File not found");
            }
        }
    }

    private history = async (context: TelegramCommandContext) => {
        const histories = context.chat.histories;
        if (histories.length === 0) {
            await context.reply("History is empty");
        } else {
            await context.reply("History:");
            await context.reply(histories.join("\n"))
        }
    }

    private story(context: TelegramCommandContext, args: string) {
        if (args.length === 0) {
            return;
        }
        context.chat.story = args;
    }

    private model = async (context: TelegramCommandContext, args: string) => {
        const models = await context.client.getModels();
        if (!models || models.length === 0) {
            await context.reply("No models available.");
            return;
        }
        if (args.length === 0) {
            await context.reply(this.printArray(models));
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
            await context.reply("Invalid models selected");
            return;
        }
        context.chat.model = selected;
        await context.reply("Model selected.");
    }

    private printArray = (arr: string[]) => {
        let offset = 0;
        let rtn = "";
        arr.forEach(a => rtn += (offset++) + ". " + a + "\n");
        return rtn;
    }

    private debug = async (context: TelegramCommandContext) => {
        const message = context.chat.messages.map(msg => msg.content.length >= 100 ? msg.content.slice(0, 100) + "..." : msg.content);
        await context.reply(JSON.stringify({
            prompt: context.chat.prompt,
            story: context.chat.story,
            message,
            model: context.chat.model
        }, null, 4))
    }

    private reset = async (context: TelegramCommandContext, args: string) => {
        if (args.trim().length === 0) {
            context.chat.clear();
            await context.reply('Chat reset');
            return
        }
        if ("history".startsWith(args)) {
            context.chat.histories = [];
            await context.reply('History reset');
            return;
        }
        if ("story".startsWith(args)) {
            context.chat.story = "";
            await context.reply('Story reset');
            return
        }
        if ("prompt".startsWith(args)) {
            context.chat.prompt = "";
            await context.reply('Prompt reset');
            return
        }
        if ("messages".startsWith(args)) {
            context.chat.clearMessages();
            await context.reply('Messages reset');
            return;
        }
    }
}

const telegramCommand = new TelegramCommand(fileIO, env);

export default telegramCommand