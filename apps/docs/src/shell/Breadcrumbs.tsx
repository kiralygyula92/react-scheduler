// SPDX-License-Identifier: MIT
// Breadcrumbs (docs pack 02 §6.5): `{Plugin} › {Section}` — and the group as well on a capability
// page. Never underlined (O7). Every crumb but the last is a link; the page itself is the `h1`.
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
    <nav className="ds-breadcrumbs" aria-label={common('shell.breadcrumbLabel')}>
      <ol>
        <li>
          <Link to={localePath('/')}>{site.displayName}</Link>
        </li>
        {crumbs.map((crumb, index) =>
          index < crumbs.length - 1 && crumb.path !== undefined ? (
            <li key={crumb.labelKey}>
              <Link to={localePath(crumb.path)}>{label(crumb.labelKey)}</Link>
            </li>
          ) : (
            <li key={crumb.labelKey}>{label(crumb.labelKey)}</li>
          ),
        )}
      </ol>
    </nav>
  );
}
