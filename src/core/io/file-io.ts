import { AppEnv } from '@env';
import fs from 'fs';
import { FileIO } from '@core/io/index';
import path from "path";
export class LocalFileIO implements FileIO {
  constructor(readonly env: AppEnv) {
  }

  write = async (pathToFile: string, content: any) => {
    if (!this.isSubDir(pathToFile)) {
      throw new Error("Illegal file access");
    }
    await fs.writeFileSync(pathToFile, content);
  }

  read = async (pathToFile: string) => {
    if (!this.isSubDir(pathToFile)) {
      throw new Error("Illegal file access");
    }
    return fs.readFileSync(pathToFile);
  }

  private isSubDir = (pathToFile: string) => {
    const relative = path.relative(this.env.ASSETS_FOLDER, pathToFile);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  }
}

