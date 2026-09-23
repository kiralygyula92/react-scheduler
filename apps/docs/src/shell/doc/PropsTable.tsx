// SPDX-License-Identifier: MIT
// Props tables are generated from the API data (`src/content/api/`, docs pack 05 §4); no page writes
// one by hand (C6). Descriptions are translated in `locales/{lng}/api.json`, keyed by symbol and
// member; a missing entry stays visible so `check-i18n` can fail on it. Rows keep the order of the
// source, so related props stay together, and each row is addressable as `#prop-{name}`.
import { useEffect, useState } from 'react';
import { useT } from '~/i18n/useT';

export interface ApiProp {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly default?: string;
  readonly deprecated?: string | null;
}

export interface ApiSymbol {
  readonly name: string;
  readonly props?: readonly ApiProp[];
}

/** Longer than this, a type is folded away so it cannot push the other columns out of view. */
const LONG_TYPE = 48;

const modules = import.meta.glob('/src/content/api/*.json') as Readonly<
  Record<string, () => Promise<{ default: ApiSymbol }>>
>;

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

export function PropsTable({ symbol }: { symbol: string }): React.ReactElement | null {
  const t = useT('common');
  const api = useT('api');
  const [data, setData] = useState<ApiSymbol | null>(null);

  useEffect(() => {
    const load = modules[`/src/content/api/${symbol}.json`];
    if (load === undefined) return;
    let cancelled = false;
    void load().then((module) => {
      if (!cancelled) setData(module.default);
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const props = data?.props ?? [];
  if (props.length === 0) return null;

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th scope="col">{api('table.prop')}</th>
            <th scope="col">{api('table.type')}</th>
            <th scope="col">{api('table.default')}</th>
            <th scope="col">{api('table.description')}</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
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
              <td>{prop.default === undefined ? '' : <code>{prop.default}</code>}</td>
              <td>
                {api(`${symbol}.props.${prop.name}`)}
                {prop.deprecated != null && <> {api(`${symbol}.props.${prop.name}.deprecated`)}</>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
