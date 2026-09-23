// SPDX-License-Identifier: MIT
// One exported symbol of the package, rendered from the generated API data (docs pack 05 §4, T11):
// the import line, the pages that use it, its props or parameters, its slots, its CSS variables and
// a link to its source. Nothing here is hand-written per symbol, so a change in the package's
// declarations reaches the site through `pnpm --filter docs api` alone.
//
// The data arrives as a prop, statically imported by the generated page, so the whole table is in
// the prerendered HTML — the search index and a reader without JavaScript see all of it.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { flatItems, site, useNav } from '../nav';
import { Code } from './Code';
import { Page } from './Page';
import { type ApiProp, PropsTable } from './PropsTable';
import { Section } from './Section';

export interface ApiSymbolData {
  readonly name: string;
  readonly kind: string;
  readonly importPath: string;
  readonly descriptionKey: string;
  readonly props?: readonly ApiProp[];
  readonly params?: readonly ApiProp[];
  readonly literals?: readonly string[];
  readonly returns?: string | null;
  readonly slots?: readonly { readonly name: string; readonly propsType: string }[];
  readonly cssVars?: readonly { readonly name: string; readonly light: string; readonly dark: string }[];
  readonly usedBy?: readonly string[];
  readonly sourcePath: string;
}

export function SymbolPage({ data, ns }: { data: ApiSymbolData; ns: string }): React.ReactElement {
  const api = useT('api');
  const nav = useT('nav');
  const common = useT('common');
  const { localePath } = useNav();

  const members = data.props ?? data.params ?? [];
  const isCallable = data.kind === 'hook' || data.kind === 'function';
  const usedBy = (data.usedBy ?? [])
    .map((id) => flatItems.find((item) => item.id === id))
    .filter((item): item is (typeof flatItems)[number] => item !== undefined);
  const label = (key: string): string => (common.has(key) ? common(key) : nav(key.replace(/^nav\./, '')));
  // Built here rather than in the JSX: the import line is code, not a user-visible string.
  const importLine = `import { ${data.name} } from '${data.importPath}';`;

  return (
    <Page ns={ns}>
      <Section id="import" ns="api" titleKey="sections.import">
        <Code lang="ts">{importLine}</Code>
      </Section>

      {usedBy.length > 0 && (
        <Section id="demos" ns="api" titleKey="sections.demos">
          <ul>
            {usedBy.map((item) => (
              <li key={item.id}>
                <Link to={localePath(item.path)}>{label(item.labelKey)}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(data.literals ?? []).length > 0 && (
        <Section id="values" ns="api" titleKey="sections.values">
          <Code lang="ts">{(data.literals ?? []).map((value) => `'${value}'`).join(' | ')}</Code>
        </Section>
      )}

      {members.length > 0 && (
        <Section id="props" ns="api" titleKey={isCallable ? 'sections.parameters' : 'sections.props'}>
          <PropsTable members={members} nameHeader={api(isCallable ? 'table.parameter' : 'table.prop')} />
        </Section>
      )}

      {isCallable && typeof data.returns === 'string' && (
        <Section id="returns" ns="api" titleKey="sections.returns">
          <Code lang="ts">{data.returns}</Code>
        </Section>
      )}

      {(data.slots ?? []).length > 0 && (
        <Section id="slots" ns="api" titleKey="sections.slots">
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th scope="col">{api('table.slot')}</th>
                  <th scope="col">{api('table.propsType')}</th>
                </tr>
              </thead>
              <tbody>
                {(data.slots ?? []).map((slot) => (
                  <tr key={slot.name} id={`slot-${slot.name}`}>
                    <th scope="row">
                      <code>{slot.name}</code>
                    </th>
                    <td>
                      <code className="ds-type">{slot.propsType}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {(data.cssVars ?? []).length > 0 && (
        <Section id="css-variables" ns="api" titleKey="sections.cssVariables">
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th scope="col">{api('table.variable')}</th>
                  <th scope="col">{api('table.light')}</th>
                  <th scope="col">{api('table.dark')}</th>
                </tr>
              </thead>
              <tbody>
                {(data.cssVars ?? []).map((variable) => (
                  <tr key={variable.name} id={`css-${variable.name.replace('--', '')}`}>
                    <th scope="row">
                      <code>{variable.name}</code>
                    </th>
                    <td>
                      <code>{variable.light}</code>
                    </td>
                    <td>
                      <code>{variable.dark}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section id="source" ns="api" titleKey="sections.source">
        <p>
          <a href={`${site.repoUrl}/blob/main/${data.sourcePath}`}>
            <code>{data.sourcePath}</code>
          </a>
        </p>
      </Section>
    </Page>
  );
}
