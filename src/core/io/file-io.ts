import { AppEnv } from '@env';
import fs from 'fs';
import { FileIO } from '@core/io/index';
export class LocalFileIO implements FileIO{
  constructor(readonly env: AppEnv) {
  }

  async write(pathToFile: string, content: any) {
    await fs.writeFileSync(pathToFile, content);
  }

  async read(pathToFile: string) {
    return fs.readFileSync(pathToFile);
  }
}

