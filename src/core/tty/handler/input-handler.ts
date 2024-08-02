import {TTYContext, TTYHandler} from "@core/tty";
import ioStream, {IOStream} from "@core/stream";
import env, {AppEnv} from "@env";
import path from "path";
import fileIO, {FileIO} from "@core/io";
import _ from "lodash";

class InputHandler implements TTYHandler {
    constructor(
        private readonly ioStream: IOStream,
        private readonly fileIO: FileIO,
        private readonly env: Pick<AppEnv, "SESSIONS_FOLDER">,
    ) {}

    public async handle(context: TTYContext) {
        const input = await this.ioStream.read(">> ");
        if (!input.startsWith("/")) {
            context.chat.addUserMsg(input);
            context.request()
            context.next();
            return;
        }
        const match = input.match(/^\/([a-zA-Z]+) *(.*)/)
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
                context.chat.undo(2);
                context.next();
                return;
            case "retry":
                await this.retry(context);
                context.next();
                return;
            default:
                throw new Error("Invalid command");

        }
    }

    save = async (context: TTYContext, args: string) => {
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
        context.next();
    }

    load = async (context: TTYContext, args: string) => {
        if (args && !args.match(/^([0-9a-zA-Z]+$)/)) {
            throw new Error("Invalid sessions id");
        }
        const name = args ? args : "last_session";
        const content = await this.fileIO.read(path.join(this.env.SESSIONS_FOLDER, `${name}.json`));
        context.chat.hydrate(content.toString());
        context.next();
    }

    retry = async (context: TTYContext) => {
        const messages = context.chat.messages;
        const index = _.findLastIndex(messages, msg => msg.role === "user");
        if (index === -1) {
            return;
        }
        const lastMsg = messages[index];
        context.chat.undo(messages.length - index);
        context.chat.addUserMsg(lastMsg.content);
        context.request();
    }
}

const inputHandler = new InputHandler(ioStream, fileIO, env);

export default inputHandler;