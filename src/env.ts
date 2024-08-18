import * as process from 'process';
import * as dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV;

if (nodeEnv) {
  dotenv.config({
    path: path.join(__dirname, `../.env.${nodeEnv}`)
  });
} else {
  dotenv.config({
    path: path.join(__dirname, '../.env')
  });
}


interface Validator {
  (arg: string): boolean;
}

const getOrDefault = (
  e: string,
  def: string,
  validator?: Validator,
): string => {
  const value = process.env[e];
  if (!value) {
    return def;
  }
  const isValid = validator ? validator(value) : true;
  return isValid ? value : def;
};

const getOrThrow = (e: string, message?: string, validator?: Validator) => {
  const value = process.env[e];
  if (!value) {
    throw new Error(message || `The environment variable ${e} is not set.`);
  }
  const isValid = validator ? validator(value) : true;
  if (!isValid) {
    throw new Error(message || `The environment variable ${e} is not valid.`);
  }
  return value;
};

export const LOG_LEVELS = {
  'error': 0,
  'alert': 1,
  'info': 2,
  'debug': 3,
  'silly': 4,
};

const getLogLevel = () => {
  const level = getOrDefault('LOG_LEVEL', 'INFO', (v) =>
    v.toLowerCase() in LOG_LEVELS,
  );
  return level.toLowerCase();
};

export interface AppEnv {
  APP_ENV: string;
  LOG_LEVEL: string;
  ASSETS_FOLDER: string;
  SESSIONS_FOLDER: string;
  PROMPTS_FOLDER: string;
  LOGS_FOLDER: string;
  LOGS_TYPE: string;
  LLM_PROVIDER: string;
}

export interface ChatCompletionEnv {
}

export interface OpenAIEnv {
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
}

export interface OllamaEnv {
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  OLLAMA_BASIC_AUTH_USER: string;
  OLLAMA_BASIC_AUTH_PASS: string;
}

export interface HttpEnv {
  IP_ADDRESS: string;
  PORT: number;
}

export interface TelegramEnv {
  TELEGRAM_BOT_USERNAME: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_WEBHOOK_URL: string;
}


export interface DatabaseEnv {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASS: string;
  DB_NAME: string;
  TABLE_SYNC: boolean;
  SHOW_SQL: boolean;
}

export interface MsgQueueEnv {
  MQ_HOSTNAME: string;
  MQ_PORT: number;
  MQ_USERNAME: string;
  MQ_PASSWORD: string;
  MQ_VHOST: string;
  TG_MESSAGE_QUEUE: string;
}

export interface Env extends AppEnv, OpenAIEnv, OllamaEnv, ChatCompletionEnv, HttpEnv, TelegramEnv, DatabaseEnv, MsgQueueEnv {}

const ASSETS_FOLDER = getOrDefault('ASSETS_FOLDER', path.join(__dirname, '../var'))

const env: Env = {
  IP_ADDRESS: getOrDefault('IP_ADDRESS', '127.0.0.1'),
  PORT: parseInt(getOrDefault('PORT', '8080'), 10),
  APP_ENV: getOrDefault('APP_ENV', 'DEV'),
  LOG_LEVEL: getLogLevel(),
  ASSETS_FOLDER,
  SESSIONS_FOLDER: path.join(ASSETS_FOLDER, 'sessions'),
  PROMPTS_FOLDER: path.join(ASSETS_FOLDER, 'prompts'),
  LOGS_FOLDER: path.join(ASSETS_FOLDER, 'logs'),
  LLM_PROVIDER: getOrThrow('LLM_PROVIDER'),
  LOGS_TYPE: getOrDefault('LOGS_TYPE', 'file'),
  OPENAI_API_KEY: getOrDefault('OPENAI_API_KEY', ''),
  OPENAI_MODEL: getOrDefault('OPENAI_MODEL', ''),
  OLLAMA_BASE_URL: getOrDefault('OLLAMA_BASE_URL', ''),
  OLLAMA_MODEL: getOrDefault('OLLAMA_MODEL', ''),
  OLLAMA_BASIC_AUTH_USER: getOrDefault('OLLAMA_BASIC_AUTH_USER', ''),
  OLLAMA_BASIC_AUTH_PASS: getOrDefault('OLLAMA_BASIC_AUTH_PASS', ''),
  TELEGRAM_BOT_USERNAME: getOrDefault('TELEGRAM_BOT_USERNAME', ''),
  TELEGRAM_BOT_TOKEN: getOrDefault('TELEGRAM_BOT_TOKEN', ''),
  TELEGRAM_BOT_WEBHOOK_URL: getOrDefault('TELEGRAM_BOT_WEBHOOK_URL', ''),
  DB_HOST: getOrThrow('DB_HOST'),
  DB_PORT: parseInt(getOrDefault('DB_PORT', '5432'), 10),
  DB_USER: getOrThrow('DB_USER'),
  DB_PASS: getOrThrow('DB_PASS'),
  DB_NAME: getOrThrow('DB_NAME'),
  TABLE_SYNC: getOrDefault('TABLE_SYNC', 'FALSE').toUpperCase() === 'TRUE',
  SHOW_SQL: getOrDefault('SHOW_SQL', 'FALSE').toUpperCase() === 'TRUE',
  MQ_HOSTNAME: getOrDefault('MQ_HOSTNAME', ''),
  MQ_PORT: parseInt(getOrDefault('MQ_PORT', '5672')),
  MQ_USERNAME: getOrDefault('MQ_USERNAME', ''),
  MQ_PASSWORD: getOrDefault('MQ_PASSWORD', ''),
  MQ_VHOST: getOrDefault('MQ_VHOST', ''),
  TG_MESSAGE_QUEUE: getOrDefault('TG_MESSAGE_QUEUE', 'TG_MESSAGE_QUEUE')
};

export default env;
