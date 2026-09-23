// SPDX-License-Identifier: MIT
// The All features page (T5, docs pack 03 §3.5): one heading per sidebar group, each a card grid of
// that group's pages. It is generated from `nav.json` and the pages' own `meta.description`, so a
// capability that is added, renamed or moved reaches this page without anyone editing it.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { isGroup, type NavGroup, type NavItem, sections, useNav } from '../nav';
import { Section } from './Section';

/** `nav.groups.coreFeatures` → `core-features`, the id the table of contents links to. */
function anchorOf(labelKey: string): string {
  return (labelKey.split('.').pop() ?? '').replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function Cards({ items }: { items: readonly NavItem[] }): React.ReactElement {
  const common = useT('common');
  const nav = useT('nav');
  const { localePath } = useNav();
  const summaries = useT('summaries');
  return (
    <div className="ds-cards">
      {items.map((item) => (
        <Link key={item.id} className="ds-card" to={localePath(item.path)}>
          <span className="ds-card__title">
            {common.has(item.labelKey) ? common(item.labelKey) : nav(item.labelKey.replace(/^nav\./, ''))}
          </span>
          <span className="ds-card__text">{summaries(item.page)}</span>
        </Link>
      ))}
    </div>
  );
}

/**
 * The cards of one sidebar section, for the index pages that open it (T7 and its siblings): every
 * page of the section in the sidebar's own order, minus the index itself.
 */
export function PageCards({ section, exclude }: { section: string; exclude?: string }): React.ReactElement {
  const items = (sections.find((entry) => entry.id === section)?.items ?? []).flatMap((entry) =>
    isGroup(entry) ? entry.items : [entry],
  );
  return <Cards items={items.filter((item) => item.page !== exclude)} />;
}

export function FeatureGrid({ ns }: { ns: string }): React.ReactElement {
  const common = useT('common');
  const groups = (sections.find((section) => section.id === 'features')?.items ?? []).filter(
    (entry): entry is NavGroup => isGroup(entry),
  );

  return (
    <>
      {groups.map((group) => (
        <Section key={group.labelKey} id={anchorOf(group.labelKey)} ns={ns} titleKey="" title={common(group.labelKey)}>
          <Cards items={group.items} />
        </Section>
      ))}
    </>
  );
}
