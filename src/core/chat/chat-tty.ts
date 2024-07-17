import { Chat, ChatMessage } from '@core/chat/chat';
import { DefaultTTY, TTYInterface } from '@core/stream';
import loggerFactory from '@core/logger';
import handlerStack, { CmdContext, CmdHandlerStack } from '@core/chat/cmd';
import { ChatCompletionClient, ChatCompletionRequest } from '@client/index';

const logger = loggerFactory.create('chat-tty');

export class ChatTTY {
  constructor(
    private readonly client: ChatCompletionClient,
    private readonly chat: Chat,
    private readonly stream: TTYInterface,
    private readonly stack: CmdHandlerStack,
  ) {
  }

  start = async () => {
    let isDone;
    await this.stream.write(">> Starting ping...\n");
    await this.client.ping();
    await this.stream.write(">> Ping Done\n");
    const request = this.toChatRequest();
    if (this.chat.getMessages(['user']).length > 0) {
      await this.client.chat(request);
    }
    await this.print();
    const context: CmdContext = {
      chat: this.chat,
      print: this.print,
      exit: () => isDone = true,
      retry: async () => {
        this.chat.undo(1);
        await this.send()
      }
    }
    do {
      const reply = await this.stream.read(">> ");
      if (reply.startsWith("/")) {
        try {
          await this.stack.handle(reply, context);
        } catch (e) {
          await this.stream.write(">> " + (e as Error).message);
        }
      } else {
        await this.send(reply);
      }
    } while (!isDone);
  }

  send = async (reply?: string) => {
    if (reply) {
      this.chat.addUserMsg(reply);
    }
    const response = await this.client.chat(this.toChatRequest());
    this.chat.addAssistantMsg(response.message)
    await this.print();
  }

  print = async () => {
    const messages = this.chat.getMessages();
    await this.stream.print(messages.map(msg => this.format(msg)));
  }

  private format = (msg: ChatMessage) => {
    return `\x1b[33m[${msg.role}]: \x1b[37m${msg.content}\n`;
  }

  static console(client: ChatCompletionClient, chat: Chat) {
    return new ChatTTY(
      client,
      chat,
      new DefaultTTY(),
      handlerStack,
    );
  }


  private toChatRequest = () => {
    const prompt = this.chat.getPrompt();
    const messages = [
      {
        role: "system",
        content: prompt
      },
      ...this.chat.getMessages(['user', 'assistant', 'system']) // TODO: Limit the window size
    ];
    return {
      messages,
    } as ChatCompletionRequest;
  }
}