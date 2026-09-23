// SPDX-License-Identifier: MIT
// The machine-readable surface (docs pack 01 §7, conformance C11): `llms.txt`, `llms-full.md`,
// `llms-full.txt`, a `.md` twin of every page, and `sitemap.xml` with `hreflang` alternates — all
// per locale, all generated from the prerendered HTML, so they cannot contradict the site.
//
// Usage: node scripts/build-machine-surface.ts   (after `react-router build`)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contentOf, descriptionOf, titleOf, toMarkdown } from './lib/html.ts';
import { DEFAULT_LOCALE, type Locale, LOCALES, nav, pages as navPages, urlOf } from './lib/nav.ts';

const origin = process.env['VITE_SITE_URL'] ?? nav.siteUrl;
const client = resolve(import.meta.dirname, '..', 'build', 'client');

function localeRoot(locale: Locale): string {
  return resolve(client, `.${urlOf(locale, '/')}`);
}

interface Page {
  readonly url: string;
  readonly title: string;
  readonly description: string;
  readonly markdown: string;
  readonly sectionId: string;
}

type NavEntry = ReturnType<typeof navPages>[number];

function read(locale: Locale, entry: NavEntry): Page | null {
  const url = urlOf(locale, entry.path);
  const file = resolve(client, `.${url}`, 'index.html');
  if (!existsSync(file)) return null;
  const html = readFileSync(file, 'utf8');
  return {
    url,
    title: titleOf(html).split(' · ')[0] ?? '',
    description: descriptionOf(html),
    markdown: toMarkdown(contentOf(html)),
    sectionId: entry.sectionId,
  };
}

/** `# Name`, the one-line description, then one block per section with a link per page. */
function llmsTxt(pages: readonly Page[], sections: readonly { id: string; title: string }[]): string {
  const lines = [`# ${nav.displayName}`, '', pages[0]?.description ?? '', ''];
  for (const section of sections) {
    const inSection = pages.filter((page) => page.sectionId === section.id);
    if (inSection.length === 0) continue;
    lines.push(`## ${section.title}`, '');
    for (const page of inSection) lines.push(`- [${page.title}](${page.url}index.md): ${page.description}`);
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function llmsFull(pages: readonly Page[]): string {
  const lines = [`# ${nav.displayName}`, ''];
  for (const page of pages) {
    lines.push(`<!-- ${page.url} -->`, '', page.markdown, '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function sitemap(all: readonly NavEntry[]): string {
  const urls = all.flatMap((entry) =>
    LOCALES.map((locale) => {
      const alternates = LOCALES.map(
        (other) => `    <xhtml:link rel="alternate" hreflang="${other}" href="${origin}${urlOf(other, entry.path)}"/>`,
      ).join('\n');
      return `  <url>
    <loc>${origin}${urlOf(locale, entry.path)}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${urlOf(DEFAULT_LOCALE, entry.path)}"/>
  </url>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

function main(): number {
  const all = navPages();
  // Section titles come from the English shell bundle: `llms.txt` is a machine index, and its
  // locale copies use the same section order with each locale's own page titles.
  const common = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'src/locales/en/common.json'), 'utf8')) as {
    nav: Record<string, string>;
  };
  const sections = nav.sections.map((section) => ({
    id: section.id,
    title: common.nav[section.labelKey.replace('nav.', '')] ?? section.id,
  }));

  let twins = 0;
  for (const locale of LOCALES) {
    const pages: Page[] = [];
    for (const entry of all) {
      const page = read(locale, entry);
      if (page === null) {
        console.error(`machine surface: ${urlOf(locale, entry.path)} was not prerendered`);
        return 1;
      }
      pages.push(page);
      const twin = resolve(client, `.${page.url}`, 'index.md');
      writeFileSync(twin, `${page.markdown}\n`);
      twins += 1;
    }

    const root = localeRoot(locale);
    mkdirSync(root, { recursive: true });
    const full = llmsFull(pages);
    writeFileSync(resolve(root, 'llms.txt'), llmsTxt(pages, sections));
    writeFileSync(resolve(root, 'llms-full.md'), full);
    // Byte-identical copy, for agents that only fetch .txt (01 §7).
    writeFileSync(resolve(root, 'llms-full.txt'), full);
  }

  writeFileSync(resolve(client, 'sitemap.xml'), sitemap(all));
  writeFileSync(resolve(client, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);

  console.log(
    `machine surface: ${String(twins)} Markdown twins, ${String(LOCALES.length * 3)} llms files, sitemap with ${String(all.length * LOCALES.length)} URLs`,
  );
  return 0;
}

process.exitCode = main();
