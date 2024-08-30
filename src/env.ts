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
  CHAT_COMPLETION_CONTEXT_SIZE: number
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
  TELEGRAM_MAX_TEXT_LENGTH: number;
  TELEGRAM_BOTS: TelegramBotEnv[];
}

export interface TelegramBotEnv {
  NAMESPACE: string;
  USERNAME: string;
  TOKEN: string;
  WEBHOOK_URL: string;
  PROVIDER: string;
  PROMPTS_FOLDER: string;
  SESSIONS_FOLDER: string;
  USER_WHITELIST: string[];
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

const getTelegramEnv = (): TelegramEnv => {
  const env = getOrDefault('TELEGRAM_BOT_NAMESPACES', '');
  const namespaces = env ? env.split(",") : [];
  const TELEGRAM_BOTS = namespaces.map(namespace => {
    const NAMESPACE = namespace.trim().toUpperCase();
    const USER_WHITELIST = getOrDefault(`TELEGRAM_${NAMESPACE}_BOT_USER_WHITELIST`, '');
    const whitelist = USER_WHITELIST ? USER_WHITELIST.split(",") : [];
    return {
      NAMESPACE: namespace.trim().toLowerCase(),
      USERNAME: getOrThrow(`TELEGRAM_${NAMESPACE}_BOT_USERNAME`),
      TOKEN: getOrThrow(`TELEGRAM_${NAMESPACE}_BOT_TOKEN`),
      WEBHOOK_URL: getOrThrow(`TELEGRAM_${NAMESPACE}_BOT_WEBHOOK_URL`),
      PROVIDER: getOrThrow(`TELEGRAM_${NAMESPACE}_BOT_PROVIDER`),
      PROMPTS_FOLDER: getOrDefault(`TELEGRAM_${NAMESPACE}_BOT_PROMPTS_FOLDER`, ''),
      SESSIONS_FOLDER: getOrDefault(`TELEGRAM_${NAMESPACE}_BOT_SESSIONS_FOLDER`, ''),
      USER_WHITELIST: whitelist,
    }
  })
  return {
    TELEGRAM_MAX_TEXT_LENGTH: parseInt(getOrDefault('TELEGRAM_BATCH_LENGTH', '4000')),
    TELEGRAM_BOTS
  };
}

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
  CHAT_COMPLETION_CONTEXT_SIZE: parseInt(getOrDefault('CHAT_COMPLETION_CONTEXT_SIZE', '4096'), 10),
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
  TG_MESSAGE_QUEUE: getOrDefault('TG_MESSAGE_QUEUE', 'TG_MESSAGE_QUEUE'),
  ...getTelegramEnv()
};

export default env;
