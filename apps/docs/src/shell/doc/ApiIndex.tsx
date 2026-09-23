// SPDX-License-Identifier: MIT
// The API index (docs pack 03 §3.10, T10): one table per kind — components, hooks, functions and
// constants, types — then the design tokens. Every row is a link to the page that documents the
// symbol and the one line `api.json` holds for it. The data is generated (`content/api/`), so the
// index cannot list a symbol the package no longer exports.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import reference from '~/content/api/reference.json';
import { useNav } from '../nav';
import { Inline } from './Inline';
import { Section } from './Section';

interface Entry {
  readonly name: string;
  readonly kind: string;
  readonly descriptionKey: string;
  /** Locale-relative, with the anchor of the type on a grouped page: `/api/types-model/#item-of`. */
  readonly path: string;
}

function Rows({ entries, ns }: { entries: readonly Entry[]; ns: string }): React.ReactElement {
  const api = useT('api');
  const { localePath } = useNav();
  return (
    <div className="ds-table-wrap" tabIndex={0}>
      <table className="ds-table">
        <thead>
          <tr>
            <th scope="col">{api('table.name')}</th>
            <th scope="col">{api('table.description')}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const [path, anchor] = entry.path.split('#');
            return (
              <tr key={`${ns}-${entry.name}`}>
                <th scope="row">
                  <Link to={`${localePath(path ?? '/')}${anchor === undefined ? '' : `#${anchor}`}`}>
                    <code>{entry.name}</code>
                  </Link>
                </th>
                <td>
                  <Inline text={api(entry.descriptionKey)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ApiIndex({ ns }: { ns: string }): React.ReactElement {
  const api = useT('api');
  const symbols = reference.symbols as readonly Entry[];
  const of = (...kinds: readonly string[]): readonly Entry[] => symbols.filter((entry) => kinds.includes(entry.kind));

  return (
    <>
      <Section id="components" ns={ns} titleKey="sections.components">
        <Rows entries={of('component')} ns="components" />
      </Section>
      <Section id="hooks" ns={ns} titleKey="sections.hooks">
        <Rows entries={of('hook')} ns="hooks" />
      </Section>
      <Section id="functions" ns={ns} titleKey="sections.functions">
        <Rows entries={of('function', 'constant')} ns="functions" />
      </Section>
      <Section id="types" ns={ns} titleKey="sections.types">
        <Rows entries={of('type')} ns="types" />
      </Section>
      <Section id="css-variables" ns={ns} titleKey="sections.css-variables">
        <div className="ds-table-wrap" tabIndex={0}>
          <table className="ds-table">
            <thead>
              <tr>
                <th scope="col">{api('table.variable')}</th>
                <th scope="col">{api('table.light')}</th>
                <th scope="col">{api('table.dark')}</th>
              </tr>
            </thead>
            <tbody>
              {reference.cssVars.map((variable) => (
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
    </>
  );
}
