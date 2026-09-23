// SPDX-License-Identifier: MIT
// Records, per locale, the English text each API translation was made from (docs pack 05 §3).
// `check-i18n.ts` compares those hashes with the current English and reports a translation whose
// source has changed since. Run this after updating translations — never before.
//
// Usage: node scripts/record-api-sources.ts
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCALES = ['ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
const localesDir = resolve(import.meta.dirname, '..', 'src', 'locales');

type Bundle = Record<string, unknown>;

function flatten(bundle: Bundle, prefix = ''): Map<string, string> {
  const flat = new Map<string, string>();
  for (const [key, value] of Object.entries(bundle)) {
    if (key === '_meta') continue;
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') flat.set(path, value);
    else if (typeof value === 'object' && value !== null) {
      for (const [inner, text] of flatten(value as Bundle, path)) flat.set(inner, text);
    }
  }
  return flat;
}

function read(locale: string): Map<string, string> {
  const path = resolve(localesDir, locale, 'api.json');
  return existsSync(path) ? flatten(JSON.parse(readFileSync(path, 'utf8')) as Bundle) : new Map<string, string>();
}

function main(): number {
  const english = read('en');
  if (english.size === 0) {
    console.error('api sources: locales/en/api.json is missing; run the extractor first');
    return 1;
  }
  for (const locale of LOCALES) {
    const translated = read(locale);
    const hashes = [...english]
      .filter(([key]) => translated.has(key))
      .map(([key, value]) => [key, createHash('sha256').update(value).digest('hex').slice(0, 16)]);
    writeFileSync(
      resolve(localesDir, locale, '.api-sources.json'),
      `${JSON.stringify(Object.fromEntries(hashes), null, 2)}\n`,
    );
  }
  console.log(`api sources: recorded for ${String(LOCALES.length)} locales, ${String(english.size)} keys`);
  return 0;
}

process.exitCode = main();
