// SPDX-License-Identifier: MIT
// Breadcrumbs (docs pack 02 §6.5): `{Plugin} › {Section}` — and the group as well on a capability
// page. Never underlined (O7); the last crumb is the page itself and is not a link.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { breadcrumbsFor, site, useNav } from './nav';

export function Breadcrumbs(): React.ReactElement | null {
  const common = useT('common');
  const nav = useT('nav');
  const { rest, localePath } = useNav();
  const label = (key: string): string => (common.has(key) ? common(key) : nav(key.replace(/^nav\./, '')));
  const crumbs = breadcrumbsFor(rest);
  if (crumbs.length === 0) return null;

  return (
    <nav className="ds-breadcrumbs" aria-label={common('shell.sidebarLabel')}>
      <ol>
        <li>
          <Link to={localePath('/')}>{site.displayName}</Link>
        </li>
        {crumbs.slice(0, -1).map((crumb) => (
          <li key={crumb.labelKey}>{label(crumb.labelKey)}</li>
        ))}
        <li aria-current="page">{label(crumbs[crumbs.length - 1]?.labelKey ?? '')}</li>
      </ol>
    </nav>
  );
}
