import { LocalFileIO } from '@core/io/file-io';
import env from '@env';
import Buffer from "node:buffer"

export interface FileIO {
  write(pathToFile: string|string[], content: any): Promise<void>
  read(pathToFile: string|string[]): Promise<Buffer>
}

const fileIO = new LocalFileIO(env);

export default fileIO;