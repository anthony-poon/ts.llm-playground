import crypto from 'crypto';

export interface ChatMessage {
  role: "system"|"user"|"assistant",
  content: string
}

export class Chat {
  private prompt: string = "";
  private id: string;
  private messages: ChatMessage[] = [];
  constructor() {
    this.id = crypto.randomBytes(20).toString('hex');
  }

  addPrompt(prompt: string) {
    this.prompt = prompt
  }

  addSysMsg = (msg: string) => {
    this.messages.push({
      role: "system",
      content: msg
    })
  }

  addUserMsg = (msg: string) => {
    this.messages.push({
      role: "user",
      content: msg
    })
  }

  addAssistantMsg = (msg: string) => {
    this.messages.push({
      role: "assistant",
      content: msg
    })
  }

  undo = (count: number) => {
    if (count < 0) {
      throw new Error("Illegal input");
    }
    this.messages = this.messages.slice(0, -count);
  }

  dehydrate = (): string => {
    return JSON.stringify({
      id: this.id,
      prompt: this.prompt,
      messages: this.messages
    });
  }

  hydrate = (str: string) => {
    const json = JSON.parse(str);
    this.id = json.id;
    this.prompt = json.prompt || '';
    this.messages = json.messages || [];
  }

  getMessages = (roles?: string[]): ChatMessage[] => {
    if (!roles || roles.length === 0) {
      return this.messages;
    }
    return this.messages.filter(msg => roles?.includes(msg.role));
  }

  getPrompt() {
    return this.prompt;
  }
}