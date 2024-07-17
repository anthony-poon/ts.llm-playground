import { AppEnv } from '@env';
import path from 'path';
import fs from 'fs';
import { FileIO } from '@core/io/index';
export class LocalFileIO implements FileIO{
  constructor(readonly env: AppEnv) {
  }

  async write(pathToFile: string|string[], content: any) {
    const exp = Array.isArray(pathToFile) ? pathToFile : [pathToFile];
    const fullPath = path.join(this.env.PATH_TO_VAR, ...exp);
    await fs.writeFileSync(fullPath, content);
  }

  async read(pathToFile: string|string[]) {
    const exp = Array.isArray(pathToFile) ? pathToFile : [pathToFile];
    const fullPath = path.join(this.env.PATH_TO_VAR, ...exp);
    return fs.readFileSync(fullPath);
  }
}

