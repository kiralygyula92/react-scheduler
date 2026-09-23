// SPDX-License-Identifier: MIT
// The demo frame (docs pack 04 §1): a labelled region holding the live component, a toolbar with
// "Show code", "Copy" and "Reset", and the demo's own source exactly as it is on disk (imported
// `?raw`, checked by C13). The source is static — there is no editor anywhere on the site (O25).
import { Component, type ReactNode, useEffect, useId, useState } from 'react';
import { useT } from '~/i18n/useT';
import { Code } from './Code';

/** A failing demo shows a themed message; it never takes the page down (04 §1). */
class DemoBoundary extends Component<{ message: string; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    return this.state.failed ? <p className="ds-lead">{this.props.message}</p> : this.props.children;
  }
}

export function Demo({
  id,
  ns,
  titleKey,
  component,
  source,
  height,
}: {
  id: string;
  ns: string;
  titleKey: string;
  component: React.ReactNode;
  source: string;
  height?: number;
}): React.ReactElement {
  const t = useT('common');
  const page = useT(ns);
  const labelId = useId();
  const [shown, setShown] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generation, setGeneration] = useState(0);

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
    void navigator.clipboard.writeText(source).then(
      () => {
        setCopied(true);
      },
      () => {
        // Clipboard access can be denied; the source is still selectable once shown.
      },
    );
  };

  return (
    <section className="ds-demo" aria-labelledby={labelId}>
      <h3 id={labelId}>{page(titleKey)}</h3>
      <div className="ds-demo__stage" style={height === undefined ? undefined : { minHeight: height }}>
        <DemoBoundary message={t('demo.error')}>
          {/* Remounting is what "Reset" means: the demo owns its own state. */}
          <div key={generation}>{component}</div>
        </DemoBoundary>
      </div>

      <div className="ds-demo__bar">
        <button
          type="button"
          className="ds-button"
          aria-expanded={shown}
          aria-controls={`${id}-source`}
          onClick={() => {
            setShown((was) => !was);
          }}
        >
          {t(shown ? 'demo.hideCode' : 'demo.showCode')}
        </button>
        <button type="button" className="ds-button" onClick={copy}>
          {t(copied ? 'code.copied' : 'code.copy')}
        </button>
        <button
          type="button"
          className="ds-button"
          onClick={() => {
            setGeneration((value) => value + 1);
          }}
        >
          {t('demo.reset')}
        </button>
      </div>

      {/* The copy result is announced, because the button label changing is not announced on its own. */}
      <p aria-live="polite" hidden={!copied}>
        {t('code.copied')}
      </p>

      <div className="ds-demo__source" id={`${id}-source`} hidden={!shown} data-expanded={expanded ? '' : undefined}>
        <Code lang="tsx">{source}</Code>
        <div className="ds-demo__bar">
          <button
            type="button"
            className="ds-button"
            aria-expanded={expanded}
            aria-controls={`${id}-source`}
            onClick={() => {
              setExpanded((was) => !was);
            }}
          >
            {t(expanded ? 'code.collapse' : 'code.expand')}
          </button>
        </div>
      </div>
    </section>
  );
}
