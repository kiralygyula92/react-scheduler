// SPDX-License-Identifier: MIT
// The layout frame (docs pack 11 §2, structure normative). `ds-main` carries the content padding
// and nothing inside it adds a max-width (O1).
import { useCallback, useState } from 'react';
import { useT } from '~/i18n/useT';
import { Footer } from './Footer';
import { MobileDrawer } from './MobileDrawer';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Toc, TocProvider } from './Toc';

export function AppShell({
  layout = 'default',
  children,
}: {
  layout?: 'default' | 'wide';
  children: React.ReactNode;
}): React.ReactElement {
  const t = useT('common');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <TocProvider>
      <div className="ds-app">
        <a className="ds-skip" href="#main">
          {t('shell.skipToContent')}
        </a>
        <Navbar
          drawerOpen={drawerOpen}
          onToggleDrawer={() => {
            setDrawerOpen((open) => !open);
          }}
        />
        <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
        <div className="ds-body" data-layout={layout}>
          <aside className="ds-sidebar" aria-label={t('shell.sidebarLabel')}>
            <Sidebar />
          </aside>
          <main id="main" className="ds-main ds-content" tabIndex={-1}>
            {children}
          </main>
          {layout === 'default' && <Toc />}
        </div>
        <Footer />
      </div>
    </TocProvider>
  );
}
