// SPDX-License-Identifier: MIT
// Light/dark switch (docs pack 02 §8, 11 §7). The inline bootstrap in <head> has already set
// `data-theme` before the first paint; this button flips it, stores the choice and keeps
// `meta[name=theme-color]` in step. The attribute on <html> is the source of truth — the button
// subscribes to it rather than keeping a second copy in state.
import { useEffect, useSyncExternalStore } from 'react';
import { useT } from '~/i18n/useT';
import { MoonIcon, SunIcon } from './icons';

type Theme = 'light' | 'dark';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    observer.disconnect();
  };
}

function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** The prerendered document carries the light theme; the bootstrap corrects it before first paint. */
function serverTheme(): Theme {
  return 'light';
}

function applyThemeColor(): void {
  const background = getComputedStyle(document.documentElement).getPropertyValue('--ds-bg').trim();
  if (background === '') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta === null) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
  }
  meta.content = background;
}

export function ThemeToggle(): React.ReactElement {
  const t = useT('common');
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  useEffect(() => {
    applyThemeColor();
  }, [theme]);

  const toggle = (): void => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ds:theme', next);
    } catch {
      // Storage can be blocked; the theme still applies for this page view.
    }
  };

  const label = t(theme === 'dark' ? 'shell.themeToLight' : 'shell.themeToDark');
  return (
    <button type="button" className="ds-icon-btn" aria-label={label} onClick={toggle}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
