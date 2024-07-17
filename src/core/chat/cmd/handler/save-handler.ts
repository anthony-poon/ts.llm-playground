import { CmdContext } from '@core/chat/cmd';
import { FileIO } from '@core/io';
import { Handler } from '@core/chat/cmd/handler/index';
import { Chat } from '@core/chat';
export interface SaveHandlerContext {
  chat: Chat,
}

export class SaveHandler implements Handler {
  constructor(readonly io: FileIO) {
  }
  async handle(args: string, context: SaveHandlerContext) {
    let name = "last_session";
    if (args) {
      const match = args.match(/^[0-9a-zA-Z ]+$/);
      if (!match) {
        throw new Error("Invalid file name");
      }
      name = match[0];
    }
    const json = context.chat.dehydrate();
    await this.io.write(['session', `${name}.json`], json);
  }
}