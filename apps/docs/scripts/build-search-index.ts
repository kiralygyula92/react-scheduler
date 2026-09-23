// SPDX-License-Identifier: MIT
// One search index per locale (docs pack 11 §10), built from the prerendered pages so a result can
// only ever point at text the site actually shows. Runs after `react-router build`.
//
// Usage: node scripts/build-search-index.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { contentOf, crumbOf, headingsOf, mainOf, text, titleOf } from './lib/html.ts';
import { LOCALES, pages, urlOf } from './lib/nav.ts';

const TEXT_LIMIT = 2000;
const client = resolve(import.meta.dirname, '..', 'build', 'client');

function main(): number {
  const all = pages();
  let written = 0;

  for (const locale of LOCALES) {
    const records = [];
    for (const item of all) {
      const url = urlOf(locale, item.path);
      const file = resolve(client, `.${url}`, 'index.html');
      if (!existsSync(file)) {
        console.error(`search: ${url} was not prerendered`);
        return 1;
      }
      const html = readFileSync(file, 'utf8');
      const content = contentOf(html);
      records.push({
        id: item.id,
        url,
        title: titleOf(html).split(' · ')[0] ?? '',
        section: item.sectionId,
        crumb: crumbOf(mainOf(html)),
        headings: headingsOf(content),
        text: text(content).slice(0, TEXT_LIMIT),
        ...(item.symbols && { symbols: item.symbols }),
      });
    }

    const target = resolve(client, `.${urlOf(locale, '/')}`, 'search-index.json');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(records));
    written += 1;
  }

  console.log(`search: ${String(written)} index files, ${String(all.length)} pages each`);
  return 0;
}

process.exitCode = main();
