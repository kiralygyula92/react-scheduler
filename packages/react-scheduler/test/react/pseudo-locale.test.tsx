// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { SchedulerFormatters } from '../../src/core/format';
import type { SchedulerLocalization } from '../../src/core/localization';
import { ListView, type SchedulerProps, TimelineView } from '../../src/index';
import { enUS } from '../../src/locales/en';
import { fixture, type ParityItem } from '../parity/adapter';
import { renderUi, settle, setupComponentEnvironment } from '../support/react';

// No hard-coded strings (Feature Dossier 05 F-12): with a pseudo-locale, every visible and ARIA text
// comes from the pack (⟦…⟧), the formatters (‹…›) or the consumer's items («…»). Whatever remains
// may only be digits, punctuation and symbols (counts, page numbers, separators).
setupComponentEnvironment();

function pseudo<T>(value: T): T {
  if (typeof value === 'string') return `⟦${value}⟧` as T;
  return Object.fromEntries(Object.entries(value as object).map(([key, child]) => [key, pseudo(child)])) as T;
}

const PSEUDO: SchedulerLocalization = { ...pseudo(enUS), locale: 'en-US' };

const FORMATTERS: SchedulerFormatters = {
  clockTime: () => '‹clock›',
  hourLabel: () => '‹hour›',
  shiftRange: () => '‹range›',
  timeRange: () => '‹times›',
  sinceTimestamp: () => '‹since›',
  dateTime: () => '‹datetime›',
};

const baseline = fixture('baseline-day');
const items: ParityItem[] = baseline.items.map((item) => {
  const marked: ParityItem = {
    ...item,
    title: `«${item.title}»`,
    description: `«${item.description ?? ''}»`,
    suggestion: `«${item.suggestion ?? ''}»`,
  };
  if (item.reference !== undefined) marked.reference = `«${item.reference}»`;
  if (item.observedLabel !== undefined) marked.observedLabel = `«${item.observedLabel}»`;
  return marked;
});

const props: SchedulerProps<ParityItem> = {
  items,
  date: baseline.date,
  now: '2031-03-12T10:41:00',
  localization: PSEUDO,
  formatters: FORMATTERS,
};

const ATTRIBUTES = ['aria-label', 'aria-valuetext', 'aria-roledescription', 'title', 'alt', 'placeholder'];

/** Texts not produced by the pack, the formatters or the items. */
function unmarked(root: ParentNode): string[] {
  const texts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) texts.push(node.textContent ?? '');
  for (const element of root.querySelectorAll('*')) {
    for (const attribute of ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value !== null) texts.push(value);
    }
  }
  return texts
    .map((text) => text.replace(/⟦[^⟧]*⟧|‹[^›]*›|«[^»]*»/g, ''))
    .filter((rest) => !/^[\s\p{N}\p{P}\p{S}]*$/u.test(rest));
}

async function flushLazy(): Promise<void> {
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

describe('pseudo-locale', () => {
  it.each([
    ['list', (extra: Partial<SchedulerProps<ParityItem>>): ReactElement => <ListView {...props} {...extra} />],
    ['timeline', (extra: Partial<SchedulerProps<ParityItem>>): ReactElement => <TimelineView {...props} {...extra} />],
  ] as const)('the %s view and its states render only localized text', (_view, render) => {
    for (const extra of [{}, { items: [] }, { loading: true }, { error: 'failed', onRetry: () => undefined }]) {
      const { container, unmount } = renderUi(render(extra));
      settle();
      expect(unmarked(container)).toEqual([]);
      unmount();
    }
  });

  it('the detail and overflow dialogs render only localized text', async () => {
    const list = renderUi(<ListView {...props} />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: /«Server room alert»/ }));
    await flushLazy();
    expect(document.querySelector('dialog[open]')).not.toBeNull();
    expect(unmarked(document.body)).toEqual([]);
    list.unmount();

    renderUi(<TimelineView {...props} />);
    settle();
    fireEvent.click(document.querySelector('[data-rs-part="moreChip"]') as HTMLElement);
    await flushLazy();
    expect(document.querySelector('dialog[open]')).not.toBeNull();
    expect(unmarked(document.body)).toEqual([]);
  });
});
