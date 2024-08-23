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

  async writeln(chunk: Buffer | string) {
    process.stdout.write(chunk);
    process.stdout.write("\n");
  }

  async clear() {
    process.stdout.write('\x1Bc');
  }
}

export interface IOStream {
  write(chunk: Buffer | string): Promise<void>;
  writeln(chunk: Buffer | string): Promise<void>;
  read(query?: string): Promise<string>;
  clear(): void
}

const ioStream = new ReadlineIOStream();

export default ioStream;