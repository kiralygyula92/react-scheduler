// SPDX-License-Identifier: MIT
// Sidebar (docs pack 02 §6.3, 11 §4): section headers are buttons that toggle (O4), items are
// indented links (O5), the section holding the current page starts open, and the rest keep whatever
// the reader left them at for the session. Labels resolve from `common.json` first, then from the
// plugin's own `nav.json` namespace.
import { Fragment, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { useSessionState } from './hooks';
import { isGroup, type NavItem, useNav } from './nav';

function useLabel(): (key: string) => string {
  const common = useT('common');
  const nav = useT('nav');
  return (key: string) => (common.has(key) ? common(key) : nav(key.replace(/^nav\./, '')));
}

function NavLink({ item, active, label }: { item: NavItem; active: boolean; label: string }): React.ReactElement {
  const t = useT('common');
  const { localePath } = useNav();
  return (
    <li>
      <Link className="ds-nav__link" to={localePath(item.path)} aria-current={active ? 'page' : undefined}>
        {label}
        {item.badge !== undefined && (
          <span className="ds-badge" data-kind={item.badge}>
            {t(`badge.${item.badge}`)}
          </span>
        )}
      </Link>
    </li>
  );
}

export function Sidebar(): React.ReactElement {
  const t = useT('common');
  const label = useLabel();
  const { sections, activeSectionId, isActive } = useNav();
  const [open, setOpen] = useSessionState<Record<string, boolean>>('ds:sidebar', {});
  const isOpen = (id: string): boolean => open[id] ?? id === activeSectionId;

  // The active link is brought into view once, on the first render of a full page load (O22). The
  // scroll container is moved directly rather than with `scrollIntoView`, which also moves the
  // browser's sequential focus starting point — the first Tab would then land in the middle of the
  // sidebar instead of on the skip link.
  const nav = useRef<HTMLElement>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current) return;
    scrolled.current = true;
    const link = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const container = nav.current?.closest<HTMLElement>('.ds-sidebar, .ds-drawer');
    if (link === null || link === undefined || container === null || container === undefined) return;
    const middle = link.offsetTop - container.clientHeight / 2;
    if (middle > 0) container.scrollTop = middle;
  }, []);

  return (
    <nav ref={nav} aria-label={t('shell.sidebarLabel')}>
      <ul className="ds-nav">
        {sections.map((section) => (
          <li key={section.id} className="ds-nav__section" data-open={isOpen(section.id) || undefined}>
            <button
              type="button"
              className="ds-nav__header"
              aria-expanded={isOpen(section.id)}
              aria-controls={`ds-nav-${section.id}`}
              onClick={() => {
                setOpen({ ...open, [section.id]: !isOpen(section.id) });
              }}
            >
              {label(section.labelKey)}
            </button>
            <ul id={`ds-nav-${section.id}`} className="ds-nav__items">
              {section.items.map((entry) =>
                isGroup(entry) ? (
                  <Fragment key={entry.labelKey}>
                    {/* `11/components.md` writes this as `role="presentation"`, which takes the
                        item out of the list and makes axe's `list` rule fail on the whole
                        sidebar — a serious violation, which 07 §1 does not allow. The element is
                        otherwise unchanged (EXCEPTIONS.md #8). */}
                    <li className="ds-nav__group">{label(entry.labelKey)}</li>
                    {entry.items.map((item) => (
                      <NavLink key={item.id} item={item} active={isActive(item)} label={label(item.labelKey)} />
                    ))}
                  </Fragment>
                ) : (
                  <NavLink key={entry.id} item={entry} active={isActive(entry)} label={label(entry.labelKey)} />
                ),
              )}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
