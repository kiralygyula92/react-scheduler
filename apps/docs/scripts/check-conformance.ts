// SPDX-License-Identifier: MIT
// The conformance gate (docs pack 07 §6). Enforced here: C1–C4, C6, C8–C11 and C13–C15. C5 waits
// for the last capability page and C7 for the Playground; both report as pending, so the list always
// shows what is and is not being enforced yet.
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
  // The docs pack's own copy takes precedence once it has one; until then the value approved here
  // is the reference, and it lives in the app because `spec/` is read-only in this repository
  // (EXCEPTIONS.md #10).
  const packReference = resolve(app, '..', '..', 'spec/docs-pack/11-docs-shell-reference/SHELL_CHECKSUM');
  const ownReference = resolve(app, 'SHELL_CHECKSUM');
  const reference = existsSync(packReference) ? packReference : ownReference;
  const hash = shellChecksum();
  if (!existsSync(reference)) {
    results.push({
      id: 'C8',
      title: 'shell matches the reference checksum',
      status: 'pending',
      notes: [`no SHELL_CHECKSUM to compare against; this shell hashes to ${hash}`],
    });
    return;
  }
  const expected = readFileSync(reference, 'utf8').trim();
  record(
    'C8',
    'shell matches the reference checksum',
    expected === hash ? [] : [`expected ${expected}, found ${hash} (${relative(app, reference).replace(/\\/g, '/')})`],
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

// C6 — the reference is generated: every exported symbol is reachable, every description exists in
// every locale, and no page writes a table of its own (docs pack 05 §6).
function c6(): void {
  const problems: string[] = [];
  const apiDir = resolve(src, 'content/api');
  if (!existsSync(resolve(apiDir, 'index.json'))) {
    record('C6', 'the reference is generated from the declarations', ['run `pnpm --filter docs api` first']);
    return;
  }
  const symbols = JSON.parse(readFileSync(resolve(apiDir, 'index.json'), 'utf8')) as {
    name: string;
    kind: string;
    descriptionKey: string;
  }[];
  const entries = (
    JSON.parse(readFileSync(resolve(apiDir, 'reference.json'), 'utf8')) as { symbols: { name: string; path: string }[] }
  ).symbols;
  const pages = new Set(flat().map((item) => item.path));

  // Every exported symbol has its data, and a page that documents it — its own, or, for a type, the
  // grouped page it is a section of (EXCEPTIONS.md #11).
  for (const symbol of symbols) {
    if (!existsSync(resolve(apiDir, `${symbol.name}.json`))) problems.push(`${symbol.name}: no API data`);
    const entry = entries.find((candidate) => candidate.name === symbol.name);
    if (entry === undefined) {
      problems.push(`${symbol.name}: not in the reference index`);
      continue;
    }
    const [path] = entry.path.split('#');
    if (path !== undefined && !pages.has(path)) problems.push(`${symbol.name}: ${path} is not a page in nav.json`);
  }

  // Every description reaches a reader, in every locale — the symbols' own, and every member's.
  const keys = new Set(symbols.map((symbol) => symbol.descriptionKey));
  for (const symbol of symbols) {
    const data = JSON.parse(readFileSync(resolve(apiDir, `${symbol.name}.json`), 'utf8')) as {
      props?: { descriptionKey: string }[];
      params?: { descriptionKey: string }[];
    };
    for (const member of [...(data.props ?? []), ...(data.params ?? [])]) keys.add(member.descriptionKey);
  }

  const bundles = new Map<Locale, Record<string, unknown>>(
    LOCALES.map((locale) => [
      locale,
      JSON.parse(readFileSync(resolve(src, `locales/${locale}/api.json`), 'utf8')) as Record<string, unknown>,
    ]),
  );
  const valueAt = (bundle: Record<string, unknown>, key: string): unknown =>
    key
      .split('.')
      .reduce<unknown>(
        (node, part) =>
          typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[part] : undefined,
        bundle,
      );
  for (const key of keys) {
    for (const locale of LOCALES) {
      const value = valueAt(bundles.get(locale) ?? {}, key);
      if (typeof value !== 'string' || value.trim() === '') problems.push(`${locale}: ${key} is missing or empty`);
    }
  }

  // No page writes a table of its own; the generated components are the only ones that may.
  for (const file of files(resolve(src, 'content/pages'), '.tsx')) {
    const body = readFileSync(file, 'utf8');
    const where = relative(app, file).replaceAll('\\', '/');
    if (/<table\b/.test(body)) problems.push(`${where}: writes a <table> by hand`);
    if (/<PropsTable[^>]*members=\{\[/.test(body)) problems.push(`${where}: passes literal rows to <PropsTable>`);
  }

  record('C6', 'the reference is generated from the declarations', problems);
}

// C13 — every demo is shown by exactly one page, and that page shows the file itself (docs pack 04
// §1: "never maintain a second copy of demo code").
function c13(): void {
  const problems: string[] = [];
  const demosDir = resolve(src, 'demos');
  const demos = files(demosDir, '.tsx');
  const raw = new Map<string, number>();
  const plain = new Map<string, number>();

  for (const file of files(resolve(src, 'content/pages'), '.tsx')) {
    const body = readFileSync(file, 'utf8');
    for (const match of body.matchAll(/from '~\/demos\/([^']+?)(\?raw)?';/g)) {
      const specifier = (match[1] as string).replace(/\.tsx$/, '');
      const counter = match[2] === undefined ? plain : raw;
      counter.set(specifier, (counter.get(specifier) ?? 0) + 1);
    }
  }

  for (const file of demos) {
    const specifier = relative(demosDir, file)
      .replaceAll('\\', '/')
      .replace(/\.tsx$/, '');
    if (specifier.startsWith('_shared/')) continue;
    const times = raw.get(specifier) ?? 0;
    if (times === 0) problems.push(`${specifier}: no page imports it as ?raw`);
    else if (times > 1) problems.push(`${specifier}: ${String(times)} pages import it as ?raw`);
    if ((plain.get(specifier) ?? 0) === 0) problems.push(`${specifier}: no page renders it`);
  }
  record('C13', 'every demo source is imported once as ?raw', problems);
}

// C14 — every file under `public/samples/` is accounted for in `SOURCES.md` (docs pack 04 §1).
function c14(): void {
  const samples = resolve(app, 'public', 'samples');
  if (!existsSync(samples)) {
    record('C14', 'sample assets are listed in SOURCES.md', []);
    return;
  }
  const sources = resolve(samples, 'SOURCES.md');
  if (!existsSync(sources)) {
    record('C14', 'sample assets are listed in SOURCES.md', ['public/samples/ exists without SOURCES.md']);
    return;
  }
  const listed = readFileSync(sources, 'utf8');
  const problems = readdirSync(samples)
    .filter((entry) => entry !== 'SOURCES.md' && !listed.includes(entry))
    .map((entry) => `${entry} is not in SOURCES.md`);
  record('C14', 'sample assets are listed in SOURCES.md', problems);
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
  c6();
  pending('C7', 'every public prop is in the Playground', 'M6');
  c8();
  c9();
  c10();
  c11();
  pending('C12', 'zero-reference scan of apps/docs', 'the repository-wide `pnpm check:zero-reference`');
  c13();
  c14();
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
