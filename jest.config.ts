import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "moduleNameMapper": {
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@client/(.*)$": "<rootDir>/src/client/$1",
    "^@service/(.*)$": "<rootDir>/src/service/$1",
    "^@entity/(.*)$": "<rootDir>/src/entity/$1",
    "^@repository/(.*)$": "<rootDir>/src/repository/$1",
    "^@database": "<rootDir>/src/database",
    "^@env$": "<rootDir>/src/env",
  },
};

export default config;