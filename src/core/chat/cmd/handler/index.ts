import { CmdContext } from '@core/chat/cmd';

export interface Handler {
  handle(cmd: string, context: Partial<CmdContext>): Promise<void>
}
