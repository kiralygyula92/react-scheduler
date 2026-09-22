// SPDX-License-Identifier: MIT
// Token rule (docs pack 02 §1.4, conformance C9): colors and durations are written only in
// tokens.css files; every other stylesheet references them through custom properties.
const RAW_COLOR_AND_DURATION_RULES = {
  'color-no-hex': true,
  'color-named': 'never',
  'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
  'unit-disallowed-list': ['ms', 's'],
};

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    'spec/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    // The docs shell is copied byte for byte from the pack and is identical in every plugin
    // repository (docs pack 11 README); linting it would mean editing it. C9 checks its tokens
    // instead, and `apps/docs/test/shell/contrast.test.ts` checks its colors.
    'apps/docs/src/shell/tokens.css',
    'apps/docs/src/shell/shell.css',
  ],
  rules: {
    ...RAW_COLOR_AND_DURATION_RULES,
    // kebab-case with BEM elements and modifiers (docs pack 09 §4.2: `rs-toolbar__button--active`).
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
    // Level tokens embed the level key as written (`--rs-level-capacityWatch`, Feature Dossier 06 §3.1).
    'custom-property-pattern': '^[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*$',
    // Font family names keep their case so computed styles match the measured classic values.
    'value-keyword-case': ['lower', { ignoreProperties: ['/^--rs-font-family/'] }],
  },
  overrides: [
    {
      files: ['**/tokens.css'],
      rules: Object.fromEntries(Object.keys(RAW_COLOR_AND_DURATION_RULES).map((rule) => [rule, null])),
    },
  ],
};
