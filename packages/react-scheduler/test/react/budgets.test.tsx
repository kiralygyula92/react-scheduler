// @vitest-environment jsdom
import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListView, type SchedulerSlots, type SlotProps, TimelineView } from '../../src/index';
import { fixture, type ParityItem } from '../parity/adapter';
import { renderUi, settle, setupComponentEnvironment } from '../support/react';

// The performance budgets that need no real layout (Feature Dossier 09 §3): a single item change
// re-renders only that item's card, and the internal clock sets no timers while the document is
// hidden. The measured budgets run in Chromium (test/browser/perf).
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const now = '2031-03-12T10:41:00';

/** Card slots that count renders per item id; created once per test, so their identity is stable. */
function countingSlots(): { counts: Map<string, number>; slots: Partial<SchedulerSlots<ParityItem>> } {
  const counts = new Map<string, number>();
  function Card({ Default, ownerState, ...props }: SlotProps<'listCard', ParityItem>): ReactElement {
    const id = ownerState.item?.id ?? '';
    counts.set(id, (counts.get(id) ?? 0) + 1);
    return <Default {...props} />;
  }
  return { counts, slots: { listCard: Card, timelineCard: Card } };
}

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

afterEach(() => {
  Reflect.deleteProperty(document, 'hidden');
});

describe('rendering budgets', () => {
  it.each([
    ['list', ListView],
    ['timeline', TimelineView],
  ] as const)('a single item change re-renders only that item card (%s view)', (_view, View) => {
    const { counts, slots } = countingSlots();
    const items = baseline.items;
    const target = items.find((item) => item.title === 'Server room alert') as ParityItem;
    const { rerender } = renderUi(<View items={items} date={baseline.date} now={now} slots={slots} />);
    settle();
    expect(counts.get(target.id)).toBeGreaterThan(0);
    counts.clear();
    const edited = items.map((item) => (item === target ? { ...item, title: 'Server room alert (edited)' } : item));
    act(() => {
      rerender(<View items={edited} date={baseline.date} now={now} slots={slots} />);
    });
    settle();
    expect([...counts.keys()]).toEqual([target.id]);
  });

  it('the internal clock sets no timers while the document is hidden', () => {
    renderUi(<ListView items={baseline.items} date={baseline.date} />);
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    // Once settled, the clock's interval is the only timer.
    expect(vi.getTimerCount()).toBe(1);
    setHidden(true);
    expect(vi.getTimerCount()).toBe(0);
    setHidden(false);
    expect(vi.getTimerCount()).toBe(1);
  });
});
