// SPDX-License-Identifier: MIT
// A code block (docs pack 02 §6.8, 04 §2): optional title, per-line highlighting, a copy button
// that appears on hover, on focus and always on touch, and the package-manager tab group. Code is
// never translated, so it is the one place where the text is not a locale key. Colouring comes from
// the site's own highlighter and happens while the page is prerendered.
import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useT } from '~/i18n/useT';
import { highlight, type Language } from '~/lib/highlight';
import { CheckIcon, CopyIcon } from '../icons';

export type CodeLanguage = Language;

/** The four package managers, in the order 04 §2 lists them. */
const MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
type Manager = (typeof MANAGERS)[number];

const STORAGE_KEY = 'ds:pm';
const listeners = new Set<() => void>();
let manager: Manager = 'npm';

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Read once from storage, then kept in module state so every tab group on the page agrees. */
function readManager(): Manager {
  return manager;
}

function serverManager(): Manager {
  return 'npm';
}

function chooseManager(next: Manager): void {
  manager = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be blocked; the choice still applies to this page view.
  }
  for (const listener of listeners) listener();
}

function installCommand(pm: Manager, specifier: string): string {
  return pm === 'npm' ? `npm install ${specifier}` : `${pm} add ${specifier}`;
}

/** `"3-5,9"` → `[3, 4, 5, 9]`; a list of numbers is passed through. */
export function highlightedLines(spec: string | readonly number[] | undefined): readonly number[] {
  if (spec === undefined) return [];
  if (typeof spec !== 'string') return spec;
  const lines: number[] = [];
  for (const part of spec.split(',')) {
    const [from, to] = part.split('-').map((value) => Number.parseInt(value.trim(), 10));
    if (from === undefined || Number.isNaN(from)) continue;
    const last = to === undefined || Number.isNaN(to) ? from : to;
    for (let line = from; line <= last; line += 1) lines.push(line);
  }
  return lines;
}

export interface CodeProps {
  /** The code itself, or — with `tabs="pm"` — the package specifier to install. */
  readonly children: string;
  readonly lang: CodeLanguage;
  /** Shown above the code, usually the file name. */
  readonly title?: string;
  /** 1-based lines to mark, as `"3-5,9"` or a list. */
  readonly highlight?: string | readonly number[];
  /** `"pm"` turns the block into the npm · pnpm · yarn · bun tab group. */
  readonly tabs?: 'pm';
}

export function Code({ children, lang, title, highlight: marked, tabs }: CodeProps): React.ReactElement {
  const t = useT('common');
  const [copied, setCopied] = useState(false);
  const base = useId();
  const active = useSyncExternalStore(subscribe, readManager, serverManager);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // The stored choice is read after hydration, so the prerendered HTML and the first client render
  // agree on `npm`.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null && (MANAGERS as readonly string[]).includes(stored) && stored !== manager) {
        chooseManager(stored as Manager);
      }
    } catch {
      // As above.
    }
  }, []);

  const code = tabs === 'pm' ? installCommand(active, children.trim()) : children;
  const lines = highlight(code.replace(/\n$/, ''), lang);
  const markedLines = highlightedLines(marked);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [copied]);

  const copy = (): void => {
    void navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
      },
      () => {
        // Clipboard access can be denied; the code is still selectable.
      },
    );
  };

  const onTabKeyDown = (event: React.KeyboardEvent, index: number): void => {
    const last = MANAGERS.length - 1;
    const move = (to: number): void => {
      event.preventDefault();
      chooseManager(MANAGERS[to] as Manager);
      buttons.current[to]?.focus();
    };
    if (event.key === 'ArrowRight') move(index === last ? 0 : index + 1);
    else if (event.key === 'ArrowLeft') move(index === 0 ? last : index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(last);
  };

  const block = (
    <>
      {title !== undefined && <div className="ds-code__title">{title}</div>}
      {/* The language is repeated on `pre` so the Markdown twins can fence the block with it. */}
      <pre data-lang={lang}>
        <code>
          {lines.map((tokens, index) => (
            <span
              key={`${String(index)}-${tokens.map((token) => token.text).join('')}`}
              className="ds-code__line"
              data-highlight={markedLines.includes(index + 1) ? '' : undefined}
            >
              {tokens.map((token, position) => (
                <Fragment key={`${String(position)}-${token.text}`}>
                  {token.kind === undefined ? token.text : <span className={`ds-t-${token.kind}`}>{token.text}</span>}
                </Fragment>
              ))}
              {index < lines.length - 1 ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    </>
  );

  return (
    <div className="ds-code" data-lang={lang}>
      {tabs === 'pm' ? (
        <>
          <div className="ds-tabs__list" role="tablist" aria-label={t('shell.packageManager')}>
            {MANAGERS.map((name, index) => (
              <button
                key={name}
                type="button"
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                className="ds-tabs__tab"
                role="tab"
                id={`${base}-${name}`}
                aria-controls={`${base}-panel`}
                aria-selected={name === active}
                tabIndex={name === active ? 0 : -1}
                onClick={() => {
                  chooseManager(name);
                }}
                onKeyDown={(event) => {
                  onTabKeyDown(event, index);
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${active}`}>
            {block}
          </div>
        </>
      ) : (
        block
      )}
      <button
        type="button"
        className="ds-icon-btn ds-code__copy"
        aria-label={t(copied ? 'code.copied' : 'code.copy')}
        onClick={copy}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}
