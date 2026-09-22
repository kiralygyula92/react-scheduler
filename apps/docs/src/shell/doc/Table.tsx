// SPDX-License-Identifier: MIT
// A content table: header labels from their own keys, rows from an array-of-arrays key, every cell
// a message so translations stay in the locale files (docs pack 02 §6.8).
import { Trans } from '~/i18n/Trans';
import { useT } from '~/i18n/useT';

export function Table({ k, ns, headKeys }: { k: string; ns: string; headKeys: readonly string[] }): React.ReactElement {
  const t = useT(ns);
  const rows = t.list(k) as unknown as readonly (readonly string[])[];

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            {headKeys.map((headKey) => (
              <th key={headKey} scope="col">
                {t(headKey)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${k}.${String(rowIndex)}`}>
              {row.map((_, cellIndex) => (
                <td key={`${k}.${String(rowIndex)}.${String(cellIndex)}`}>
                  <Trans k={`${k}.${String(rowIndex)}.${String(cellIndex)}`} ns={ns} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
