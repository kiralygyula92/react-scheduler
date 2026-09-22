// SPDX-License-Identifier: MIT
// The card grid the Overview and the index pages use (docs pack 02 §6.8). Each card is one link,
// so the whole card is the target, and its title and text come from the page's locale file.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { useNav } from '../nav';

export interface Card {
  /** Path inside the locale, as `nav.json` writes it. */
  readonly to: string;
  readonly titleKey: string;
  readonly textKey: string;
}

export function CardGrid({ items, ns }: { items: readonly Card[]; ns: string }): React.ReactElement {
  const t = useT(ns);
  const { localePath } = useNav();
  return (
    <div className="ds-cards">
      {items.map((item) => (
        <Link key={item.to} className="ds-card" to={localePath(item.to)}>
          <span className="ds-card__title">{t(item.titleKey)}</span>
          <span className="ds-card__text">{t(item.textKey)}</span>
        </Link>
      ))}
    </div>
  );
}
