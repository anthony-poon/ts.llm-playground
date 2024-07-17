import { Handler } from '@core/chat/cmd/handler/index';
import { FileIO } from '@core/io';
import { Chat } from '@core/chat';

export interface LoadHandlerContext {
  chat: Chat,
  print: () => void
}

export class LoadHandler implements Handler {
  constructor(readonly io: FileIO) {
  }
  handle = async (args: string, context: LoadHandlerContext) => {
    if (args && !args.match(/^([0-9a-zA-Z]+$)/)) {
      throw new Error("Invalid session id");
    }
    const name = args ? args : "last_session";
    const content = await this.io.read(['session', `${name}.json`]);
    context.chat.hydrate(content.toString());
    await context.print();
  }
}