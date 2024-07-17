import { Chat } from '@core/chat';
import { ChatTTY } from '@core/chat/chat-tty';
import process from 'process';
import env from '@env';
import path from 'path';
import fs from 'fs';
import ollama from '@client/ollama';
import loggerFactory from "@core/logger";

const logger = loggerFactory.create('__main__');

(async () => {
  logger.debug('Process started');
  const chat = new Chat();
  if (env.PROMPT_FILE) {
    const prompt = await fs.readFileSync(path.join(env.PATH_TO_ASSETS, env.PROMPT_FILE));
    chat.addPrompt(prompt.toString());
    logger.info(`Prompt loaded. file=${env.PROMPT_FILE}; length=${prompt.toString().length}`)
  }
  const console = ChatTTY.console(ollama, chat);
  await console.start();
  process.exit(0);
})()