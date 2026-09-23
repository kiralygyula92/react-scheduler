// SPDX-License-Identifier: MIT
// Search dialog (docs pack 02 §6.7, 11 §10). The index is fetched on first open, results are a
// listbox inside a modal dialog, and the keyboard contract is ↑/↓, Enter, Esc.
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useI18n } from '~/i18n/I18nProvider';
import { useT } from '~/i18n/useT';
import { type IndexRecord, indexUrl, marks, search, type SearchResult } from '~/lib/search';
import { useBodyScrollLock, useEscape, useFocusTrap } from './hooks';
import { CloseIcon, SearchIcon } from './icons';
import { site } from './nav';

/** Key glyphs, not prose: the same symbols in every locale (docs pack 02 §6.7). */
const KEY = { up: '↑', down: '↓', enter: '↵', escape: 'Esc' };

function Marked({ text, query }: { text: string; query: string }): React.ReactElement {
  return (
    <>
      {marks(text, query).map((run, index) => (
        <Fragment key={`${String(index)}-${run.text}`}>{run.match ? <mark>{run.text}</mark> : run.text}</Fragment>
      ))}
    </>
  );
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactElement | null {
  const t = useT('common');
  const { locale } = useI18n();
  const navigate = useNavigate();
  const titleId = useId();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const panel = useFocusTrap<HTMLDivElement>(open);
  const [records, setRecords] = useState<readonly IndexRecord[] | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEscape(open, onClose);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || records !== null) return;
    let cancelled = false;
    void fetch(indexUrl(locale, site.pluginId))
      .then((response) => (response.ok ? (response.json() as Promise<IndexRecord[]>) : []))
      .then((loaded) => {
        if (!cancelled) setRecords(loaded);
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, records, locale]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  if (!open) return null;

  const results: readonly SearchResult[] = records === null ? [] : search(query, records);
  const selected = results[Math.min(active, results.length - 1)];

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (results.length === 0 ? 0 : (index + 1) % results.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (results.length === 0 ? 0 : (index - 1 + results.length) % results.length));
    } else if (event.key === 'Enter' && selected !== undefined) {
      event.preventDefault();
      onClose();
      void navigate(selected.url);
    }
  };

  return (
    <>
      <div className="ds-dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="ds-search" ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ds-search__head">
          <h2 className="ds-search__title" id={titleId}>
            {t('search.title')}
          </h2>
          <button type="button" className="ds-icon-btn" aria-label={t('shell.close')} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="ds-search__field">
          <SearchIcon />
          <input
            ref={input}
            className="ds-search__input"
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            placeholder={t('search.placeholder')}
            aria-label={t('search.title')}
            aria-controls={listId}
            aria-activedescendant={selected === undefined ? undefined : `${listId}-${selected.record.id}`}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
        </div>

        <ul className="ds-search__results" id={listId} role="listbox" aria-label={t('search.title')}>
          {results.map((result, index) => (
            <li key={result.record.id} role="none">
              <a
                id={`${listId}-${result.record.id}`}
                className="ds-search__result"
                role="option"
                aria-selected={index === active}
                href={result.url}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onClick={onClose}
              >
                <span className="ds-search__result-title">
                  <Marked text={result.heading ?? result.record.title} query={query} />
                </span>
                <span className="ds-search__result-crumb">{result.record.crumb}</span>
                <span className="ds-search__result-snippet">
                  <Marked text={result.snippet} query={query} />
                </span>
              </a>
            </li>
          ))}
        </ul>

        {results.length === 0 && (
          <p className="ds-search__empty">{query === '' ? t('search.empty') : t('search.noResults', { query })}</p>
        )}

        <div className="ds-search__foot">
          <span>
            <kbd>{KEY.up}</kbd> <kbd>{KEY.down}</kbd> {t('search.hintNavigate')}
          </span>
          <span>
            <kbd>{KEY.enter}</kbd> {t('search.hintOpen')}
          </span>
          <span>
            <kbd>{KEY.escape}</kbd> {t('search.hintClose')}
          </span>
        </div>
      </div>
    </>
  );
}
