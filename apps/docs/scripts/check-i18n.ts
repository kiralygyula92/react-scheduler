// SPDX-License-Identifier: MIT
// The i18n gate (docs pack 07 §6): every namespace exists in all seven locales with the same keys
// and the same placeholders, no string is empty, every file says how it was produced, and every
// message survives formatting — including the plural categories each locale actually needs.
//
// Usage: node scripts/check-i18n.ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
type Locale = (typeof LOCALES)[number];
const REFERENCE: Locale = 'en';
const STATUSES = new Set(['draft', 'machine', 'reviewed']);

const localesDir = resolve(import.meta.dirname, '..', 'src', 'locales');
const problems: string[] = [];

function report(file: string, message: string): void {
  problems.push(`${file}: ${message}`);
}

/** Every namespace in a locale, as `pages/features/pinning` → parsed JSON. */
function bundles(locale: Locale): Map<string, unknown> {
  const root = resolve(localesDir, locale);
  const found = new Map<string, unknown>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = resolve(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith('.json')) {
        const namespace = relative(root, path)
          .replaceAll('\\', '/')
          .replace(/\.json$/, '');
        found.set(namespace, JSON.parse(readFileSync(path, 'utf8')));
      }
    }
  };
  walk(root);
  return found;
}

/** Dotted keys of every string in a bundle, with `_meta` left out. */
function stringsOf(value: unknown, prefix = ''): Map<string, string> {
  const strings = new Map<string, string>();
  if (typeof value === 'string') {
    strings.set(prefix, value);
    return strings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      for (const [key, text] of stringsOf(item, `${prefix}.${String(index)}`)) strings.set(key, text);
    });
    return strings;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      if (prefix === '' && key === '_meta') continue;
      for (const [inner, text] of stringsOf(item, prefix === '' ? key : `${prefix}.${key}`)) strings.set(inner, text);
    }
  }
  return strings;
}

/** `{name}` and `{count, plural, …}` alike: the variable names a message expects. */
function placeholders(message: string): Set<string> {
  const names = new Set<string>();
  for (const match of message.matchAll(/\{\s*([\w]+)\s*(?:,|\})/g)) names.add(match[1] as string);
  return names;
}

function pluralCategories(message: string): string[] {
  const body = /\{\s*\w+\s*,\s*plural\s*,([\s\S]*)\}\s*$/.exec(message)?.[1];
  if (body === undefined) return [];
  return [...body.matchAll(/(\w+)\s*\{/g)].map((match) => match[1] as string);
}

function checkStatus(locale: Locale, namespace: string, bundle: unknown): void {
  const meta = (bundle as { _meta?: { status?: unknown } })._meta;
  const status = meta?.status;
  if (typeof status !== 'string' || !STATUSES.has(status)) {
    report(`${locale}/${namespace}.json`, `_meta.status must be one of ${[...STATUSES].join(', ')}`);
  }
}

function main(): number {
  const reference = bundles(REFERENCE);

  for (const locale of LOCALES) {
    const own = bundles(locale);

    for (const namespace of reference.keys()) {
      if (!own.has(namespace)) {
        report(`${locale}/${namespace}.json`, 'missing');
        continue;
      }
    }
    for (const namespace of own.keys()) {
      if (!reference.has(namespace)) report(`${locale}/${namespace}.json`, `has no ${REFERENCE} counterpart`);
    }

    for (const [namespace, bundle] of own) {
      checkStatus(locale, namespace, bundle);
      const strings = stringsOf(bundle);
      const expected = stringsOf(reference.get(namespace) ?? {});
      const file = `${locale}/${namespace}.json`;

      for (const [key, message] of strings) {
        if (message.trim() === '') report(file, `${key} is empty`);
        const reference_ = expected.get(key);
        if (reference_ === undefined) {
          if (locale !== REFERENCE) report(file, `${key} exists only here`);
          continue;
        }
        const own_ = placeholders(message);
        const wanted = placeholders(reference_);
        for (const name of wanted) if (!own_.has(name)) report(file, `${key} is missing {${name}}`);
        for (const name of own_) if (!wanted.has(name)) report(file, `${key} has an unknown {${name}}`);

        const categories = pluralCategories(message);
        if (categories.length > 0 && !categories.includes('other')) {
          report(file, `${key} has no "other" plural branch`);
        }
      }

      for (const key of expected.keys()) if (!strings.has(key)) report(file, `${key} is missing`);
    }
  }

  // A pseudo-locale pass: every message is formatted with stand-in values, so a malformed message
  // fails here rather than on a reader's page.
  for (const locale of LOCALES) {
    for (const [namespace, bundle] of bundles(locale)) {
      for (const [key, message] of stringsOf(bundle)) {
        const vars: Record<string, string | number> = {};
        for (const name of placeholders(message)) vars[name] = /count|number|total/i.test(name) ? 2 : 'x';
        try {
          formatProbe(message, vars, locale);
        } catch (error) {
          report(`${locale}/${namespace}.json`, `${key}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  if (problems.length > 0) {
    console.error(`i18n: ${String(problems.length)} problem(s):`);
    for (const problem of problems.slice(0, 40)) console.error(`  ${problem}`);
    if (problems.length > 40) console.error(`  … and ${String(problems.length - 40)} more`);
    return 1;
  }
  console.log(`i18n: OK — ${String(bundles(REFERENCE).size)} namespaces × ${String(LOCALES.length)} locales`);
  return 0;
}

/**
 * The runtime formatter lives in `src/i18n/format.ts`, which imports through the `~` alias that only
 * the bundler resolves. This is the same grammar, kept deliberately small: it walks the braces and
 * checks that every plural branch a locale needs exists.
 */
function formatProbe(message: string, vars: Record<string, string | number>, locale: Locale): void {
  let depth = 0;
  for (const character of message) {
    if (character === '{') depth += 1;
    else if (character === '}') depth -= 1;
    if (depth < 0) throw new Error('unbalanced "}"');
  }
  if (depth !== 0) throw new Error('unbalanced "{"');

  const categories = pluralCategories(message);
  if (categories.length === 0) return;
  const rules = new Intl.PluralRules(locale);
  const name = /\{\s*(\w+)\s*,\s*plural/.exec(message)?.[1];
  if (name === undefined || typeof vars[name] !== 'number') throw new Error('plural variable is not a number');
  const needed = new Set([0, 1, 2, 3, 5, 11, 21, 101, 1000].map((count) => rules.select(count)));
  for (const category of needed) {
    if (!categories.includes(category) && !categories.includes('other')) {
      throw new Error(`no "${category}" branch and no "other" branch`);
    }
  }
}

process.exitCode = main();
