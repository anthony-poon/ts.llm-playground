import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "moduleNameMapper": {
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@client/(.*)$": "<rootDir>/src/client/$1",
    "^@env$": "<rootDir>/src/env",
  },
};

export default config;