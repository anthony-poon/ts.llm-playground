import * as Buffer from 'buffer';
import * as process from 'process';
import readline from 'readline';

export class ReadlineIOStream implements IOStream {
  private rl: readline.Interface;
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  async read(query?: string) {
    return new Promise((resolve: (i: string) => void) => {
      this.rl.question(query || "", (input) => resolve(input));
    })
  }
  async write(chunk: Buffer | string) {
    process.stdout.write(chunk)
  }

  async clear() {
    process.stdout.write('\x1Bc');
  }

  async print(messages: string[]) {
    await this.clear();
    await Promise.all(messages.map(msg => {
      this.write(msg);
    }))
  }
}

export interface IOStream {
  write(chunk: Buffer | string): Promise<void>;
  read(query?: string): Promise<string>;
  clear(): void
  print(messages: string[]): Promise<void>;
}

const ioStream = new ReadlineIOStream();

export default ioStream;