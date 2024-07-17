import { ChatBuilder } from '@core/chat';
import { ChatTTY } from '@core/chat/chat-tty';
import openai from '@client/openai';
import process from 'process';

(async () => {
  const chat = ChatBuilder.noPrompt();
  const console = ChatTTY.console(openai, chat);
  await console.start();
  process.exit(0);
})()