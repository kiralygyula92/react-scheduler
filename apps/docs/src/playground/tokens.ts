// SPDX-License-Identifier: MIT
// What the theme editor offers (docs pack 04 §4.7): every design token of the package, grouped the
// way the CSS variables page groups them, with the value the chosen scheme starts from. The list is
// generated from the package's own `tokens.css` by the extractor, so it cannot fall behind it.
import reference from '~/content/api/reference.json';

export interface Token {
  readonly name: string;
  readonly light: string;
  readonly dark: string;
  readonly category: string;
}

/** The six families of the CSS variables page; the category is the word after the `--rs-` prefix. */
const FAMILIES: readonly { readonly id: string; readonly categories: readonly string[] }[] = [
  { id: 'color', categories: ['color', 'surface', 'now'] },
  { id: 'typography', categories: ['text', 'font', 'letter'] },
  { id: 'levels', categories: ['level', 'alert'] },
  { id: 'shape', categories: ['radius', 'shadow', 'focus', 'dialog'] },
  { id: 'motion', categories: ['duration', 'ease'] },
];

const NAMED = new Set(FAMILIES.flatMap((family) => family.categories));

export const TOKENS = reference.cssVars as readonly Token[];

export interface TokenFamily {
  readonly id: string;
  readonly tokens: readonly Token[];
}

export function families(): readonly TokenFamily[] {
  return [
    ...FAMILIES.map((family) => ({
      id: family.id,
      tokens: TOKENS.filter((token) => family.categories.includes(token.category)),
    })),
    { id: 'layout', tokens: TOKENS.filter((token) => !NAMED.has(token.category)) },
  ];
}

/** The value a token has before anything is edited, in the scheme being edited. */
export function valueOf(token: Token, scheme: 'light' | 'dark'): string {
  return scheme === 'dark' ? token.dark : token.light;
}

/** Whether a colour input can show this value: `#rgb`, `#rrggbb` and nothing else, per the HTML spec. */
export function asColorInput(value: string): string | undefined {
  const hex = /^#(?:[\da-f]{3}|[\da-f]{6})$/i.exec(value.trim());
  if (hex === null) return undefined;
  const text = hex[0];
  return text.length === 4
    ? `#${text
        .slice(1)
        .split('')
        .map((character) => character + character)
        .join('')}`
    : text;
}

/** The CSS block the editor offers to copy: only what was changed, in the order the tokens are declared. */
export function stylesheet(changed: Readonly<Record<string, string>>, scheme: 'light' | 'dark'): string {
  const names = TOKENS.filter((token) => changed[token.name] !== undefined).map((token) => token.name);
  if (names.length === 0) return '';
  const selector = scheme === 'dark' ? '[data-rs-scheme="dark"]' : ':root';
  return [`${selector} {`, ...names.map((name) => `  ${name}: ${changed[name] as string};`), '}'].join('\n');
}
