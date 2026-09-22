// SPDX-License-Identifier: MIT
// A code block (docs pack 02 §6.8): optional title, per-line highlighting, and a copy button that
// appears on hover, on focus and always on touch. Code is never translated, so it is the one place
// where the text is not a locale key. Colouring comes from the site's own highlighter.
import { Fragment, useEffect, useState } from 'react';
import { useT } from '~/i18n/useT';
import { highlight, type Language } from '~/lib/highlight';
import { CheckIcon, CopyIcon } from '../icons';

export type CodeLanguage = Language;

export interface CodeProps {
  readonly code: string;
  readonly lang: CodeLanguage;
  /** Shown above the code, usually the file name. */
  readonly title?: string;
  /** 1-based line numbers to mark. */
  readonly highlight?: readonly number[];
}

export function Code({ code, lang, title, highlight: marked }: CodeProps): React.ReactElement {
  const t = useT('common');
  const [copied, setCopied] = useState(false);
  const lines = highlight(code.replace(/\n$/, ''), lang);

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

  return (
    <div className="ds-code" data-lang={lang}>
      {title !== undefined && <div className="ds-code__title">{title}</div>}
      {/* The language is repeated on `pre` so the Markdown twins can fence the block with it. */}
      <pre data-lang={lang}>
        <code>
          {lines.map((tokens, index) => (
            <span
              key={`${String(index)}-${tokens.map((token) => token.text).join('')}`}
              className="ds-code__line"
              data-highlight={marked?.includes(index + 1) === true ? '' : undefined}
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
