import { AppEnv } from '@env';
import fs from 'fs';
import { FileIO } from '@core/io/index';
import path from "path";
import loggerFactory from "@core/logger";

const logger = loggerFactory.create('local-file-io');

export class LocalFileIO implements FileIO {
  constructor(readonly env: AppEnv) {
  }

  write = async (pathToFile: string, content: any) => {
    try {
      if (!this.isSubDir(pathToFile)) {
        throw new Error("Illegal file access");
      }
      fs.writeFileSync(pathToFile, content)
      return Promise.resolve();
    } catch (e) {
      throw this.handleError(e);
    }
  }

  read = async (pathToFile: string) => {
    try {
      if (!this.isSubDir(pathToFile)) {
        throw new Error("Illegal file access");
      }
      return Promise.resolve(fs.readFileSync(pathToFile));
    } catch (e) {
      throw this.handleError(e);
    }
  }

  mkdir = (pathToFolder: string): boolean => {
    try {
      if (!this.isSubDir(pathToFolder)) {
        throw new Error("Illegal file access");
      }
      if (fs.existsSync(pathToFolder)) {
        return false;
      }
      fs.mkdirSync(pathToFolder, { recursive: true });
      return true;
    } catch (e) {
      throw this.handleError(e);
    }
  }

  ls = (pathToFolder: string): string[] => {
    try {
      if (!this.isSubDir(pathToFolder)) {
        throw new Error("Illegal file access");
      }
      return fs.readdirSync(pathToFolder).sort();
    } catch (e) {
      throw this.handleError(e);
    }
  }

  private isSubDir = (pathToFile: string) => {
    const relative = path.relative(this.env.ASSETS_FOLDER, pathToFile);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  private handleError = (e: any) => {
    const error = (e as Error);
    logger.error(error.message, {
      error,
    })
    // Original error message contain sensitive info, i.e. file path
    return new Error("IO Error");
  }
}

