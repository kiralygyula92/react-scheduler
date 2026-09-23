// SPDX-License-Identifier: MIT
// Writes `locales/{lng}/summaries.json`: every page's own `meta.description`, keyed by page id.
// The index pages (All features, Demos, Guides, Integrations, Migration) list their children with a
// one-line summary each, and 03 §3.5 asks that the summary be the page's own description rather than
// a second sentence that can drift from it. Generated, so it cannot.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pages } from './nav.ts';

const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
const localesDir = resolve(import.meta.dirname, '..', '..', 'src', 'locales');

export function writeSummaries(): number {
  const all = pages();
  for (const locale of LOCALES) {
    const summaries: Record<string, string> = {};
    for (const page of all) {
      const path = resolve(localesDir, locale, 'pages', `${page.page}.json`);
      if (!existsSync(path)) continue;
      const bundle = JSON.parse(readFileSync(path, 'utf8')) as { meta?: { description?: string } };
      const description = bundle.meta?.description;
      if (typeof description === 'string') summaries[page.page] = description;
    }
    const contents = `${JSON.stringify({ _meta: { status: 'machine', source: 'summaries' }, ...summaries }, null, 2)}\n`;
    const path = resolve(localesDir, locale, 'summaries.json');
    if (!existsSync(path) || readFileSync(path, 'utf8') !== contents) writeFileSync(path, contents);
  }
  return all.length;
}
