import {TTYContext, CommandHandler} from "@core/tty/index";
import ioStream, {IOStream} from "@core/stream";
import env, {AppEnv} from "@env";
import path from "path";
import fileIO, {FileIO} from "@core/io";
import _ from "lodash";
import client, {ChatCompletionClient} from "@client/index";
import fs from "fs";
import loggerFactory from "@core/logger";

const PROMPT_FILE_REGEX = /^(?!.*\.dist\.txt$).*\.(\*\.txt|txt)$/;

const logger = loggerFactory.create('input-handler');

export class CommandHandlerImpl implements CommandHandler {
    constructor(
        private readonly client: ChatCompletionClient,
        private readonly ioStream: IOStream,
        private readonly fileIO: FileIO,
        private readonly env: Pick<AppEnv, "SESSIONS_FOLDER"|"PROMPTS_FOLDER">,
    ) {}

    public async handle(command: string, context: TTYContext) {
        const match = command.match(/^\/([a-zA-Z]+) *(.*)/)
        if (!match) {
            throw new Error("Invalid input");
        }
        const [, prefix, args] = match;
        switch (prefix) {
            case "exit":
                context.done();
                return;
            case "save":
                await this.save(context, args);
                return;
            case "load":
                await this.load(context, args);
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
                await this.history(context, args);
                return
            default:
                throw new Error("Invalid command");

        }
    }

    private save = async (context: TTYContext, args: string) => {
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

    private load = async (context: TTYContext, args: string) => {
        if (args && !args.match(/^([0-9a-zA-Z]+$)/)) {
            throw new Error("Invalid sessions id");
        }
        const name = args ? args : "last_session";
        const content = await this.fileIO.read(path.join(this.env.SESSIONS_FOLDER, `${name}.json`));
        context.chat.hydrate(content.toString());
    }

    private retry = async (context: TTYContext) => {
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

    // TODO: caching
    private prompts = async (context: TTYContext, args: string) => {
        const files = fs.readdirSync(this.env.PROMPTS_FOLDER)
            .filter(file => file.match(PROMPT_FILE_REGEX))
            .sort()
            .map(file => file.slice(0, -4));
        if (args === "") {
            files.forEach(file => this.ioStream.writeln(file));
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
                await this.ioStream.writeln("Prompt loaded.");
            } catch (e) {
                logger.info('Unable to read prompts', {
                    error: e
                });
                throw new Error("File not found");
            }
        }
    }

    private history = async (context: TTYContext, args: string) => {
        const histories = context.chat.histories;
        if (histories.length === 0) {
            await this.ioStream.writeln("History is empty");
        } else {
            await this.ioStream.writeln("History:");
            await this.ioStream.writeln(histories.join("\n"))
        }
    }
}

const inputHandler = new CommandHandlerImpl(client, ioStream, fileIO, env);

export default inputHandler;