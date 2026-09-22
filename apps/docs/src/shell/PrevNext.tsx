// SPDX-License-Identifier: MIT
// The two cards that close every page (docs pack 02 §6.8). Order comes from `nav.json`, so it is
// the same order as the sidebar, the sitemap and `llms.txt`.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { type FlatItem, siblings, useNav } from './nav';

function Card({
  item,
  direction,
  label,
}: {
  item: FlatItem;
  direction: 'prev' | 'next';
  label: string;
}): React.ReactElement {
  const common = useT('common');
  const nav = useT('nav');
  const { localePath } = useNav();
  const title = common.has(item.labelKey) ? common(item.labelKey) : nav(item.labelKey.replace(/^nav\./, ''));
  return (
    <Link to={localePath(item.path)} data-dir={direction === 'next' ? 'next' : undefined} rel={direction}>
      <span className="ds-prevnext__label">{label}</span>
      <span className="ds-prevnext__title">{title}</span>
    </Link>
  );
}

export function PrevNext(): React.ReactElement | null {
  const t = useT('common');
  const { rest } = useNav();
  const { previous, next } = siblings(rest);
  if (previous === undefined && next === undefined) return null;

  // Not a `nav` landmark: the landmarks the shell exposes are fixed (07 §2), and these two links
  // sit inside `main` as part of the page.
  return (
    <div className="ds-prevnext">
      {previous !== undefined && <Card item={previous} direction="prev" label={t('pager.previous')} />}
      {next !== undefined && <Card item={next} direction="next" label={t('pager.next')} />}
    </div>
  );
}
