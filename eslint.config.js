// SPDX-License-Identifier: MIT
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'spec/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.react-router/**',
      'test-results/**',
      'playwright-report/**',
      'apps/docs/src/content/api/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    files: ['scripts/**/*.ts', '*.config.ts', 'packages/*/*.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.tsx'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser } },
    settings: { react: { version: '19.3' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
    },
  },
  // No user-visible literal in code: package strings go through `localization` (docs pack 08 P9),
  // site strings through the locale files (docs pack 07 §5).
  {
    files: ['packages/*/src/**/*.tsx', 'apps/docs/src/content/**/*.tsx', 'apps/docs/src/shell/**/*.tsx'],
    rules: { 'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: false }] },
  },
  // Published code never logs (docs pack 09 §4.5).
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    rules: { 'no-console': 'error' },
  },
);
