import { ChatBuilder } from '@core/chat';
import process from 'process';
import tty from "@core/tty";

(async () => {
  const chat = ChatBuilder.noPrompt();
  await tty.start(chat);
  process.exit(0);
})()