import { createLogger, format, transports } from 'winston';

import { AppEnv, LOG_LEVELS } from "@env";
import type { LoggerFactory } from '../index';
import path from "path";

const consoleFormat = (namespace: string) => format.combine(
    format.errors({ stack: true }),
    format.label({ label: namespace }),
    format((info) => ({
      ...info,
      level: info.level.toUpperCase(),
    }))(),
    format.timestamp(),
    format.colorize(),
    format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `[${timestamp}] ${level}: ${message}\n${stack}`;
      }
      return `[${timestamp}] ${level}: ${message}`;
    }),
)

const fileFormat = (namespace: string) => format.combine(
    format.errors({ stack: true }),
    format.label({ label: namespace }),
    format((info) => ({
      ...info,
      level: info.level.toUpperCase(),
    }))(),
    format.timestamp(),
    format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `[${timestamp}] ${level}: ${message}\n${stack}`;
      }
      return `[${timestamp}] ${level}: ${message}`;
    }),
)

const getTransport = (env: AppEnv, namespace: string) => {
  if (env.LOGS_TYPE.toLowerCase() === "none") {
    return [];
  }
  const dest = env.LOGS_TYPE.split(",");
  const rtn = [];
  dest.forEach(d => {
    switch (d.toLowerCase()) {
      case 'file':
        rtn.push(
            new transports.File({
              filename: path.join(env.LOGS_FOLDER, "last_session.log"),
              format: fileFormat(namespace)
            })
        )
        break;
      case 'console':
        rtn.push(
            new transports.Console({
              format: consoleFormat(namespace)
            }),
        )
        break;
    }
  });
  if (rtn.length === 0) {
    rtn.push(
        new transports.Console({
          format: consoleFormat(namespace)
        }),
    )
  }
  return rtn;
}

class LoggerFactoryImpl implements LoggerFactory {
  constructor(private readonly env: AppEnv) {}

  create(namespace: string) {
    return {
      error: (msgOrObj: string|object, context?: object) => this.log(namespace, 'error', msgOrObj, context),
      alert: (msgOrObj: string|object, context?: object) => this.log(namespace, 'alert', msgOrObj, context),
      info: (msgOrObj: string|object, context?: object) => this.log(namespace, 'info', msgOrObj, context),
      debug: (msgOrObj: string|object, context?: object) => this.log(namespace, 'debug', msgOrObj, context),
    };
  }

  private log(namespace: string, level: string, msgOrObj: string|object, context?: object) {
    const logger = this.createWinstonLogger(namespace);
    let message;
    if (typeof msgOrObj === "object") {
      message = JSON.stringify(msgOrObj);
    } else {
      // if context is an empty object, should resolve to true so that empty object will be logged
      // Regex to parse this message: ^\[(?<timestamp>.+?)\] (?<level>\w+): (?<message>.+?) \| (?<json>{.*})$
      message = context ? `${msgOrObj} | ${JSON.stringify(context)}` : msgOrObj;
    }
    logger.log(level, message);
  }

  private createWinstonLogger(namespace: string) {
    return createLogger({
      level: this.env.LOG_LEVEL.toLowerCase(),
      levels: LOG_LEVELS,
      format: format.combine(
        format.errors({ stack: true }),
        format.label({ label: namespace }),
        format((info) => ({
          ...info,
          level: info.level.toUpperCase(),
        }))(),
        format.timestamp(),
        format.printf(({ level, message, timestamp, stack }) => {
          if (stack) {
            return `[${timestamp}] ${level}: ${message}\n${stack}`;
          }
          return `[${timestamp}] ${level}: ${message}`;
        }),
      ),
      transports: getTransport(this.env, namespace),
    });
  }
}

export default LoggerFactoryImpl;
