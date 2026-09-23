// SPDX-License-Identifier: MIT
// Generates the API data the reference, the Playground and the theme editor read (docs pack 05 §2).
// The package's TypeScript declarations are the only source: names, types, defaults and structure
// come from the compiler, prose comes from TSDoc and is seeded into `locales/en/api.json`, and
// nothing here is written by hand.
//
// It uses the TypeScript 6 compiler API through the `typescript-api` alias, because TypeScript 7
// ships without a stable programmatic API (docs pack 05 §2, ADR 0001 D1).
//
// Usage: node scripts/extract-api.ts   (`pnpm --filter docs api`)
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript-api';
import { nav, pages } from './lib/nav.ts';
import { writeReference } from './lib/reference.ts';
import { writeFixtures } from './lib/fixtures.ts';
import { writeSummaries } from './lib/summaries.ts';

const packageRoot = resolve(import.meta.dirname, '..', '..', '..', 'packages', 'react-scheduler');
const outputDir = resolve(import.meta.dirname, '..', 'src', 'content', 'api');
const localesDir = resolve(import.meta.dirname, '..', 'src', 'locales');

/** Entry point → the source file that implements it, in the order the reference lists them. */
const ENTRIES: readonly { readonly importPath: string; readonly file: string }[] = [
  { importPath: nav.packageName, file: 'src/index.ts' },
  { importPath: `${nav.packageName}/core`, file: 'src/core.ts' },
  { importPath: `${nav.packageName}/headless`, file: 'src/headless.ts' },
  { importPath: `${nav.packageName}/dom`, file: 'src/dom.ts' },
  { importPath: `${nav.packageName}/locales`, file: 'src/locales/index.ts' },
];

type SymbolKind = 'component' | 'hook' | 'function' | 'type' | 'constant';

type TypeKind = 'boolean' | 'number' | 'string' | 'literal-union' | 'union' | 'function' | 'node' | 'object' | 'array';

interface ApiProp {
  name: string;
  type: string;
  typeKind: TypeKind;
  literals?: string[];
  default?: string;
  required: boolean;
  category?: string;
  min?: number;
  max?: number;
  step?: number;
  descriptionKey: string;
  since?: string;
  deprecated?: string | null;
}

interface ApiCssVar {
  name: string;
  light: string;
  dark: string;
  category: string;
}

interface ApiSymbolData {
  name: string;
  kind: SymbolKind;
  importPath: string;
  since: string | null;
  deprecated: string | null;
  descriptionKey: string;
  props?: ApiProp[];
  params?: ApiProp[];
  /** The members of a string-literal union, which the reference lists instead of an empty table. */
  literals?: string[];
  returns?: string | null;
  slots?: { name: string; propsType: string }[];
  cssVars?: ApiCssVar[];
  classes?: { name: string; descriptionKey: string }[];
  usedBy: string[];
  sourcePath: string;
}

const strings = new Map<string, string>();

/**
 * TSDoc cites the specifications this package was built from ("(Feature Dossier 04 §4)"), which is
 * useful in the source and meaningless on the site. The seed keeps the sentence and drops the
 * citation; prose edited afterwards in `locales/en/api.json` is never touched.
 */
function forReaders(description: string): string {
  return (
    description
      .replace(/\s*\((?:Feature Dossier|docs pack)[^)]*\)/g, '')
      // Any parenthetical citing a specification section or an identifier from it, such as
      // "(01 §L.7)", "(B-03: the view closes)" or "(the views render only their root, LV-10)".
      .replace(/\s*\([^)]*(?:§|\b[A-Z]{1,3}-\d+\b)[^)]*\)/g, '')
      .replace(/\s*\((?:F-\d+|B-\d+)(?:,\s*(?:F-\d+|B-\d+))*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function tagText(tags: readonly ts.JSDocTagInfo[], name: string): string | undefined {
  const tag = tags.find((candidate) => candidate.name === name);
  if (tag === undefined) return undefined;
  return ts.displayPartsToString(tag.text ?? []).trim() || undefined;
}

function numberTag(tags: readonly ts.JSDocTagInfo[], name: string): number | undefined {
  const raw = tagText(tags, name);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** The kind the reference groups a symbol by. */
function kindOf(symbol: ts.Symbol, checker: ts.TypeChecker): SymbolKind {
  const declaration = symbol.declarations?.[0];
  if (declaration !== undefined && (ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration))) {
    return 'type';
  }
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration ?? symbol.valueDeclaration ?? (symbol as never));
  const callable = type.getCallSignatures().length > 0;
  if (!callable) return 'constant';
  if (/^use[A-Z]/.test(symbol.getName())) return 'hook';
  return /^[A-Z]/.test(symbol.getName()) ? 'component' : 'function';
}

function typeKindOf(text: string, literals: string[]): TypeKind {
  if (literals.length > 0) return 'literal-union';
  if (text === 'boolean' || text === 'boolean | undefined') return 'boolean';
  if (text === 'number' || text === 'number | undefined') return 'number';
  if (text === 'string' || text === 'string | undefined') return 'string';
  if (text.includes('=>')) return 'function';
  if (text.includes('ReactNode') || text.includes('ReactElement')) return 'node';
  if (text.includes('[]') || text.startsWith('readonly ')) return 'array';
  if (text.includes('|')) return 'union';
  return 'object';
}

/** String literals of a union type, which become a select in the Playground. */
function literalsOf(type: ts.Type): string[] {
  const parts = type.isUnion() ? type.types : [type];
  const literals = parts.filter((part) => part.isStringLiteral()).map((part) => String(part.value));
  return literals.length > 1 ? literals : [];
}

/**
 * Where a member is declared. `compactBreakpoint` belongs to `SchedulerOptions`, whether it is read
 * through `Scheduler`, `ListView` or `SchedulerProps`, so all three point at one description — and
 * one translation — instead of four copies of the same sentence (a refinement of 05 §2.1, which
 * keys by the symbol a member is read through).
 */
function declaringTypeOf(property: ts.Symbol, fallback: string): string {
  const parent = property.declarations?.[0]?.parent;
  if (parent === undefined) return fallback;
  if (ts.isInterfaceDeclaration(parent) || ts.isTypeAliasDeclaration(parent)) return parent.name.text;
  if (ts.isTypeLiteralNode(parent) && ts.isTypeAliasDeclaration(parent.parent)) return parent.parent.name.text;
  return fallback;
}

function memberOf(property: ts.Symbol, checker: ts.TypeChecker, owner: string): ApiProp {
  const declaration = property.declarations?.[0];
  const type = declaration
    ? checker.getTypeOfSymbolAtLocation(property, declaration)
    : checker.getDeclaredTypeOfSymbol(property);
  const text = checker
    .typeToString(
      type,
      declaration,
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType,
    )
    .replace(/ \| undefined$/, '');
  const tags = property.getJsDocTags(checker);
  const description = ts.displayPartsToString(property.getDocumentationComment(checker)).trim();
  const descriptionKey = `${declaringTypeOf(property, owner)}.props.${property.getName()}`;
  if (description !== '') strings.set(descriptionKey, forReaders(description));
  const literals = literalsOf(type);
  const deprecated = tagText(tags, 'deprecated');

  return {
    name: property.getName(),
    type: text,
    typeKind: typeKindOf(text, literals),
    ...(literals.length > 0 && { literals }),
    ...(tagText(tags, 'defaultValue') !== undefined && { default: tagText(tags, 'defaultValue') as string }),
    required: (property.flags & ts.SymbolFlags.Optional) === 0,
    ...(tagText(tags, 'category') !== undefined && { category: tagText(tags, 'category') as string }),
    ...(numberTag(tags, 'min') !== undefined && { min: numberTag(tags, 'min') as number }),
    ...(numberTag(tags, 'max') !== undefined && { max: numberTag(tags, 'max') as number }),
    ...(numberTag(tags, 'step') !== undefined && { step: numberTag(tags, 'step') as number }),
    descriptionKey,
    ...(tagText(tags, 'since') !== undefined && { since: tagText(tags, 'since') as string }),
    deprecated: deprecated ?? null,
  };
}

/**
 * The props of a component or the members of a type, in declaration order. Only what the package
 * declares itself: a props type that extends React's `HTMLAttributes` would otherwise bring several
 * hundred DOM attributes into the reference and into every locale file.
 */
function membersOf(type: ts.Type, checker: ts.TypeChecker, owner: string): ApiProp[] {
  const properties = checker
    .getPropertiesOfType(type)
    .filter((property) => !property.getName().startsWith('__'))
    .filter((property) => {
      const file = property.declarations?.[0]?.getSourceFile().fileName ?? '';
      return file.includes('/packages/react-scheduler/src/');
    });
  const ordered = properties.map((property) => ({
    property,
    position: property.declarations?.[0]?.getStart() ?? Number.MAX_SAFE_INTEGER,
    file: property.declarations?.[0]?.getSourceFile().fileName ?? '',
  }));
  ordered.sort((a, b) => (a.file === b.file ? a.position - b.position : a.file.localeCompare(b.file)));
  return ordered.map((entry) => memberOf(entry.property, checker, owner)).filter((prop) => prop.name !== 'ref');
}

/** Which capability pages document a symbol, from each page's `symbols` list (05 §2.1). */
function usedBy(name: string): string[] {
  return pages()
    .filter((page) => (page.symbols ?? []).includes(name))
    .map((page) => page.id);
}

function cssVariables(): ApiCssVar[] {
  const css = readFileSync(resolve(packageRoot, 'src/styles/tokens.css'), 'utf8');
  const blocks = (selector: RegExp): string => {
    const match = selector.exec(css);
    return match?.[0] ?? '';
  };
  const light = blocks(/\.rs-root\s*\{[\s\S]*?\n\s*\}/);
  const dark = blocks(/\[data-rs-scheme=['"]dark['"]\][\s\S]*?\{[\s\S]*?\n\s*\}/);
  const read = (block: string): Map<string, string> => {
    const values = new Map<string, string>();
    for (const [, name, value] of block.matchAll(/(--rs-[\w-]+)\s*:\s*([^;]+);/g)) {
      if (name !== undefined && value !== undefined) values.set(name, value.trim().replace(/\s+/g, ' '));
    }
    return values;
  };
  const lightValues = read(light);
  const darkValues = read(dark);
  return [...lightValues].map(([name, value]) => ({
    name,
    light: value,
    dark: darkValues.get(name) ?? value,
    // `--rs-color-text-muted` → "color": the family a token belongs to.
    category: name.replace('--rs-', '').split('-')[0] ?? 'other',
  }));
}

function program(): ts.Program {
  const configPath = resolve(packageRoot, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, (path) => readFileSync(path, 'utf8'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot);
  return ts.createProgram({
    rootNames: ENTRIES.map((entry) => resolve(packageRoot, entry.file)),
    options: { ...parsed.options, noEmit: true },
  });
}

async function main(): Promise<number> {
  const compiled = program();
  const checker = compiled.getTypeChecker();
  const symbols: ApiSymbolData[] = [];
  const seen = new Set<string>();

  for (const entry of ENTRIES) {
    const source = compiled.getSourceFile(resolve(packageRoot, entry.file));
    if (source === undefined) {
      console.error(`api: ${entry.file} is not part of the program`);
      return 1;
    }
    const moduleSymbol = checker.getSymbolAtLocation(source);
    if (moduleSymbol === undefined) continue;

    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const symbol = (exported.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(exported) : exported;
      const name = exported.getName();
      if (seen.has(name)) continue;
      seen.add(name);

      const declaration = symbol.declarations?.[0];
      const kind = kindOf(symbol, checker);
      const tags = symbol.getJsDocTags(checker);
      const description = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
      const descriptionKey = `${name}.description`;
      if (description !== '') strings.set(descriptionKey, forReaders(description));

      const data: ApiSymbolData = {
        name,
        kind,
        importPath: entry.importPath,
        since: tagText(tags, 'since') ?? null,
        deprecated: tagText(tags, 'deprecated') ?? null,
        descriptionKey,
        usedBy: usedBy(name),
        sourcePath: (declaration?.getSourceFile().fileName ?? '')
          .split('/packages/')
          .slice(-1)
          .map((path) => `packages/${path}`)[0] as string,
      };

      if (kind === 'component' || kind === 'hook' || kind === 'function') {
        const type = checker.getTypeOfSymbolAtLocation(symbol, declaration ?? source);
        const signature = type.getCallSignatures()[0];
        if (signature !== undefined) {
          const parameters = signature.getParameters();
          const first = parameters[0];
          if (kind === 'component' && first !== undefined) {
            const propsType = checker.getTypeOfSymbolAtLocation(first, declaration ?? source);
            data.props = membersOf(propsType, checker, name);
          } else {
            data.params = parameters.map((parameter) => memberOf(parameter, checker, name));
          }
          data.returns = checker.typeToString(signature.getReturnType(), declaration, ts.TypeFormatFlags.NoTruncation);
        }
      } else if (kind === 'type' && declaration !== undefined) {
        const declared = checker.getDeclaredTypeOfSymbol(symbol);
        const members = membersOf(declared, checker, name);
        if (members.length > 0) data.props = members;
        const literals = literalsOf(declared);
        if (literals.length > 0) data.literals = literals;
      }

      symbols.push(data);
    }
  }

  // The main component also carries the design tokens and the parts, which the Customization pages
  // and the theme editor read (05 §5).
  const main_ = symbols.find((symbol) => symbol.name === 'Scheduler');
  if (main_ !== undefined) {
    main_.cssVars = cssVariables();
    // `SchedulerPart` is the package's slot map (09 §4.3): a union of the part names, each of which
    // `SchedulerSlots` maps to a component taking `SlotProps<part>`.
    const parts = symbols.find((symbol) => symbol.name === 'SchedulerPart');
    main_.slots = (parts?.literals ?? []).map((part) => ({
      name: part,
      propsType: `SlotProps<'${part}', TItem>`,
    }));
  }

  if (existsSync(outputDir)) {
    for (const file of readdirSync(outputDir)) rmSync(resolve(outputDir, file));
  }
  mkdirSync(outputDir, { recursive: true });
  for (const symbol of symbols) {
    writeFileSync(resolve(outputDir, `${symbol.name}.json`), `${JSON.stringify(symbol, null, 2)}\n`);
  }
  writeFileSync(
    resolve(outputDir, 'index.json'),
    `${JSON.stringify(
      symbols.map((symbol) => ({
        name: symbol.name,
        kind: symbol.kind,
        importPath: symbol.importPath,
        descriptionKey: symbol.descriptionKey,
        usedBy: symbol.usedBy,
      })),
      null,
      2,
    )}\n`,
  );

  // The English seed, and the English locale file it feeds: the extractor adds the keys it found and
  // never overwrites prose that was edited by hand (05 §3). Keys whose symbol is gone are dropped,
  // so a removed prop cannot leave a description behind.
  writeFileSync(
    resolve(outputDir, 'api-strings.en.json'),
    `${JSON.stringify(Object.fromEntries([...strings].sort()), null, 2)}\n`,
  );

  const englishPath = resolve(localesDir, 'en', 'api.json');
  const english = existsSync(englishPath) ? (JSON.parse(readFileSync(englishPath, 'utf8')) as Bundle) : {};
  const merged: Bundle = {
    _meta: { status: 'draft', source: 'extract-api' },
    table: TABLE_HEADERS,
    sections: SECTION_HEADINGS,
    typeGroups: TYPE_GROUPS,
  };
  let added = 0;
  for (const [key, value] of [...strings].sort()) {
    const existing = read(english, key);
    if (existing === undefined) added += 1;
    write(merged, key, existing ?? value);
  }
  const removed = keysOf(english).filter(
    (key) =>
      !key.startsWith('table.') && !key.startsWith('sections.') && !key.startsWith('typeGroups.') && !strings.has(key),
  ).length;
  writeFileSync(englishPath, `${JSON.stringify(merged, null, 2)}\n`);

  const reference = await writeReference(
    symbols.map(({ name, kind }) => ({ name, kind })),
    main_?.cssVars ?? [],
  );

  console.log(
    `api: ${String(symbols.length)} symbols, ${String(strings.size)} descriptions (${String(added)} added, ${String(removed)} dropped)`,
  );
  console.log(`api: ${String(reference.pages)} reference pages`);
  console.log(`api: ${String(writeSummaries())} page summaries × 7 locales`);
  console.log(`api: ${String(writeFixtures())} scenario fixtures`);
  return 0;
}

type Bundle = Record<string, unknown>;

/** The grouped type pages: their titles and leads (see lib/reference.ts for the grouping). */
const TYPE_GROUPS = {
  events: {
    title: 'Event and handler types',
    description: 'The types of the callbacks and of the middleware: what each one receives and what it may return.',
  },
  localization: {
    title: 'Localization types',
    description: 'The shape of a locale pack and of the formatters, and the helpers around them.',
  },
  model: {
    title: 'Model types',
    description: 'The data the scheduler places: items, levels, tags, shifts and the layout they produce.',
  },
  options: {
    title: 'Options and props types',
    description: 'The options of the controller and the props of the components, as types.',
  },
  slots: {
    title: 'Slot and rendering types',
    description: 'The parts, their owner state, and what every slot and render prop receives.',
  },
};

/** The sections of a symbol page (05 §4), in the order they are rendered. */
const SECTION_HEADINGS = {
  import: 'Import',
  demos: 'Where it is used',
  props: 'Props',
  parameters: 'Parameters',
  returns: 'Returns',
  slots: 'Slots',
  cssVariables: 'CSS variables',
  classes: 'Class names',
  source: 'Source',
};

/** The column headers of the generated tables; they are prose, so they live with the strings. */
const TABLE_HEADERS = {
  prop: 'Prop',
  type: 'Type',
  default: 'Default',
  description: 'Description',
  parameter: 'Parameter',
  returns: 'Returns',
  slot: 'Slot',
  propsType: 'Props type',
  variable: 'Variable',
  light: 'Light',
  dark: 'Dark',
  class: 'Class',
  name: 'Name',
  kind: 'Kind',
};

function read(bundle: Bundle, key: string): string | undefined {
  let node: unknown = bundle;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Bundle)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function write(bundle: Bundle, key: string, value: string): void {
  const parts = key.split('.');
  let node = bundle;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
    node = node[part] as Bundle;
  }
  node[parts.at(-1) as string] = value;
}

function keysOf(bundle: Bundle, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(bundle)) {
    if (key === '_meta') continue;
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') keys.push(path);
    else if (typeof value === 'object' && value !== null) keys.push(...keysOf(value as Bundle, path));
  }
  return keys;
}

process.exitCode = await main();
