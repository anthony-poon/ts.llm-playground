import * as process from 'process';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(__dirname, '../.env')
});

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
  SESSIONS_FOLDER: string;
  ASSETS_FOLDER: string;
  LOGS_FOLDER: string;
  LOGS_TYPE: string;
  CHAT_COMPLETION_PROVIDER: string;
  PROMPT_FILE: string
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
}

export interface Env extends AppEnv, OpenAIEnv, OllamaEnv, ChatCompletionEnv {}

const env: Env = {
  APP_ENV: getOrDefault('APP_ENV', 'DEV'),
  LOG_LEVEL: getLogLevel(),
  SESSIONS_FOLDER: getOrDefault('SESSIONS_FOLDER', path.join(__dirname, '../var/sessions')),
  ASSETS_FOLDER: getOrDefault('ASSETS_FOLDER', path.join(__dirname, '../assets')),
  LOGS_FOLDER: getOrDefault('LOGS_FOLDER', path.join(__dirname, '../var/logs')),
  CHAT_COMPLETION_PROVIDER: getOrThrow('CHAT_COMPLETION_PROVIDER'),
  LOGS_TYPE: getOrDefault('LOGS_TYPE', 'file'),
  PROMPT_FILE: getOrDefault('PROMPT_FILE', ''),
  OPENAI_API_KEY: getOrDefault('OPENAI_API_KEY', ''),
  OPENAI_MODEL: getOrDefault('OPENAI_MODEL', ''),
  OLLAMA_BASE_URL: getOrDefault('OLLAMA_BASE_URL', ''),
  OLLAMA_MODEL: getOrDefault('OLLAMA_MODEL', ''),
};

export default env;
