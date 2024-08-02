export interface ChatMessage {
  role: "system"|"user"|"assistant",
  content: string
}

export class Chat {
  private _prompt: string = "";
  private _messages: ChatMessage[] = [];

  addSysMsg = (msg: string) => {
    this._messages.push({
      role: "system",
      content: msg
    })
  }

  addUserMsg = (msg: string) => {
    this._messages.push({
      role: "user",
      content: msg
    })
  }

  addAssistantMsg = (msg: string) => {
    this._messages.push({
      role: "assistant",
      content: msg
    })
  }

  undo = (count: number) => {
    if (count < 0) {
      throw new Error("Illegal input");
    }
    this._messages = this._messages.slice(0, -count);
  }

  dehydrate = (): string => {
    return JSON.stringify({
      prompt: this._prompt,
      messages: this._messages
    });
  }

  hydrate = (str: string) => {
    const json = JSON.parse(str);
    this._prompt = json.prompt || '';
    this._messages = json.messages || [];
  }

  set prompt(prompt: string) {
    this._prompt = prompt
  }

  get prompt(): string {
    return this._prompt;
  }

  get messages(): ChatMessage[] {
    return this._messages;
  }
}