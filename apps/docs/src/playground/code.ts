// SPDX-License-Identifier: MIT
// The JSX the Playground shows (docs pack 04 §4.4): the imports, the stylesheet and exactly the
// props that differ from their defaults — never the whole prop list, because the point is to show
// what the reader changed.
import type { Control } from './model';
import { parseValue } from './model';

const PACKAGE = '@react-schedulerkit/react-scheduler';

/** The locale packs by the site's language code, as their subpath exports them. */
const PACKS: Readonly<Record<string, { readonly name: string; readonly subpath: string }>> = {
  en: { name: 'enUS', subpath: 'en' },
  ro: { name: 'roRO', subpath: 'ro' },
  hu: { name: 'huHU', subpath: 'hu' },
  es: { name: 'esES', subpath: 'es' },
  fr: { name: 'frFR', subpath: 'fr' },
  de: { name: 'deDE', subpath: 'de' },
  pt: { name: 'ptPT', subpath: 'pt' },
};

function attribute(control: Control, raw: string): string {
  const value = parseValue(control, raw);
  if (value === undefined) return '';
  if (value === true) return control.prop.name;
  if (typeof value === 'string') return `${control.prop.name}="${value}"`;
  return `${control.prop.name}={${JSON.stringify(value)}}`;
}

export interface CodeInput {
  readonly controls: readonly Control[];
  readonly changed: Readonly<Record<string, string>>;
  /** The language the Setup group chose; `en` needs no import, since it is the default. */
  readonly locale: string;
  /** What the Setup group is showing, for the comment above the items. */
  readonly dataset: string;
}

export function generate({ controls, changed, locale, dataset }: CodeInput): string {
  const pack = PACKS[locale] ?? PACKS['en'];
  const attributes = controls
    .filter((control) => changed[control.prop.name] !== undefined)
    .map((control) => attribute(control, changed[control.prop.name] as string))
    .filter((text) => text !== '');

  const imports = [
    `import { Scheduler } from '${PACKAGE}';`,
    ...(locale === 'en'
      ? []
      : [`import { ${pack?.name ?? 'enUS'} } from '${PACKAGE}/locales/${pack?.subpath ?? 'en'}';`]),
    `import '${PACKAGE}/styles.css';`,
  ];

  const lines = [
    `items={items}`,
    ...(locale === 'en' ? [] : [`localization={${pack?.name ?? 'enUS'}}`]),
    ...attributes,
  ];

  const element =
    lines.length === 1
      ? `    <Scheduler ${lines[0] as string} />`
      : ['    <Scheduler', ...lines.map((line) => `      ${line}`), '    />'].join('\n');

  return [
    ...imports,
    '',
    `// ${dataset}`,
    'export function Example({ items }) {',
    '  return (',
    element,
    '  );',
    '}',
  ].join('\n');
}
