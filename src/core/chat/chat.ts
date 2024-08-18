import _ from "lodash";

export interface ChatMessage {
  role: "system"|"user"|"assistant",
  content: string
}

export class Chat {
  private _prompt: string = "";
  private _histories: string[] = [];
  private _messages: ChatMessage[] = [];

  addHistory = (msg: string) => {
    this._histories.push(msg);
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

  undo = () => {
    let offset = null;
    for (let i = this._messages.length - 1; i >= 0 && offset === null; i--) {
      const msg = this._messages[i];
      if (msg.role === "user") {
        offset = i;
      }
    }
    if (offset !== null) {
      this._messages = this._messages.slice(0, offset);
      this._histories = this._histories.slice(0, -1);
    }
  }

  dehydrate = (): string => {
    return JSON.stringify({
      prompt: this._prompt,
      messages: this._messages,
      histories: this._histories,
    });
  }

  hydrate = (str: string) => {
    const json = JSON.parse(str);
    this._prompt = json.prompt || '';
    this._messages = json.messages || [];
    this._histories = json.histories || [];
  }

  set prompt(prompt: string) {
    this._prompt = prompt
  }

  set histories(histories: string[]) {
    this._histories = histories
  }

  get prompt(): string {
    return this._prompt;
  }

  get messages(): ChatMessage[] {
    return this._messages;
  }

  get histories(): string[] {
    return this._histories;
  }

  clear() {
    this._prompt = "";
    this._messages = [];
    this._histories = [];
  }
}