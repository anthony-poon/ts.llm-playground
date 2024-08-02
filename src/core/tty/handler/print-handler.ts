import {TTYContext, TTYHandler} from "@core/tty";
import {ChatMessage} from "@core/chat";
import ioStream, {IOStream} from "@core/stream";

class PrintHandler implements TTYHandler {
    constructor(private readonly ioStream: IOStream) {
    }
    handle = async (context: TTYContext) => {
        await this.ioStream.print(context.chat.messages.map(msg => this.format(msg)));
        context.next();
    }
    private format = (msg: ChatMessage) => {
        return `\x1b[33m[${msg.role}]: \x1b[37m${msg.content}\n`;
    }
}

const printHandler = new PrintHandler(ioStream);

export default printHandler;