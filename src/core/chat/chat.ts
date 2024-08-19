import _ from "lodash";

export interface ChatMessage {
  role: "system"|"user"|"assistant",
  content: string
}

export class Chat {
  public prompt: string = "";
  public story: string = "";
  public model: string|null = null;
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
      prompt: this.prompt,
      story: this.story,
      model: this.model,
      messages: this._messages,
      histories: this._histories,
    });
  }

  hydrate = (str: string) => {
    const json = JSON.parse(str);
    this.prompt = json.prompt || '';
    this.story = json.story || '';
    this.model = json.model || '';
    this._messages = json.messages || [];
    this._histories = json.histories || [];
  }

  set histories(histories: string[]) {
    this._histories = histories
  }

  get messages(): ChatMessage[] {
    return this._messages;
  }

  get histories(): string[] {
    return this._histories;
  }

  clear() {
    this.prompt = "";
    this.story = "";
    this.model = null;
    this._messages = [];
    this._histories = [];
  }
}