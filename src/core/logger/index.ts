import env from '@env';
import WinstonLoggerFactory from './impl/winston';

export type LoggerFactory = {
  create: (namespace: string) => Logger;
};

interface LoggerMethod {
  (message: string, context?: object): void,
  (context: object): void,
}

export interface Logger {
  error: LoggerMethod;
  alert: LoggerMethod;
  info: LoggerMethod;
  debug: LoggerMethod;
  silly: LoggerMethod;
}

const loggerFactory: LoggerFactory = new WinstonLoggerFactory(env);
export default loggerFactory;
