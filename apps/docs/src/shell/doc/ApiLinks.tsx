// SPDX-License-Identifier: MIT
// The API section of a capability page (docs pack 03 §3.6, C5): the symbols the page documents, each
// linked to its place in the reference with the one line `api.json` holds for it. The list comes from
// the page's `symbols` in `nav.json`, which is also what the reference inverts into "Where it is
// used" — so the two directions cannot disagree.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import reference from '~/content/api/reference.json';
import { useNav } from '../nav';
import { Inline } from './Inline';

export function ApiLinks(): React.ReactElement | null {
  const api = useT('api');
  const { current, localePath } = useNav();
  const symbols = (current?.symbols ?? [])
    .map((name) => reference.symbols.find((entry) => entry.name === name))
    .filter((entry): entry is (typeof reference.symbols)[number] => entry !== undefined);
  if (symbols.length === 0) return null;

  return (
    <ul>
      {symbols.map((symbol) => {
        const [path, anchor] = symbol.path.split('#');
        return (
          <li key={symbol.name}>
            <Link to={`${localePath(path ?? '/')}${anchor === undefined ? '' : `#${anchor}`}`}>
              <code>{symbol.name}</code>
            </Link>
            <p>
              <Inline text={api(symbol.descriptionKey)} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}
