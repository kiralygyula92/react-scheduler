// SPDX-License-Identifier: MIT
// Props tables are generated from the API data (`src/content/api/`, docs pack 05 §6); no page
// writes one by hand (C6). Descriptions are translated in `locales/{lng}/api.json`, keyed by
// `{symbol}.{prop}`; a missing entry stays visible so `check-i18n` can fail on it.
import { useEffect, useState } from 'react';
import { useT } from '~/i18n/useT';

export interface ApiProp {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly defaultValue?: string;
}

export interface ApiSymbol {
  readonly name: string;
  readonly props?: readonly ApiProp[];
}

const modules = import.meta.glob('/src/content/api/*.json') as Readonly<
  Record<string, () => Promise<{ default: ApiSymbol }>>
>;

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
            <tr key={prop.name}>
              <th scope="row">
                <code>{prop.name}</code>
                {prop.required === true && <span className="ds-badge">{t('shell.required')}</span>}
              </th>
              <td>
                <code>{prop.type}</code>
              </td>
              <td>{prop.defaultValue === undefined ? '' : <code>{prop.defaultValue}</code>}</td>
              <td>{api(`${symbol}.${prop.name}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
