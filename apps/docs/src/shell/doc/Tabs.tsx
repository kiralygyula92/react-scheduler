// SPDX-License-Identifier: MIT
// Tabs, used for the package-manager variants of an install command (docs pack 04 §3). Tab names
// are product names, not prose, so they are not translated; the group is labelled from
// `common.json`. Roving focus with ←/→, as the tabs pattern requires.
import { useId, useRef, useState } from 'react';
import { useT } from '~/i18n/useT';

export interface Tab {
  readonly id: string;
  readonly label: string;
  readonly content: React.ReactNode;
}

export function Tabs({ tabs, labelKey }: { tabs: readonly Tab[]; labelKey: string }): React.ReactElement {
  const t = useT('common');
  const base = useId();
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: React.KeyboardEvent, index: number): void => {
    const last = tabs.length - 1;
    const move = (to: number): void => {
      event.preventDefault();
      const next = tabs[to];
      if (next === undefined) return;
      setActive(next.id);
      buttons.current[to]?.focus();
    };
    if (event.key === 'ArrowRight') move(index === last ? 0 : index + 1);
    else if (event.key === 'ArrowLeft') move(index === 0 ? last : index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(last);
  };

  return (
    <div className="ds-tabs">
      <div className="ds-tabs__list" role="tablist" aria-label={t(labelKey)}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            ref={(node) => {
              buttons.current[index] = node;
            }}
            className="ds-tabs__tab"
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-controls={`${base}-panel-${tab.id}`}
            aria-selected={tab.id === active}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => {
              setActive(tab.id);
            }}
            onKeyDown={(event) => {
              onKeyDown(event, index);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
