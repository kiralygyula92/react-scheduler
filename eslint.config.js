// SPDX-License-Identifier: MIT
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const NODE_GLOBALS = ['process', 'Buffer', 'require', 'module', '__dirname', '__filename', 'global'].map((name) => ({
  name,
  message: 'Published code must not use Node.js globals.',
}));

const DOM_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'matchMedia',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'ResizeObserver',
  'IntersectionObserver',
  'getComputedStyle',
  'HTMLElement',
  'Element',
].map((name) => ({ name, message: 'src/core has no DOM access (Dossier F-27).' }));

const USER_VISIBLE_ATTRIBUTES = [
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'aria-valuetext',
  'aria-placeholder',
  'title',
  'alt',
  'placeholder',
  'label',
].join('|');

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
  // (docs pack 07 §6: the rule runs on `src/content/**` and `src/shell/**`.) Props are exempt for
  // the same reason as in the package — a class name or a role is not text — and the attributes a
  // person actually reads are restricted separately, below.
  {
    files: ['apps/docs/src/content/**/*.tsx', 'apps/docs/src/shell/**/*.tsx'],
    rules: {
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXAttribute[name.name=/^(${USER_VISIBLE_ATTRIBUTES})$/] > Literal`,
          message: 'User-visible attribute text comes from the locale files.',
        },
        {
          selector: `JSXAttribute[name.name=/^(${USER_VISIBLE_ATTRIBUTES})$/] > JSXExpressionContainer > :matches(Literal, TemplateLiteral)`,
          message: 'User-visible attribute text comes from the locale files.',
        },
      ],
    },
  },
  // Package components: attribute values such as class names, roles and types are not text; the
  // attributes that assistive technology or the pointer reads out are checked on their own.
  {
    files: ['packages/*/src/**/*.tsx'],
    rules: {
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXAttribute[name.name=/^(${USER_VISIBLE_ATTRIBUTES})$/] > Literal`,
          message: 'User-visible attribute text comes from `localization`.',
        },
        {
          selector: `JSXAttribute[name.name=/^(${USER_VISIBLE_ATTRIBUTES})$/] > JSXExpressionContainer > :matches(Literal, TemplateLiteral)`,
          message: 'User-visible attribute text comes from `localization`.',
        },
      ],
    },
  },
  // Published code never logs (docs pack 09 §4.5) and uses no Node.js globals: the package
  // tsconfig includes Node types for its tests, so this rule guards src/ instead.
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    rules: { 'no-console': 'error', 'no-restricted-globals': ['error', ...NODE_GLOBALS] },
  },
  // The core is framework-agnostic and touches no DOM (docs pack 09 §4.1, Dossier F-27).
  // Rules do not merge across blocks, so this block repeats the Node.js globals.
  {
    files: ['packages/*/src/core/**/*.ts', 'packages/*/src/core.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react/*', 'react-dom', 'react-dom/*'], message: 'src/core must not import React.' },
            { group: ['**/react/**', '**/dom/**'], message: 'src/core must not depend on the React or DOM layers.' },
          ],
        },
      ],
      'no-restricted-globals': ['error', ...NODE_GLOBALS, ...DOM_GLOBALS],
    },
  },
);
