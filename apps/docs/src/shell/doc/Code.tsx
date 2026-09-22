// SPDX-License-Identifier: MIT
// A code block (docs pack 02 §6.8): optional title, per-line highlighting, and a copy button that
// appears on hover, on focus and always on touch. Code is never translated, so it is the one place
// where the text is not a locale key.
import { useEffect, useState } from 'react';
import { useT } from '~/i18n/useT';
import { CheckIcon, CopyIcon } from '../icons';

export type CodeLanguage = 'tsx' | 'ts' | 'bash' | 'json' | 'css';

export interface CodeProps {
  readonly code: string;
  readonly lang: CodeLanguage;
  /** Shown above the code, usually the file name. */
  readonly title?: string;
  /** 1-based line numbers to mark. */
  readonly highlight?: readonly number[];
}

export function Code({ code, lang, title, highlight }: CodeProps): React.ReactElement {
  const t = useT('common');
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');

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
      <pre>
        <code>
          {lines.map((line, index) => (
            <span
              key={`${String(index)}-${line}`}
              className="ds-code__line"
              data-highlight={highlight?.includes(index + 1) === true ? '' : undefined}
            >
              {line}
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
