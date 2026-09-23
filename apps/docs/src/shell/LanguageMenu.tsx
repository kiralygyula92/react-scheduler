// SPDX-License-Identifier: MIT
// Language menu (docs pack 02 §6.1, 11 §8): the seven locales by their native names, each item a
// real link to the same page in that locale, keeping the hash. Nothing redirects automatically —
// a shared link always lands where it points (01 §2).
import { useCallback, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { buildPath, LOCALES, type Locale, parsePath } from '~/i18n/paths';
import { useT } from '~/i18n/useT';
import { useDismissOnOutside, useEscape, useInertBehind } from './hooks';
import { CheckIcon, GlobeIcon } from './icons';
import { site } from './nav';

export function LanguageMenu(): React.ReactElement {
  const t = useT('common');
  const { pathname, hash } = useLocation();
  const { locale, rest } = parsePath(pathname, site.pluginId);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);
  useEscape(open, close);
  useInertBehind(open);
  const container = useDismissOnOutside(open, () => {
    setOpen(false);
  });

  const onItemKeyDown = (event: React.KeyboardEvent, index: number): void => {
    const last = LOCALES.length - 1;
    const move = (to: number): void => {
      event.preventDefault();
      items.current[to]?.focus();
    };
    if (event.key === 'ArrowDown') move(index === last ? 0 : index + 1);
    else if (event.key === 'ArrowUp') move(index === 0 ? last : index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(last);
  };

  const choose = (code: Locale): void => {
    try {
      localStorage.setItem('ds:locale', code);
    } catch {
      // The choice still applies to this navigation.
    }
    setOpen(false);
  };

  return (
    // `.ds-menu` is absolutely positioned but shell.css gives it no anchor, and this menu sits at
    // the right edge, so the two positioning declarations live here (EXCEPTIONS.md #7).
    <div className="ds-menu-anchor" style={{ position: 'relative' }} ref={container}>
      <button
        type="button"
        ref={button}
        className="ds-icon-btn"
        aria-label={t('shell.language')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((was) => !was);
        }}
      >
        <GlobeIcon />
        <span className="ds-icon-btn__code">{locale.toUpperCase()}</span>
      </button>
      {open && (
        <>
          {/* Takes the outside click, and keeps the page from being a half-covered target (EXCEPTIONS.md #14). */}
          <div
            className="ds-menu-catcher"
            aria-hidden="true"
            onClick={() => {
              setOpen(false);
            }}
          />
          <ul className="ds-menu" style={{ right: 0 }} role="menu" aria-label={t('shell.language')}>
            {LOCALES.map((code, index) => (
              <li key={code} role="none">
                <Link
                  role="menuitem"
                  className="ds-menu__item"
                  ref={(node) => {
                    items.current[index] = node;
                  }}
                  to={`${buildPath(code, rest, site.pluginId)}${hash}`}
                  lang={code}
                  hrefLang={code}
                  aria-current={code === locale ? 'true' : undefined}
                  onKeyDown={(event) => {
                    onItemKeyDown(event, index);
                  }}
                  onClick={() => {
                    choose(code);
                  }}
                >
                  {t(`localeNames.${code}`)}
                  {code === locale && <CheckIcon />}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
