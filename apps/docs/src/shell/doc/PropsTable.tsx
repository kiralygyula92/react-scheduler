// SPDX-License-Identifier: MIT
// Props tables are generated from the API data (`src/content/api/`, docs pack 05 §4); no page writes
// one by hand (C6). The rows arrive as data, statically imported by the page, so the table is in the
// prerendered HTML. Descriptions are translated in `locales/{lng}/api.json`, keyed by symbol and
// member; a missing entry stays visible so `check-i18n` can fail on it. Rows keep the order of the
// source, so related props stay together, and each row is addressable as `#prop-{name}`.
import { useState } from 'react';
import { useT } from '~/i18n/useT';
import { Inline } from './Inline';

export interface ApiProp {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly default?: string;
  readonly deprecated?: string | null;
  /** Where the description lives in `api.json`: the type that declares the member (05 §2.1). */
  readonly descriptionKey: string;
}

/** Longer than this, a type is folded away so it cannot push the other columns out of view. */
const LONG_TYPE = 48;

/** `` `start` plus `defaultDuration` `` → `start plus defaultDuration`: the cell is already code. */
function plain(text: string): string {
  return text.replaceAll('`', '');
}

function TypeCell({ type }: { type: string }): React.ReactElement {
  const t = useT('common');
  const [shown, setShown] = useState(false);
  if (type.length <= LONG_TYPE) return <code>{type}</code>;
  return shown ? (
    <>
      <code>{type}</code>{' '}
      <button
        type="button"
        className="ds-button"
        onClick={() => {
          setShown(false);
        }}
      >
        {t('code.collapse')}
      </button>
    </>
  ) : (
    <button
      type="button"
      className="ds-button"
      onClick={() => {
        setShown(true);
      }}
    >
      {t('code.expand')}
    </button>
  );
}

export function PropsTable({
  members,
  nameHeader,
}: {
  members: readonly ApiProp[];
  /** `Prop` for a component, `Parameter` for a hook or a function; the default is `Prop`. */
  nameHeader?: string;
}): React.ReactElement | null {
  const t = useT('common');
  const api = useT('api');
  if (members.length === 0) return null;

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th scope="col">{nameHeader ?? api('table.prop')}</th>
            <th scope="col">{api('table.type')}</th>
            <th scope="col">{api('table.default')}</th>
            <th scope="col">{api('table.description')}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((prop) => (
            <tr key={prop.name} id={`prop-${prop.name}`}>
              <th scope="row">
                {prop.deprecated == null ? (
                  <code>{prop.name}</code>
                ) : (
                  <del>
                    <code>{prop.name}</code>
                  </del>
                )}
                {prop.required === true && <span className="ds-badge">{t('shell.required')}</span>}
                {prop.deprecated != null && (
                  <span className="ds-badge" data-kind="deprecated">
                    {t('badge.deprecated')}
                  </span>
                )}
              </th>
              <td>
                <TypeCell type={prop.type} />
              </td>
              <td>{prop.default === undefined ? '' : <code>{plain(prop.default)}</code>}</td>
              <td>
                <Inline text={api(prop.descriptionKey)} />
                {prop.deprecated != null && <> {prop.deprecated}</>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
