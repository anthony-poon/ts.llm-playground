import { Handler } from '@core/chat/cmd/handler';
import { CmdContext } from '@core/chat/cmd';
import { Chat } from '@core/chat';

export interface ExitHandlerContext {
  exit: () => void
}

export class ExitHandler implements Handler {
  async handle(args: string, context: ExitHandlerContext) {
    context.exit();
  }
}