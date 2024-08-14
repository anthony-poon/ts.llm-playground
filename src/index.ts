import { Chat } from '@core/chat';
import process from 'process';
import fs from 'fs';
import loggerFactory from "@core/logger";
import tty from "@core/tty";
import { program } from "commander"

const logger = loggerFactory.create('main');

(async () => {
  logger.debug('Process started');
  program.option('-p, --prompt');
  program.parse();
  const chat = new Chat();
  const options = program.opts();
  if (options.prompt) {
    const prompt = await fs.readFileSync(program.args[0]);
    chat.prompt = prompt.toString();
    logger.info(`Prompt loaded; file=${program.args[0]} length=${prompt.toString().length}`)
  }

  await tty.start(chat);
  process.exit(0);
})()