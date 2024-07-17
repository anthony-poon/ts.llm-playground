import { Chat } from '@core/chat';
import { Handler } from '@core/chat/cmd/handler';
import { UndoHandler } from '@core/chat/cmd/handler/undo-handler';
import fileIO from '@core/io';
import { SaveHandler } from '@core/chat/cmd/handler/save-handler';
import { LoadHandler } from '@core/chat/cmd/handler/load-handler';
import { ExitHandler } from '@core/chat/cmd/handler/exit-handler';
import { RetryHandler } from '@core/chat/cmd/handler/retry-handler';

export interface CmdContext {
  chat: Chat,
  print: () => void,
  exit: () => void,
  retry: () => Promise<void>
}

export class CmdHandlerStack {
  private readonly handlers: {
    [key: string]: Handler;
  };
  constructor(handlers: { [key: string]: Handler }) {
    this.handlers = handlers;
  }

  public async handle(cmd: string, context: CmdContext) {
    const match = cmd.match(/^(\/[a-zA-Z]+) *(.*)/)
    if (!match) {
      throw new Error("Invalid input");
    }
    const [, prefix, affix] = match;
    const handler = this.handlers[prefix] ?? null;
    if (!handler) {
      throw new Error("Invalid command");
    }
    await handler.handle(affix, context);
  }
}

const handlerStack = new CmdHandlerStack({
  "/undo": new UndoHandler(),
  "/save": new SaveHandler(fileIO),
  "/load": new LoadHandler(fileIO),
  "/exit": new ExitHandler(),
  "/retry": new RetryHandler(),
})

export default handlerStack;