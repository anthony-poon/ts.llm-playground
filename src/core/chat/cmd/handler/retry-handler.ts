import { Handler } from '@core/chat/cmd/handler';
import { CmdContext } from '@core/chat/cmd';
import { Chat } from '@core/chat';

export interface RetryHandlerContext {
  retry: () => Promise<void>
}

export class RetryHandler implements Handler {
  async handle(args: string, context: RetryHandlerContext) {
    await context.retry();
  }
}