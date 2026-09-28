// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListView, Scheduler } from '../../src/index';
import type { SchedulerItem } from '../../src/core/types';
import { fixture } from '../parity/adapter';
import { injectListLayout } from '../support/layout';
import { part, parts, renderUi, scrollCalls, scrollTo, settle, setupComponentEnvironment } from '../support/react';

// The list-view DOM scenarios (LV-*) of the characterization suite, rendered through the components
// with injected layout, as the source's own suite did (Feature Dossier 07 §3).
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const titleOf = new Map(baseline.items.map((item) => [item.title, item.id]));
const base = { items: baseline.items, date: baseline.date, now: baseline.now };

function cardIds(root: ParentNode): string[] {
  return parts(root, 'listCard').map((card) => titleOf.get(part(card, 'cardTitle').textContent ?? '') ?? '?');
}

function description(element: HTMLElement): string {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
}

/** Resolves React.lazy chunks: the dynamic imports settle, then React re-renders. */
async function flushLazy(): Promise<void> {
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

function items(perShift: readonly number[]): SchedulerItem[] {
  const starts = ['2031-03-11T21', '2031-03-12T09', '2031-03-12T21'];
  return perShift.flatMap((count, shift) =>
    Array.from({ length: count }, (_, index) => ({
      id: `s${shift}-${index}`,
      start: `${starts[shift]}:${String(index).padStart(2, '0')}:00`,
      level: 'routine',
      title: `Item ${shift}.${index}`,
    })),
  );
}

describe('list scenarios', () => {
  it('[LV-01] three sections in shift order with their titles and range labels', () => {
    const { container } = renderUi(<ListView {...base} />);
    const sections = parts(container, 'shiftSection');
    expect(sections.map((section) => section.dataset['rsOffset'])).toEqual(['-1', '0', '1']);
    expect(sections.map((section) => part(section, 'shiftHeaderTitle').textContent)).toEqual([
      'Previous shift',
      'Current shift',
      'Next shift',
    ]);
    expect(sections.map((section) => part(section, 'shiftHeaderRange').textContent)).toEqual([
      'Mar 11, 8 PM - Mar 12, 8 AM',
      'Mar 12, 8 AM - Mar 12, 8 PM',
      'Mar 12, 8 PM - Mar 13, 8 AM',
    ]);
    // Each section is labeled by its header; titles are headings of the configured level.
    expect(screen.getByRole('region', { name: /Current shift/ })).toBe(sections[1]);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it('[LV-02] cards follow the placement order within sections', () => {
    const { container } = renderUi(<ListView {...base} />);
    expect(cardIds(container)).toEqual([
      'p01',
      'p02',
      'p03',
      'p04',
      'c01',
      'c02',
      'c03',
      'c04',
      'c05',
      'c06',
      'c07',
      'c08',
      'c09',
      'c10',
      'n01',
      'n02',
      'n03',
    ]);
  });

  it('[LV-03] an empty shift shows the per-shift empty text', () => {
    const withoutNext = baseline.items.filter((item) => !item.id.startsWith('n'));
    const { container } = renderUi(<ListView {...base} items={withoutNext} />);
    const next = parts(container, 'shiftSection')[2] as HTMLElement;
    expect(part(next, 'shiftEmpty').textContent).toBe('No items in this shift.');
  });

  it('[LV-04] with no items: the global empty text, the header signal expanded and no navigation', () => {
    const empty = fixture('empty');
    const onHeaderExpandedChange = vi.fn();
    const { container } = renderUi(
      <ListView
        items={empty.items}
        date={empty.date}
        now={empty.now}
        headerExpanded={false}
        onHeaderExpandedChange={onHeaderExpandedChange}
      />,
    );
    settle();
    expect(part(container, 'emptyState').textContent).toBe('Nothing is scheduled for this day.');
    expect(parts(container, 'shiftSection')).toHaveLength(0);
    expect(parts(container, 'navButton')).toHaveLength(0);
    expect(onHeaderExpandedChange).toHaveBeenCalledWith(true, { view: 'list', reason: 'empty' });
  });

  it('[LV-05] navigation shows only when some shift has at least five items', () => {
    const { container, rerender } = renderUi(
      <ListView items={items([1, 1, 1])} date={baseline.date} now={baseline.now} />,
    );
    expect(parts(container, 'navButton')).toHaveLength(0);
    act(() => rerender(<ListView items={items([4, 4, 4])} date={baseline.date} now={baseline.now} />));
    expect(parts(container, 'navButton')).toHaveLength(0);
    act(() => rerender(<ListView items={items([1, 5, 1])} date={baseline.date} now={baseline.now} />));
    expect(parts(container, 'navButton').length).toBeGreaterThan(0);
  });

  it('[LV-06] the count counts pinnable items of earlier shifts and shows only when the top button targets one (fixed: B-06)', () => {
    const { container } = renderUi(<ListView {...base} />);
    const scroller = injectListLayout(container, {
      sticky: 152,
      client: 700,
      scroll: 4000,
      sections: [0, 612, 2400],
      header: 60,
      cards: (index) => ({ top: 672 + index * 110, height: 100 }),
    });
    settle();
    scrollTo(scroller, 200);
    // Active previous, not at its start: the top button targets the previous shift with the count.
    const top = parts(container, 'navButton').find((button) => button.dataset['rsPosition'] === 'top') as HTMLElement;
    expect(top.textContent).toBe('View previous shift(2 inherited)');
    // At the end the top button targets the current shift: no count (the source still showed it).
    scrollTo(scroller, 3300);
    const topAtEnd = parts(container, 'navButton').find(
      (button) => button.dataset['rsPosition'] === 'top',
    ) as HTMLElement;
    expect(topAtEnd.textContent).toBe('View current shift');
  });

  it('[LV-07] card anatomy: a native button named by the title and described by level, time and tags (fixed: B-18)', () => {
    const { container } = renderUi(<ListView {...base} />);
    const c02 = screen.getByRole('button', { name: 'Delivery delay' });
    expect(c02.tagName).toBe('BUTTON');
    expect(c02.getAttribute('type')).toBe('button');
    expect(description(c02)).toBe('Watch, 9:00 AM – 10:30 AM');
    const card02 = c02.closest('[data-rs-part="listCard"]') as HTMLElement;
    expect(part(card02, 'cardTimeLabel').textContent).toBe('9:00 AM – 10:30 AM');
    expect(part(card02, 'levelPill').textContent).toBe('Watch');
    expect(part(card02, 'referencePill').textContent).toBe('Ref: 1042');
    expect(part(card02, 'cardDescription').textContent).toBe('Short description for delivery delay.');
    expect(parts(card02, 'cardSuggestion')).toHaveLength(0);
    // Phrasing content only: no block elements inside the button.
    expect(c02.querySelectorAll('div, p, ul, li, h1, h2, h3, h4, h5, h6')).toHaveLength(0);

    const c01 = screen.getByRole('button', { name: 'Server room alert' });
    const card01 = c01.closest('[data-rs-part="listCard"]') as HTMLElement;
    expect(part(card01, 'cardTimeLabel').textContent).toBe('Observed at: 8:12 AM – Present');
    expect(part(card01, 'levelPill').textContent).toBe('Critical');
    expect(part(card01, 'tagPill').textContent).toBe('Impacts Next Shift');
    expect(description(c01)).toBe('Critical, Observed at: 8:12 AM – Present, Impacts Next Shift');

    // Only pinned-level cards carry the hidden sentinel.
    const withSentinel = parts(container, 'listCard').filter((card) => parts(card, 'pinSentinel').length > 0);
    expect(withSentinel.map((card) => card.dataset['rsLevel'])).toEqual([
      'critical',
      'critical',
      'critical',
      'critical',
      'critical',
    ]);
    expect(parts(container, 'pinSentinel').every((sentinel) => sentinel.getAttribute('aria-hidden') === 'true')).toBe(
      true,
    );

    const c04 = screen.getByRole('button', { name: 'Inventory count' });
    expect(part(c04.closest('[data-rs-part="listCard"]') as HTMLElement, 'cardTimeLabel').textContent).toBe(
      'Ready since: 03/12/2031 07:45 AM',
    );
  });

  it('[LV-08] the list shows a now marker before the first later card (fixed: B-01)', () => {
    const { container } = renderUi(<ListView {...base} now="2031-03-12T10:41:00" />);
    const marker = screen.getByRole('separator', { name: 'Now: 10:41 AM' });
    expect(part(marker, 'nowLabel').textContent).toBe('10:41 AM');
    const current = parts(container, 'shiftSection')[1] as HTMLElement;
    const entries = [...part(current, 'itemList').children].map((child) =>
      child.querySelector('[data-rs-part="nowMarker"]')
        ? 'now'
        : titleOf.get(child.querySelector('[data-rs-part="cardTitle"]')?.textContent ?? ''),
    );
    expect(entries.slice(4, 7)).toEqual(['c05', 'now', 'c06']);

    const past = fixture('past-date');
    const { container: pastContainer } = renderUi(<ListView items={past.items} date={past.date} now={past.now} />);
    expect(parts(pastContainer, 'nowMarker')).toHaveLength(0);
  });

  it('[LV-09] loading shows the loading state instead of cards, then dims reloaded content (fixed: B-02)', () => {
    const { container, rerender } = renderUi(<ListView {...base} loading />);
    expect(screen.getByRole('progressbar', { name: 'Loading…' })).toBeDefined();
    expect(parts(container, 'listCard')).toHaveLength(0);
    act(() => rerender(<ListView {...base} />));
    expect(parts(container, 'listCard')).toHaveLength(17);
    act(() => rerender(<ListView {...base} loading />));
    expect(parts(container, 'listCard')).toHaveLength(17);
    expect(part(container, 'scroller').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('progressbar', { name: 'Loading…' })).toBeDefined();
  });

  it('[LV-10] without a current shift only the root renders', () => {
    const segments = [
      {
        role: 'previous' as const,
        start: '2031-03-11T20:00:00',
        end: '2031-03-12T08:00:00',
        items: baseline.items.slice(0, 4),
      },
      {
        role: 'next' as const,
        start: '2031-03-12T20:00:00',
        end: '2031-03-13T08:00:00',
        items: baseline.items.slice(14),
      },
    ];
    const { container } = renderUi(<ListView segments={segments} date={baseline.date} now={baseline.now} />);
    const root = part(container, 'root');
    expect(root.children).toHaveLength(0);
  });

  it('[LV-11] activating a card opens its detail dialog (lazy); Escape closes it', async () => {
    const onItemOpen = vi.fn();
    const onItemClose = vi.fn();
    renderUi(<ListView {...base} onItemOpen={onItemOpen} onItemClose={onItemClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Server room alert' }));
    await flushLazy();
    const dialog = screen.getByRole('dialog', { name: 'Server room alert' });
    expect(onItemOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'c01' }), { source: 'listCard' });
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onItemClose).toHaveBeenCalledWith(expect.objectContaining({ id: 'c01' }), { reason: 'escape' });
    // Focus returns to the activator.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Server room alert' }));
  });

  it('[LV-12] a detail view whose item disappears closes and does not reopen by itself (fixed: B-03)', async () => {
    const onItemClose = vi.fn();
    const without = baseline.items.filter((item) => item.id !== 'c01');
    const { rerender } = renderUi(<ListView {...base} onItemClose={onItemClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Server room alert' }));
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'Server room alert' })).toBeDefined();
    act(() => rerender(<ListView {...base} items={without} onItemClose={onItemClose} />));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onItemClose).toHaveBeenCalledWith(expect.objectContaining({ id: 'c01' }), { reason: 'itemRemoved' });
    act(() => rerender(<ListView {...base} onItemClose={onItemClose} />));
    await flushLazy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('[LV-13] switching from the timeline to the list expands the header', () => {
    const onHeaderExpandedChange = vi.fn();
    const props = { ...base, headerExpanded: false, onHeaderExpandedChange };
    const { rerender } = renderUi(<Scheduler {...props} view="timeline" />);
    settle();
    onHeaderExpandedChange.mockClear();
    act(() => rerender(<Scheduler {...props} view="list" />));
    settle();
    expect(onHeaderExpandedChange).toHaveBeenCalledWith(true, { view: 'list', reason: 'viewEnter' });
  });

  it('[LV-14] header signal with injected layout; the third card counts cards only (fixed: B-08)', () => {
    const onHeaderExpandedChange = vi.fn();
    const { container } = renderUi(
      <ListView {...base} onHeaderExpandedChange={onHeaderExpandedChange} list={{ landing: { initial: 'none' } }} />,
    );
    const scroller = injectListLayout(container, {
      sticky: 64,
      client: 600,
      scroll: 3000,
      sections: [0, 600, 2200],
      header: 60,
      cards: (index) => ({ top: 660 + index * 110, height: 100 }),
    });
    settle();
    const values: boolean[] = [];
    const at = (top: number): boolean => {
      scrollTo(scroller, top);
      const last = onHeaderExpandedChange.mock.calls.at(-1)?.[0] as boolean | undefined;
      values.push(last ?? true);
      return last ?? true;
    };
    expect(at(100)).toBe(true);
    expect(at(536)).toBe(true);
    expect(at(1100)).toBe(false);
    expect(at(878)).toBe(true);
    // The source's threshold was the 2nd card (sentinels counted); the 3rd card's bottom + 8 is 988.
    expect(at(879)).toBe(true);
    expect(at(988)).toBe(true);
    expect(at(989)).toBe(false);
  });

  it('[LV-15] the compact scroll-to-top button appears past 96 px and scrolls to 0 smoothly', () => {
    const { container } = renderUi(<ListView {...base} compact />);
    const scroller = injectListLayout(container, {
      sticky: 24,
      client: 700,
      scroll: 4000,
      sections: [0, 612, 2400],
      header: 60,
      cards: (index) => ({ top: 672 + index * 110, height: 100 }),
    });
    scrollTo(scroller, 96);
    expect(parts(container, 'scrollTopButton')).toHaveLength(0);
    scrollTo(scroller, 97);
    const button = screen.getByRole('button', { name: 'Scroll to top' });
    scrollCalls.length = 0;
    fireEvent.click(button);
    expect(scrollCalls).toEqual([{ top: 0, behavior: 'smooth' }]);
  });

  it('[LV-16] with reduced motion, scrolling is instant', () => {
    const { container } = renderUi(<ListView {...base} compact reducedMotion />);
    const scroller = injectListLayout(container, {
      sticky: 24,
      client: 700,
      scroll: 4000,
      sections: [0, 612, 2400],
      header: 60,
      cards: (index) => ({ top: 672 + index * 110, height: 100 }),
    });
    settle();
    scrollTo(scroller, 200);
    scrollCalls.length = 0;
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }));
    expect(scrollCalls).toEqual([{ top: 0, behavior: 'auto' }]);
    scrollTo(scroller, 200);
    scrollCalls.length = 0;
    const bottom = parts(container, 'navButton').find(
      (button) => button.dataset['rsPosition'] === 'bottom',
    ) as HTMLElement;
    fireEvent.click(bottom);
    // Instant path: scrollTop is assigned; no smooth scrollTo call.
    expect(scrollCalls.filter((call) => call.behavior === 'smooth')).toHaveLength(0);
    expect(scroller.scrollTop).toBe(612 - 24 - 8);
    expect(within(bottom).getByText('View current shift')).toBeDefined();
  });
});
