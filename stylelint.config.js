// SPDX-License-Identifier: MIT
// Token rule (docs pack 02 §1.4, conformance C9): colours and durations are written only in
// tokens.css files; every other stylesheet references them through custom properties.
const RAW_COLOUR_AND_DURATION_RULES = {
  'color-no-hex': true,
  'color-named': 'never',
  'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
  'unit-disallowed-list': ['ms', 's'],
};

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['spec/**', '**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**'],
  rules: RAW_COLOUR_AND_DURATION_RULES,
  overrides: [
    {
      files: ['**/tokens.css'],
      rules: Object.fromEntries(Object.keys(RAW_COLOUR_AND_DURATION_RULES).map((rule) => [rule, null])),
    },
  ],
};
