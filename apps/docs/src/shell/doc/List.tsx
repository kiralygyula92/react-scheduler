// SPDX-License-Identifier: MIT
// A list whose items come from an array key in the page's locale file. Each item may carry the
// same inline markup a paragraph may.
import { Trans } from '~/i18n/Trans';
import { useT } from '~/i18n/useT';

export function List({ k, ns, ordered = false }: { k: string; ns: string; ordered?: boolean }): React.ReactElement {
  const t = useT(ns);
  const items = t.list(k);
  const entries = items.map((_, index) => `${k}.${String(index)}`);
  return ordered ? (
    <ol>
      {entries.map((key) => (
        <li key={key}>
          <Trans k={key} ns={ns} />
        </li>
      ))}
    </ol>
  ) : (
    <ul>
      {entries.map((key) => (
        <li key={key}>
          <Trans k={key} ns={ns} />
        </li>
      ))}
    </ul>
  );
}
