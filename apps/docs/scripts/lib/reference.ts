// SPDX-License-Identifier: MIT
// Writes the Reference section: one page per exported value, five grouped pages for the exported
// types, their locale files, and the `reference` section of `nav.json`. Generated from the API data,
// so an export that appears or disappears reaches the sidebar, the routes and the pages through
// `pnpm --filter docs api` alone — which is what the drift check of 05 §6 asks for.
//
// The types are grouped rather than given a page each (EXCEPTIONS.md #11): 82 single-type pages
// would be 82 sidebar entries, most of them one alias.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { format, type Options, resolveConfig } from 'prettier';

const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
type Locale = (typeof LOCALES)[number];

const app = resolve(import.meta.dirname, '..', '..');
const pagesDir = resolve(app, 'src', 'content', 'pages', 'reference');
const localesDir = resolve(app, 'src', 'locales');
const navPath = resolve(app, 'src', 'content', 'nav.json');

export interface ReferenceSymbol {
  readonly name: string;
  readonly kind: 'component' | 'hook' | 'function' | 'type' | 'constant';
}

export interface ReferenceCssVar {
  readonly name: string;
  readonly light: string;
  readonly dark: string;
  readonly category: string;
}

/** Which grouped page a type belongs to. The first rule that matches wins. */
const TYPE_GROUPS: readonly { readonly id: string; readonly test: RegExp }[] = [
  { id: 'events', test: /Handlers|Events|Middleware|ActivationSource|CloseReason|HeaderReason|NavState|NavPosition/ },
  // `Part(?![a-z])` so that `SchedulerPart` and `PartExtraProps` land here and `DeepPartial` does not.
  {
    id: 'slots',
    test: /Slot|Part(?![a-z])|OwnerState|Context$|ItemProps|ElementProps|PinSentinel|OverflowColumn|TokenName/,
  },
  { id: 'localization', test: /Localization|Formatters|PluralForms|DeepPartial/ },
  { id: 'options', test: /Options|Props$|Flags/ },
  { id: 'model', test: /./ },
];

/** `useScheduler` → `use-scheduler`; `Scheduler` → `scheduler`; `CARRIED_OVER_TAG` → `carried-over-tag`. */
export function slugOf(name: string): string {
  return name
    .replaceAll('_', '-')
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function groupOf(name: string): string {
  return TYPE_GROUPS.find((group) => group.test.test(name))?.id ?? 'model';
}

function componentName(slug: string): string {
  const name = slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `${name}Page`;
}

/** `SchedulerEvents` → `schedulerEvents_`: a local name for the JSON a grouped page imports. */
function localName(symbol: string): string {
  return `${symbol.charAt(0).toLowerCase()}${symbol.slice(1)}_`;
}

let prettierOptions: Options = {};

/** Generated files are committed, so they go through Prettier exactly as hand-written ones do. */
async function write(path: string, source: string): Promise<void> {
  const contents = await format(source, { ...prettierOptions, filepath: path });
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path) && readFileSync(path, 'utf8') === contents) return;
  writeFileSync(path, contents);
}

function readBundle(path: string): Record<string, unknown> {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>) : {};
}

/**
 * The description of a symbol in one locale, from that locale's `api.json`. The inline code markers
 * of TSDoc are dropped here: this string becomes the page's lead and its `<meta name="description">`,
 * where a backtick would be read aloud and indexed as it stands.
 */
function descriptionOf(api: Record<string, unknown>, name: string): string {
  const entry = (api[name] ?? {}) as { description?: unknown };
  return typeof entry.description === 'string' ? entry.description.replaceAll('`', '') : '';
}

interface NavItem {
  readonly id: string;
  readonly labelKey: string;
  readonly path: string;
  readonly page: string;
  readonly template: string;
}

interface NavGroup {
  readonly type: 'group';
  readonly labelKey: string;
  readonly items: readonly NavItem[];
}

export interface ReferenceResult {
  /** Every generated page, in sidebar order. */
  readonly items: readonly NavItem[];
  readonly pages: number;
}

/** The four groups the reference is read in, in the order 05 §6 lists them. */
const GROUPS: readonly { readonly id: string; readonly kinds: readonly ReferenceSymbol['kind'][] }[] = [
  { id: 'components', kinds: ['component'] },
  { id: 'hooks', kinds: ['hook'] },
  { id: 'functions', kinds: ['function', 'constant'] },
];

export async function writeReference(
  symbols: readonly ReferenceSymbol[],
  cssVars: readonly ReferenceCssVar[],
): Promise<ReferenceResult> {
  prettierOptions = (await resolveConfig(navPath)) ?? {};
  const values = symbols.filter((symbol) => symbol.kind !== 'type');
  const types = symbols.filter((symbol) => symbol.kind === 'type');

  // One page per exported value. The data is imported statically, so it is in the prerendered HTML
  // and each page's chunk carries only its own symbol.
  for (const symbol of values) {
    const slug = slugOf(symbol.name);
    await write(
      resolve(pagesDir, `${slug}.tsx`),
      `// SPDX-License-Identifier: MIT
// Generated by scripts/extract-api.ts from the package's declarations — do not edit.
import data from '~/content/api/${symbol.name}.json';
import { SymbolPage } from '~/shell/doc';

export default function ${componentName(slug)}(): React.ReactElement {
  return <SymbolPage data={data} ns="pages/reference/${slug}" />;
}
`,
    );
  }

  // One page per group of exported types, in the order the package declares them.
  const grouped = new Map<string, string[]>();
  for (const type of types) {
    const group = groupOf(type.name);
    grouped.set(group, [...(grouped.get(group) ?? []), type.name]);
  }
  const groupIds = [...grouped.keys()].sort((a, b) => a.localeCompare(b));
  for (const group of groupIds) {
    const names = grouped.get(group) ?? [];
    await write(
      resolve(pagesDir, `types-${group}.tsx`),
      `// SPDX-License-Identifier: MIT
// Generated by scripts/extract-api.ts from the package's declarations — do not edit.
${names.map((name) => `import ${localName(name)} from '~/content/api/${name}.json';`).join('\n')}
import { TypeGroupPage } from '~/shell/doc';

const TYPES = [${names.map((name) => localName(name)).join(', ')}];

export default function ${componentName(`types-${group}`)}(): React.ReactElement {
  return <TypeGroupPage types={TYPES} ns="pages/reference/types-${group}" />;
}
`,
    );
  }

  // The locale files of the generated pages: a value page is titled after the symbol and led by the
  // description already translated in `api.json`; a grouped page takes both from `typeGroups`.
  for (const locale of LOCALES) {
    const api = readBundle(resolve(localesDir, locale, 'api.json'));
    const groupStrings = (api['typeGroups'] ?? {}) as Record<string, { title?: string; description?: string }>;
    for (const group of groupIds) {
      await writeLocalePage(locale, `types-${group}`, {
        title: groupStrings[group]?.title ?? group,
        description: groupStrings[group]?.description ?? '',
      });
    }
    for (const symbol of values) {
      await writeLocalePage(locale, slugOf(symbol.name), {
        title: symbol.name,
        description: descriptionOf(api, symbol.name),
      });
    }
  }

  const items: NavItem[] = [];
  const entries: (NavItem | NavGroup)[] = [];
  for (const group of GROUPS) {
    const groupItems = values
      .filter((symbol) => group.kinds.includes(symbol.kind))
      .map((symbol) => itemOf(slugOf(symbol.name)));
    if (groupItems.length > 0)
      entries.push({ type: 'group', labelKey: `nav.apiGroups.${group.id}`, items: groupItems });
    items.push(...groupItems);
  }
  const typeItems = groupIds.map((group) => itemOf(`types-${group}`, 'T16'));
  entries.push({ type: 'group', labelKey: 'nav.apiGroups.types', items: typeItems });
  items.push(...typeItems);

  await writeNav(entries);
  await writeNavLabels(
    values.map((symbol) => symbol.name),
    groupIds,
  );

  // What the API index (T10) lists: every symbol with the page that documents it, and the design
  // tokens. Written here because the grouping of the types only exists in this file.
  writeFileSync(
    resolve(app, 'src', 'content', 'api', 'reference.json'),
    `${JSON.stringify(
      {
        symbols: [
          ...values.map((symbol) => ({
            name: symbol.name,
            kind: symbol.kind,
            descriptionKey: `${symbol.name}.description`,
            path: `/api/${slugOf(symbol.name)}/`,
          })),
          ...types.map((type) => ({
            name: type.name,
            kind: type.kind,
            descriptionKey: `${type.name}.description`,
            path: `/api/types-${groupOf(type.name)}/#${slugOf(type.name)}`,
          })),
        ],
        cssVars,
      },
      null,
      2,
    )}\n`,
  );

  return { items, pages: items.length };
}

function itemOf(slug: string, template = 'T11'): NavItem {
  return {
    id: `api-${slug}`,
    labelKey: `nav.api.${slug}`,
    path: `/api/${slug}/`,
    page: `reference/${slug}`,
    template,
  };
}

async function writeLocalePage(
  locale: Locale,
  slug: string,
  meta: { title: string; description: string },
): Promise<void> {
  await write(
    resolve(localesDir, locale, 'pages', 'reference', `${slug}.json`),
    `${JSON.stringify({ _meta: { status: locale === 'en' ? 'draft' : 'machine', source: 'extract-api' }, meta }, null, 2)}\n`,
  );
}

/** Replaces the generated part of the Reference section; the API index stays as it is written. */
async function writeNav(entries: readonly (NavItem | NavGroup)[]): Promise<void> {
  const navigation = JSON.parse(readFileSync(navPath, 'utf8')) as {
    sections: { id: string; items: (NavItem | NavGroup)[] }[];
  };
  const section = navigation.sections.find((candidate) => candidate.id === 'reference');
  if (section === undefined) throw new Error('nav.json has no "reference" section');
  const fixed = section.items.filter((entry) => !('type' in entry) && !entry.id.startsWith('api-'));
  section.items = [...fixed, ...entries];
  await write(navPath, `${JSON.stringify(navigation, null, 2)}\n`);
}

/** The sidebar labels: a symbol's own name in every locale, the group labels translated by hand. */
async function writeNavLabels(names: readonly string[], groupIds: readonly string[]): Promise<void> {
  const labels: Record<string, string> = {};
  for (const name of names) labels[slugOf(name)] = name;
  for (const group of groupIds) labels[`types-${group}`] = `types-${group}`;

  for (const locale of LOCALES) {
    const path = resolve(localesDir, locale, 'nav.json');
    const bundle = readBundle(path);
    const groupStrings = (readBundle(resolve(localesDir, locale, 'api.json'))['typeGroups'] ?? {}) as Record<
      string,
      { title?: string }
    >;
    bundle['api'] = Object.fromEntries(
      Object.entries(labels).map(([slug, label]) => [
        slug,
        slug.startsWith('types-') ? (groupStrings[slug.slice('types-'.length)]?.title ?? label) : label,
      ]),
    );
    await write(path, `${JSON.stringify(bundle, null, 2)}\n`);
  }
}
