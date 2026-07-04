// eslint.config.js

// This ESLint configuration is designed for a TypeScript project.

import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import pluginJsdoc from 'eslint-plugin-jsdoc';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginVitest from '@vitest/eslint-plugin';

export default defineConfig([
  {
    name: 'Global Ignores',
    ignores: ['dist', 'node_modules', 'coverage', 'build'],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  pluginImport.flatConfigs.recommended,
  pluginN.configs['flat/recommended-script'],
  pluginPromise.configs['flat/recommended'],
  pluginJsdoc.configs['flat/recommended'],
  pluginPrettierRecommended,
  {
    name: 'Global Configuration',
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
    rules: {
      'no-console': 'warn',
      'spaced-comment': ['error', 'always'],
      'no-unused-vars': 'warn',
      'import/order': ['warn', { 'newlines-between': 'always' }],
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'n/prefer-node-protocol': 'error',
      'n/no-unsupported-features/node-builtins': ['error', { ignores: ['fetch', 'Request', 'Response', 'Headers', 'FormData'] }],
      'n/no-extraneous-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-missing-import': 'off',
      'promise/always-return': 'warn',
      'promise/catch-or-return': 'warn',
      'promise/no-nesting': 'warn',
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1, endLines: 0 }],
      'jsdoc/check-tag-names': ['warn', { definedTags: ['created', 'contributor', 'remarks'] }],
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-type': 'off',
      'prettier/prettier': 'warn',
    },
  },
  {
    name: 'JavaScript Source Files',
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    name: 'TypeScript Source Files',
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'Vitest Test Files',
    files: ['vitest/*.spec.ts', 'vitest/*.test.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.vitest.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      vitest: pluginVitest,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'jsdoc/require-jsdoc': 'off',
      ...pluginVitest.configs.recommended.rules,
    },
  },
]);
