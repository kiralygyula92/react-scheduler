import { describe, expect, it } from 'vitest';
import { reconcileOpenItem } from '../../src/core/detail';
import { nowMarkerIndex, nowVisible } from '../../src/core/now';
import { getShiftWindows } from '../../src/core/shifts';
import type { SchedulerItem } from '../../src/core/types';

const [previous, current, next] = getShiftWindows('2031-03-12T10:30:00');
const at = (day: number, h: number, m = 0): number => new Date(2031, 2, day, h, m).getTime();
const base = {
  enabled: true,
  now: at(12, 10, 41),
  date: at(12, 10, 30),
  current: current!,
  rangeStart: previous!.start,
  rangeEnd: next!.end,
};

describe('nowVisible', () => {
  it('shows now inside the current shift on the selected day', () => {
    expect(nowVisible(base)).toBe(true);
  });

  it('hides it when disabled, for another selected day, or outside the current window', () => {
    expect(nowVisible({ ...base, enabled: false })).toBe(false);
    expect(nowVisible({ ...base, date: at(10, 10, 30) })).toBe(false);
    expect(nowVisible({ ...base, now: at(12, 21, 5) })).toBe(false);
    expect(nowVisible({ ...base, now: current!.end })).toBe(false);
    expect(nowVisible({ ...base, now: Number.NaN })).toBe(false);
  });

  it('requires now inside the rendered range', () => {
    expect(nowVisible({ ...base, rangeEnd: at(12, 10) })).toBe(false);
  });
});

describe('nowMarkerIndex', () => {
  it('places the list marker before the first card starting after now, or last', () => {
    const items = [
      { start: '2031-03-12T09:00:00' },
      { start: '2031-03-12T10:41:00' },
      { start: '2031-03-12T11:00:00' },
    ];
    expect(nowMarkerIndex(items, at(12, 10, 41))).toBe(2);
    expect(nowMarkerIndex(items, at(12, 12))).toBe(3);
    expect(nowMarkerIndex(items, at(12, 8))).toBe(0);
  });
});

describe('reconcileOpenItem', () => {
  const items: SchedulerItem[] = [{ id: 'c01', level: 'critical', start: 0, title: 'Server room alert' }];

  it('keeps an open item that is still present and does nothing when closed', () => {
    expect(reconcileOpenItem('c01', items)).toEqual({ openItemId: 'c01', item: items[0] });
    expect(reconcileOpenItem(null, items)).toEqual({ openItemId: null, item: null });
  });

  it('[B-03] closes with reason itemRemoved when the item disappears, and never reopens by itself', () => {
    const closed = reconcileOpenItem('c01', []);
    expect(closed).toEqual({ openItemId: null, item: null, closeReason: 'itemRemoved' });
    expect(reconcileOpenItem(closed.openItemId, items)).toEqual({ openItemId: null, item: null });
  });
});
