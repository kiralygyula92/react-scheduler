// SPDX-License-Identifier: MIT
// The navbar's search trigger and the dialog it owns (docs pack 02 §6.1, O14): `/`, `Ctrl+K` and
// `⌘K` all open it, and `/` is ignored while the reader is typing somewhere else.
import { useCallback, useEffect, useState } from 'react';
import { useT } from '~/i18n/useT';
import { SearchIcon } from './icons';
import { SearchDialog } from './SearchDialog';

/** The shortcut hint on the button; a glyph, not prose. */
const SLASH = '/';

function typingSomewhereElse(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function SearchButton(): React.ReactElement {
  const t = useT('common');
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const shortcut = event.key === 'k' && (event.metaKey || event.ctrlKey);
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !typingSomewhereElse(event.target);
      if (!shortcut && !slash) return;
      event.preventDefault();
      setOpen(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="ds-search-btn"
        aria-label={t('search.button')}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
        }}
      >
        <SearchIcon />
        <span className="ds-search-btn__label">{t('search.button')}</span>
        <kbd>{SLASH}</kbd>
      </button>
      <SearchDialog open={open} onClose={close} />
    </>
  );
}
