import { Handler } from '@core/chat/cmd/handler';
import { CmdContext } from '@core/chat/cmd';
import { Chat } from '@core/chat';

export interface UndoHandlerContext {
  chat: Chat,
  print: () => void
}

export class UndoHandler implements Handler {
  async handle(args: string, context: UndoHandlerContext) {
    // 2 because usually we want to undo request and reply together
    // TODO: Undo by role instead of hard coding
    const count = parseInt(args) || 2;
    if (count <= 0) {
      throw new Error("Invalid undo count");
    }
    context.chat.undo(count);
    context.print();
  }
}