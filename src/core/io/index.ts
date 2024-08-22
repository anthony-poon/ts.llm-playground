import { LocalFileIO } from '@core/io/file-io';
import env from '@env';
import Buffer from "node:buffer"

export interface FileIO {
  write(pathToFile: string, content: any): Promise<void>
  read(pathToFile: string): Promise<Buffer>,
  mkdir(pathToFolder: string): boolean,
  ls(pathToFile: string): string[],
}

const fileIO = new LocalFileIO(env);

export default fileIO;