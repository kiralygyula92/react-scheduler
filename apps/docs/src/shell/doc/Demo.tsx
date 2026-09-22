// SPDX-License-Identifier: MIT
// The demo frame (docs pack 04 §1): a labelled region holding the live component, a bar with
// "Show code" and "Reset", and the source of the demo exactly as it is on disk (imported `?raw`,
// checked by C13). Remounting on reset is what "Reset" means — the demo owns its own state.
import { useId, useState } from 'react';
import { useT } from '~/i18n/useT';
import { Code } from './Code';

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
  const [generation, setGeneration] = useState(0);

  return (
    <section className="ds-demo" aria-labelledby={labelId}>
      <h3 id={labelId}>{page(titleKey)}</h3>
      <div className="ds-demo__stage" style={height === undefined ? undefined : { minHeight: height }}>
        <div key={generation}>{component}</div>
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
      <div className="ds-demo__source" id={`${id}-source`} hidden={!shown}>
        <Code code={source} lang="tsx" />
      </div>
    </section>
  );
}
