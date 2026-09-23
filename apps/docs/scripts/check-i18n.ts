// SPDX-License-Identifier: MIT
// The i18n gate (docs pack 07 §6): every namespace exists in all seven locales with the same keys
// and the same placeholders, no string is empty, every file says how it was produced, and every
// message survives formatting — including the plural categories each locale actually needs.
//
// Usage: node scripts/check-i18n.ts
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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

/**
 * Every namespace in a locale, as `pages/features/pinning` → parsed JSON. Files starting with `.`
 * or `_` are the locale's own bookkeeping — the source hashes and the glossary — not namespaces the
 * site renders.
 */
function bundles(locale: Locale): Map<string, unknown> {
  const root = resolve(localesDir, locale);
  const found = new Map<string, unknown>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = resolve(dir, entry);
      if (entry.startsWith('.') || entry.startsWith('_')) continue;
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

  checkStaleTranslations();
  checkGlossaries();

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
 * A translation whose English source changed since it was written is stale, and stale documentation
 * is worse than none (docs pack 05 §3, 06 §5.5). `.api-sources.json` stores the hash of the English
 * value each translation was made from; a mismatch is an error, not a warning.
 */
function checkStaleTranslations(): void {
  const english = stringsOfBundle('api');
  if (english.size === 0) return;
  for (const locale of LOCALES) {
    if (locale === REFERENCE) continue;
    const path = resolve(localesDir, locale, '.api-sources.json');
    if (!existsSync(path)) {
      report(`${locale}/.api-sources.json`, 'missing: translations record the English they came from');
      continue;
    }
    const hashes = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
    for (const [key, source] of english) {
      const recorded = hashes[key];
      if (recorded === undefined) report(`${locale}/api.json`, `${key} has no recorded English source`);
      else if (recorded !== sourceHash(source)) {
        report(`${locale}/api.json`, `${key} was translated from an older English text`);
      }
    }
  }
}

/**
 * The glossary fixes how the words of this domain are translated (06 §5.5). A term that appears in a
 * locale still in its English form is reported, so "prop", "slot" or "shift" cannot drift from page
 * to page.
 */
function checkGlossaries(): void {
  for (const locale of LOCALES) {
    if (locale === REFERENCE) continue;
    const path = resolve(localesDir, locale, '_glossary.json');
    if (!existsSync(path)) continue;
    const glossary = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    const terms = Object.entries(glossary).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[0] !== '_meta',
    );
    for (const [namespace, bundle] of bundles(locale)) {
      for (const [key, message] of stringsOf(bundle)) {
        // Code spans are never translated, so a term inside backticks is not a finding.
        const prose = message.replaceAll(/`[^`]*`/g, '');
        for (const [term, translation] of terms) {
          const pattern = new RegExp(`\\b${term.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (pattern.test(prose) && !prose.includes(translation)) {
            report(`${locale}/${namespace}.json`, `${key}: "${term}" is not translated (glossary: "${translation}")`);
          }
        }
      }
    }
  }
}

/** Flat strings of one namespace of the reference locale. */
function stringsOfBundle(namespace: string): Map<string, string> {
  const bundle = bundles(REFERENCE).get(namespace);
  return bundle === undefined ? new Map<string, string>() : stringsOf(bundle);
}

function sourceHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
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
