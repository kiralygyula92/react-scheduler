// SPDX-License-Identifier: MIT
// The whole message format the site uses (docs pack 11 §9). No dependency: plural selection is
// `Intl.PluralRules`, number formatting is `Intl.NumberFormat`, both for the message's own locale.
//
//   "{count, plural, one {# page} other {# pages}}"
//   "Search {name}"
//
// A message may nest a variable inside a plural branch, but not a plural inside a plural.
import type { Locale } from './paths';

export type Vars = Readonly<Record<string, string | number>>;

/** Development builds surface authoring mistakes; production never throws at a reader. */
const development = import.meta.env.DEV;

function formatValue(value: string | number, locale: Locale): string {
  return typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value;
}

/** Reads `{…}` starting at `open`, honoring nesting, and returns the body and the index after it. */
function readBrace(message: string, open: number): { body: string; end: number } {
  let depth = 0;
  for (let index = open; index < message.length; index += 1) {
    const character = message[index];
    if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return { body: message.slice(open + 1, index), end: index + 1 };
    }
  }
  throw new Error(`Unbalanced "{" in message: ${message}`);
}

/** `one {# page} other {# pages}` → the branch for `count`, with `#` replaced. */
function selectBranch(branches: string, count: number, locale: Locale): string {
  const category = new Intl.PluralRules(locale).select(count);
  const found = new Map<string, string>();
  let index = 0;
  while (index < branches.length) {
    const nameEnd = branches.indexOf('{', index);
    if (nameEnd === -1) break;
    const name = branches.slice(index, nameEnd).trim();
    const { body, end } = readBrace(branches, nameEnd);
    found.set(name, body);
    index = end;
  }
  const branch = found.get(category) ?? found.get('other');
  if (branch === undefined) {
    throw new Error(`Plural message has no "${category}" and no "other" branch: ${branches}`);
  }
  return branch.replaceAll('#', formatValue(count, locale));
}

export function format(message: string, vars: Vars, locale: Locale): string {
  let result = '';
  let index = 0;
  while (index < message.length) {
    const open = message.indexOf('{', index);
    if (open === -1) return result + message.slice(index);
    result += message.slice(index, open);
    const { body, end } = readBrace(message, open);
    index = end;

    const [rawName, keyword, ...rest] = body.split(',');
    const name = rawName?.trim() ?? '';
    if (keyword?.trim() === 'plural') {
      const count = vars[name];
      if (typeof count !== 'number') {
        if (development) throw new Error(`Plural variable "${name}" is missing or not a number: ${message}`);
        result += `{${body}}`;
        continue;
      }
      result += format(selectBranch(rest.join(',').trim(), count, locale), vars, locale);
      continue;
    }

    const value = vars[name];
    if (value === undefined) {
      if (development) throw new Error(`Unknown variable "${name}" in message: ${message}`);
      result += `{${name}}`;
      continue;
    }
    result += formatValue(value, locale);
  }
  return result;
}
