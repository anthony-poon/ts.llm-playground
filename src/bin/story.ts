import { Chat } from '@core/chat';
import process from 'process';
import env from '@env';
import path from 'path';
import fs from 'fs';
import loggerFactory from "@core/logger";
import tty from "@core/tty";

const logger = loggerFactory.create('__main__');

(async () => {
  logger.debug('Process started');
  const chat = new Chat();
  if (env.PROMPT_FILE) {
    const prompt = await fs.readFileSync(path.join(env.ASSETS_FOLDER, env.PROMPT_FILE));
    chat.prompt = prompt.toString();
    logger.info(`Prompt loaded. file=${env.PROMPT_FILE}; length=${prompt.toString().length}`)
  }
  await tty.start(chat);
  process.exit(0);
})()