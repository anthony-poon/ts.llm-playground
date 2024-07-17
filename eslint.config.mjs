import babelParser from '@babel/eslint-parser';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['**/node_modules', '**/dist'],
  },
  ...compat.extends('eslint:recommended', 'plugin:prettier/recommended'),
  {
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
        ...globals.jest,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },

      parser: babelParser,
      ecmaVersion: 2018,
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'func-names': 'off',
      'no-plusplus': 'off',
      'no-process-exit': 'off',
      'class-methods-use-this': 'off',
    },
  },
  eslintPluginPrettierRecommended,
];
