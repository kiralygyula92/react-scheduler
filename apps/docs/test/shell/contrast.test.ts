// SPDX-License-Identifier: MIT
// Docs pack 02 §2: "every text/background pair above meets WCAG 2.2 AA", and 07 §2 requires it to
// be unit-tested over `tokens.css` in both themes. The tokens are read from the file, so a future
// edit to the design system is what fails here, not a copy of the values.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(import.meta.dirname, '../../src/shell/tokens.css'), 'utf8');

/** The declarations of one rule, by selector, as `--ds-name` → value. */
function tokensOf(selector: string): Readonly<Record<string, string>> {
  const start = source.indexOf(selector);
  if (start === -1) throw new Error(`tokens.css has no rule for ${selector}`);
  const block = source.slice(source.indexOf('{', start) + 1, source.indexOf('}', start));
  const tokens: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(/(--ds-[\w-]+)\s*:\s*([^;]+);/g)) {
    if (name !== undefined && value !== undefined) tokens[name] = value.trim();
  }
  return tokens;
}

const themes = {
  light: tokensOf(':root,\n:root[data-theme="light"]'),
  dark: tokensOf(':root[data-theme="dark"]'),
};

function channel(value: number): number {
  const ratio = value / 255;
  return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.2 relative luminance of a `#rrggbb` value. */
function luminance(hex: string): number {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (match === null) throw new Error(`Not a hex colour: ${hex}`);
  const [red, green, blue] = match.slice(1).map((part) => channel(Number.parseInt(part, 16)));
  return 0.2126 * (red as number) + 0.7152 * (green as number) + 0.0722 * (blue as number);
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

function ratio(theme: keyof typeof themes, foreground: string, background: string): number {
  const tokens = themes[theme];
  const from = tokens[foreground];
  const to = tokens[background];
  if (from === undefined || to === undefined) throw new Error(`Missing token in ${theme}: ${foreground}/${background}`);
  return contrast(from, to);
}

/** Body text and anything else read at normal size. */
const TEXT_PAIRS: readonly (readonly [string, string])[] = [
  ['--ds-text', '--ds-bg'],
  ['--ds-text', '--ds-bg-subtle'],
  ['--ds-text', '--ds-bg-muted'],
  ['--ds-text', '--ds-bg-elevated'],
  ['--ds-text', '--ds-bg-input'],
  ['--ds-text-secondary', '--ds-bg'],
  ['--ds-text-secondary', '--ds-bg-subtle'],
  ['--ds-text-secondary', '--ds-bg-muted'],
  ['--ds-text-tertiary', '--ds-bg'],
  ['--ds-text-tertiary', '--ds-bg-subtle'],
  ['--ds-accent', '--ds-bg'],
  ['--ds-accent', '--ds-bg-subtle'],
  ['--ds-accent', '--ds-accent-soft'],
  ['--ds-accent-hover', '--ds-bg'],
  ['--ds-accent-contrast', '--ds-accent'],
  ['--ds-info', '--ds-info-soft'],
  ['--ds-success', '--ds-success-soft'],
  ['--ds-warning', '--ds-warning-soft'],
  ['--ds-danger', '--ds-danger-soft'],
  ['--ds-info', '--ds-bg'],
  ['--ds-success', '--ds-bg'],
  ['--ds-warning', '--ds-bg'],
  ['--ds-danger', '--ds-bg'],
];

/** Code blocks sit on `--ds-bg-subtle`; every token has to stay readable there. */
const CODE_TOKENS = [
  '--ds-code-text',
  '--ds-code-keyword',
  '--ds-code-string',
  '--ds-code-number',
  '--ds-code-comment',
  '--ds-code-function',
  '--ds-code-type',
  '--ds-code-tag',
  '--ds-code-attr',
  '--ds-code-punct',
  '--ds-code-operator',
  '--ds-code-property',
];

/** Non-text contrast: focus rings need 3:1 (WCAG 2.2 1.4.11). */
const UI_PAIRS: readonly (readonly [string, string])[] = [
  ['--ds-focus', '--ds-bg'],
  ['--ds-focus', '--ds-bg-subtle'],
];

/**
 * `--ds-border-strong` draws input borders, which 1.4.11 also covers, but the pack's value does not
 * reach 3:1 in either theme. The shell is copied verbatim and is not redesigned per plugin, so the
 * measured values are recorded here and in EXCEPTIONS.md #5 instead of being quietly fixed. This
 * test fails as soon as the docs pack changes the token — in either direction.
 */
const BORDER_CONTRAST = { light: 1.48, dark: 1.82 };

describe.each(['light', 'dark'] as const)('%s theme', (theme) => {
  it.each(TEXT_PAIRS)('%s on %s reaches 4.5:1', (foreground, background) => {
    expect(ratio(theme, foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CODE_TOKENS)('%s reaches 4.5:1 on the code surface', (token) => {
    expect(ratio(theme, token, '--ds-bg-subtle')).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s on %s reaches 3:1', (foreground, background) => {
    expect(ratio(theme, foreground, background)).toBeGreaterThanOrEqual(3);
  });

  it('still ships the border contrast recorded in EXCEPTIONS.md #5', () => {
    expect(ratio(theme, '--ds-border-strong', '--ds-bg')).toBeCloseTo(BORDER_CONTRAST[theme], 2);
  });
});
