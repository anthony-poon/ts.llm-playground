import { ChatBuilder } from '@core/chat';
import { ChatTTY } from '@core/chat/chat-tty';
import openai from '@client/openai';
import process from 'process';
import ollama from "@client/ollama";

(async () => {
  const chat = ChatBuilder.noPrompt();
  const console = ChatTTY.console(ollama, chat);
  await console.start();
  process.exit(0);
})()