// SPDX-License-Identifier: MIT
// Navbar (docs pack 02 §6.1/§6.2, 11 §3). The order on the right is fixed: search, GitHub, theme,
// language (O21). Nothing else goes in here.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { GithubIcon, MenuIcon } from './icons';
import { LanguageMenu } from './LanguageMenu';
import { site, useNav } from './nav';
import { SearchButton } from './SearchButton';
import { ThemeToggle } from './ThemeToggle';
import { VersionMenu } from './VersionMenu';

export function Navbar({
  drawerOpen,
  onToggleDrawer,
}: {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}): React.ReactElement {
  const t = useT('common');
  const { localePath } = useNav();
  return (
    <header className="ds-navbar">
      <div className="ds-navbar__start">
        <button
          type="button"
          className="ds-icon-btn ds-hamburger"
          aria-label={t(drawerOpen ? 'shell.closeMenu' : 'shell.openMenu')}
          aria-expanded={drawerOpen}
          aria-controls="ds-drawer"
          onClick={onToggleDrawer}
        >
          <MenuIcon />
        </button>
        <Link className="ds-wordmark" to={localePath('/')}>
          {site.displayName}
        </Link>
        <VersionMenu />
      </div>
      <div className="ds-navbar__end">
        <SearchButton />
        <a className="ds-icon-btn" href={site.repoUrl} aria-label={t('shell.github')}>
          <GithubIcon />
        </a>
        <ThemeToggle />
        <LanguageMenu />
      </div>
    </header>
  );
}
