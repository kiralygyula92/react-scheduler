// SPDX-License-Identifier: MIT
// The conformance gate (docs pack 07 §6). This milestone covers the structural checks: C1–C4, C8–C11
// and C15. C5–C7, C13 and C14 arrive with the content and API milestones and report as pending, so
// the list always shows what is and is not being enforced yet.
//
// Usage: node scripts/check-conformance.ts   (after `pnpm --filter docs build` for C3, C4 and C11)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { validate } from './lib/schema.ts';
import { shellChecksum } from './lib/shell.ts';

const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
type Locale = (typeof LOCALES)[number];

const app = resolve(import.meta.dirname, '..');
const src = resolve(app, 'src');
const client = resolve(app, 'build', 'client');

const navigation = JSON.parse(readFileSync(resolve(src, 'content/nav.json'), 'utf8')) as Navigation;
const schema = JSON.parse(readFileSync(resolve(src, 'content/nav.schema.json'), 'utf8')) as Record<string, unknown>;
const templates = JSON.parse(readFileSync(resolve(src, 'content/templates.json'), 'utf8')) as {
  templates: Record<string, string[]>;
  pages: Record<string, string[]>;
};

interface Item {
  readonly id: string;
  readonly labelKey: string;
  readonly path: string;
  readonly page: string;
  readonly template?: string;
  readonly type?: string;
  readonly items?: readonly Item[];
}

interface Section {
  readonly id: string;
  readonly labelKey: string;
  readonly items: readonly Item[];
}

interface Navigation {
  readonly pluginId: string;
  readonly sections: readonly Section[];
}

/** The children 01 §3 fixes for every plugin site. */
const FIXED: Readonly<Record<string, readonly string[]>> = {
  'getting-started': ['overview', 'installation', 'usage', 'ai-context', 'requirements', 'faq', 'support', 'versions'],
  features: ['all-features'],
  demos: ['demos', 'playground'],
  reference: ['api'],
  customization: ['customization', 'theming', 'css-variables', 'slots', 'localization'],
  guides: ['guides'],
  integrations: ['integrations', 'vite', 'nextjs', 'react-router', 'ssr'],
  migration: ['migration'],
  'discover-more': ['changelog', 'roadmap', 'accessibility', 'license'],
};

const SECTION_ORDER = Object.keys(FIXED);

// Pricing, tiers, "Edit this page" and the feedback widget are forbidden as features. Saying the
// package has none of them is required by 03 §3.1, so a denial ("no paid tier", "without pricing")
// is not a match.
const DENIAL = '(?<!\\b(?:no|non|not|never|without|free of)\\s)';
const FORBIDDEN = [
  new RegExp(`${DENIAL}\\bpricing\\b`, 'i'),
  new RegExp(`${DENIAL}\\bpaid tiers?\\b`, 'i'),
  new RegExp(`${DENIAL}\\bfeature gating\\b`, 'i'),
  /\bedit this page\b/i,
  /\bwas this page helpful\b/i,
  /\bupgrade to (?:pro|premium)\b/i,
  /\b(?:Pricing|Tier|Upgrade)(?:Page|Table|Banner|Card)\b/,
];

interface Result {
  readonly id: string;
  readonly title: string;
  readonly status: 'pass' | 'fail' | 'warn' | 'pending';
  readonly notes: readonly string[];
}

const results: Result[] = [];

function record(id: string, title: string, problems: readonly string[], status: 'fail' | 'warn' = 'fail'): void {
  results.push({ id, title, status: problems.length === 0 ? 'pass' : status, notes: problems });
}

function flat(): Item[] {
  return navigation.sections.flatMap((section) =>
    section.items.flatMap((entry) => (entry.type === 'group' ? [...(entry.items ?? [])] : [entry])),
  );
}

function urlOf(locale: Locale, path: string): string {
  const inner = path.split('/').filter((segment) => segment !== '');
  return `/${[navigation.pluginId, ...(locale === 'en' ? [] : [locale]), ...inner].join('/')}/`;
}

function pageFile(locale: Locale, path: string, file: string): string {
  return resolve(client, `.${urlOf(locale, path)}`, file);
}

function requiredSections(item: Item): string[] {
  return templates.pages[item.page] ?? templates.templates[item.template ?? ''] ?? [];
}

function files(dir: string, extension: string): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const path = resolve(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith(extension)) found.push(path);
    }
  };
  walk(dir);
  return found;
}

// C1 — nav.json validates and has the nine fixed sections in order, with their fixed children.
function c1(): void {
  const problems = validate(navigation, schema);
  const ids = navigation.sections.map((section) => section.id);
  if (ids.join(',') !== SECTION_ORDER.join(',')) {
    problems.push(`sections are ${ids.join(', ')}; 01 §3 fixes ${SECTION_ORDER.join(', ')}`);
  }
  for (const section of navigation.sections) {
    const present = new Set(
      section.items.flatMap((entry) => (entry.type === 'group' ? (entry.items ?? []).map((i) => i.id) : [entry.id])),
    );
    for (const id of FIXED[section.id] ?? []) {
      if (!present.has(id)) problems.push(`${section.id} is missing its fixed child "${id}"`);
    }
  }
  record('C1', 'nav.json validates and keeps the fixed structure', problems);
}

// C2 — every nav item has a page component and a locale file in all seven locales.
function c2(): void {
  const problems: string[] = [];
  for (const item of flat()) {
    if (!existsSync(resolve(src, `content/pages/${item.page}.tsx`))) {
      problems.push(`${item.id}: content/pages/${item.page}.tsx is missing`);
    }
    for (const locale of LOCALES) {
      if (!existsSync(resolve(src, `locales/${locale}/pages/${item.page}.json`))) {
        problems.push(`${item.id}: locales/${locale}/pages/${item.page}.json is missing`);
      }
    }
  }
  record('C2', 'every page has a component and seven locale files', problems);
}

// C3 — exactly one h1 per page, and meta.title / meta.description are filled in every locale.
function c3(): void {
  const problems: string[] = [];
  for (const item of flat()) {
    for (const locale of LOCALES) {
      const bundle = JSON.parse(readFileSync(resolve(src, `locales/${locale}/pages/${item.page}.json`), 'utf8')) as {
        meta?: { title?: string; description?: string };
      };
      if (!bundle.meta?.title?.trim()) problems.push(`${locale}/${item.page}: meta.title is empty`);
      if (!bundle.meta?.description?.trim()) problems.push(`${locale}/${item.page}: meta.description is empty`);

      const html = pageFile(locale, item.path, 'index.html');
      if (!existsSync(html)) {
        problems.push(`${urlOf(locale, item.path)} was not prerendered`);
        continue;
      }
      const count = (readFileSync(html, 'utf8').match(/<h1\b/g) ?? []).length;
      if (count !== 1) problems.push(`${urlOf(locale, item.path)} has ${String(count)} h1 elements`);
    }
  }
  record('C3', 'one h1 per page, titles and descriptions filled', problems);
}

// C4 — every template's required sections exist, matched by section id.
function c4(): void {
  const problems: string[] = [];
  for (const item of flat()) {
    const required = requiredSections(item);
    if (required.length === 0) continue;
    const html = pageFile('en', item.path, 'index.html');
    if (!existsSync(html)) {
      problems.push(`${item.page}: not prerendered`);
      continue;
    }
    const body = readFileSync(html, 'utf8');
    const present = new Set([...body.matchAll(/<h[23][^>]*\bid="([^"]+)"/g)].map((match) => match[1] as string));
    for (const id of required) if (!present.has(id)) problems.push(`${item.page}: section "${id}" is missing`);
  }
  record('C4', "every template's required sections are present", problems);
}

// C8 — the shell matches the reference checksum.
function c8(): void {
  const reference = resolve(app, '..', '..', 'spec/docs-pack/11-docs-shell-reference/SHELL_CHECKSUM');
  const hash = shellChecksum();
  if (!existsSync(reference)) {
    results.push({
      id: 'C8',
      title: 'shell matches the reference checksum',
      status: 'pending',
      notes: [`the docs pack has no SHELL_CHECKSUM yet; this shell hashes to ${hash}`],
    });
    return;
  }
  const expected = readFileSync(reference, 'utf8').trim();
  record(
    'C8',
    'shell matches the reference checksum',
    expected === hash ? [] : [`expected ${expected}, found ${hash}`],
    'warn',
  );
}

// C9 — no raw colours or durations in site CSS outside tokens.css.
function c9(): void {
  const problems: string[] = [];
  const raw = [/#[\da-f]{3,8}\b/i, /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/i, /\b\d+m?s\b/];
  for (const file of files(src, '.css')) {
    if (file.endsWith('tokens.css')) continue;
    const name = relative(app, file).replaceAll('\\', '/');
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const code = line.replace(/\/\*[\s\S]*?\*\//g, '');
        for (const pattern of raw) {
          if (pattern.test(code)) problems.push(`${name}:${String(index + 1)} ${code.trim().slice(0, 60)}`);
        }
      });
  }
  record('C9', 'no raw colours or durations outside tokens.css', problems);
}

// C10 — none of the forbidden features, in text or in component names.
function c10(): void {
  const problems: string[] = [];
  const sources = [
    ...files(resolve(src, 'locales'), '.json'),
    ...files(resolve(src, 'content'), '.tsx'),
    ...files(resolve(src, 'shell'), '.tsx'),
  ];
  for (const file of sources) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of FORBIDDEN) {
      const match = pattern.exec(content);
      if (match !== null) problems.push(`${relative(app, file).replaceAll('\\', '/')}: "${match[0]}"`);
    }
  }
  record('C10', 'no pricing, tiers, "Edit this page" or feedback widgets', problems);
}

// C11 — the machine-readable surface exists for every locale and matches the page list.
function c11(): void {
  const problems: string[] = [];
  for (const locale of LOCALES) {
    for (const file of ['llms.txt', 'llms-full.md', 'llms-full.txt']) {
      if (!existsSync(pageFile(locale, '/', file))) problems.push(`${urlOf(locale, '/')}${file} is missing`);
    }
    const full = pageFile(locale, '/', 'llms-full.md');
    const txt = pageFile(locale, '/', 'llms-full.txt');
    if (existsSync(full) && existsSync(txt) && readFileSync(full, 'utf8') !== readFileSync(txt, 'utf8')) {
      problems.push(`${urlOf(locale, '/')}llms-full.txt is not a copy of llms-full.md`);
    }
    const index = existsSync(pageFile(locale, '/', 'llms.txt'))
      ? readFileSync(pageFile(locale, '/', 'llms.txt'), 'utf8')
      : '';
    for (const item of flat()) {
      const twin = pageFile(locale, item.path, 'index.md');
      if (!existsSync(twin)) problems.push(`${urlOf(locale, item.path)}index.md is missing`);
      if (index !== '' && !index.includes(`${urlOf(locale, item.path)}index.md`)) {
        problems.push(`${urlOf(locale, '/')}llms.txt does not list ${item.page}`);
      }
    }
  }
  if (!existsSync(resolve(client, 'sitemap.xml'))) problems.push('sitemap.xml is missing');
  record('C11', 'llms files and Markdown twins exist for every locale', problems);
}

// C15 — no rewrite in vercel.json matches /_vercel/.
function c15(): void {
  const config = JSON.parse(readFileSync(resolve(app, 'vercel.json'), 'utf8')) as {
    rewrites?: { source: string }[];
    redirects?: { source: string }[];
  };
  const problems = [...(config.rewrites ?? []), ...(config.redirects ?? [])]
    .filter((rule) => rule.source.includes('_vercel') || rule.source === '/(.*)' || rule.source === '/:path*')
    .map((rule) => `"${rule.source}" can swallow /_vercel/`);
  record('C15', 'no rule matches /_vercel/', problems);
}

function pending(id: string, title: string, milestone: string): void {
  results.push({ id, title, status: 'pending', notes: [`arrives with ${milestone}`] });
}

function main(): number {
  c1();
  c2();
  c3();
  c4();
  pending('C5', 'capability pages have a demo, limitations and api', 'M5');
  pending('C6', 'no hand-written props tables', 'M6');
  pending('C7', 'every public prop is in the Playground', 'M6');
  c8();
  c9();
  c10();
  c11();
  pending('C12', 'zero-reference scan of apps/docs', 'the repository-wide `pnpm check:zero-reference`');
  pending('C13', 'every demo source is imported once as ?raw', 'M5');
  pending('C14', 'sample assets are listed in SOURCES.md', 'M5');
  c15();

  let failed = 0;
  for (const result of results) {
    const mark = { pass: 'OK  ', fail: 'FAIL', warn: 'WARN', pending: '… ' }[result.status];
    console.log(`${mark} ${result.id} ${result.title}`);
    for (const note of result.notes.slice(0, 10)) console.log(`       ${note}`);
    if (result.notes.length > 10) console.log(`       … and ${String(result.notes.length - 10)} more`);
    if (result.status === 'fail') failed += 1;
  }
  console.log(failed === 0 ? 'conformance: OK' : `conformance: ${String(failed)} check(s) failed`);
  return failed === 0 ? 0 : 1;
}

process.exitCode = main();
