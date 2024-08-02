import {Chat} from "@core/chat";
import pingHandler from "@core/tty/handler/ping-handler";
import inputHandler from "@core/tty/handler/input-handler";
import completionHandler from "@core/tty/handler/completion-handler";
import printHandler from "@core/tty/handler/print-handler";

export interface TTYHandler {
    handle: (context: TTYContext) => Promise<void>;
}

export class TTYContext {
    private _hasRequest: boolean = false;
    private _hasNext: boolean = false;
    private _isDone: boolean = false;
    constructor(private readonly _chat: Chat) {
    }

    next = () => {
        this._hasNext = true;
    }

    done = () => {
        this._isDone = true;
    }

    request() {
        this._hasRequest = true;
    }

    get hasNext(): boolean {
        return this._hasNext;
    }

    get hasRequest(): boolean {
        return this._hasRequest;
    }

    get isDone(): boolean {
        return this._isDone;
    }

    get chat(): Chat {
        return this._chat;
    }
}

class TTY {
    private readonly handlers: TTYHandler[] = [];
    constructor() {
        this.handlers = [
            pingHandler,
            inputHandler,
            completionHandler,
            printHandler,
        ]
    }
    start = async (chat: Chat) => {
        let context
        do {
            context = new TTYContext(chat);
            for (const handler of this.handlers) {
                await handler.handle(context);
                if (context.isDone || !context.hasNext) {
                    break;
                }
            }
        } while (!context.isDone);
    }
}

const tty = new TTY();

export default tty;