import { describe, expect, it } from 'vitest';
import { classicLevels, resolveLevels } from '../../src/core/levels';
import { computeTimelineLayout } from '../../src/core/layout';
import type { SchedulerItem, TimelineLayout, TimelineLayoutOptions } from '../../src/core/types';
import { fixture, HOUR, parityLayoutOptions } from '../parity/adapter';

const MINUTE = 60_000;
const DAY = '2031-03-12T10:30:00';
const at = (h: number, m = 0): string => `2031-03-12T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
const item = (id: string, level: string, start: string, end?: string): SchedulerItem =>
  end === undefined ? { id, level, start, title: id } : { id, level, start, end, title: id };
const layoutOf = (
  items: SchedulerItem[],
  overrides: Partial<TimelineLayoutOptions<SchedulerItem>> = {},
): TimelineLayout<SchedulerItem> =>
  computeTimelineLayout(items, parityLayoutOptions(DAY, overrides.compact ?? false, overrides));
const columnsOf = (layout: TimelineLayout<SchedulerItem>): Record<string, string> =>
  Object.fromEntries(layout.cards.map((card) => [card.item.id, `${card.column}/${card.columns}`]));
const overflowIds = (layout: TimelineLayout<SchedulerItem>): string[][] =>
  layout.overflow.map((group) => group.items.map((i) => i.id));

describe('column placement', () => {
  it('gives the left columns to stronger levels inside an overlap group', () => {
    const layout = layoutOf([
      item('w', 'watch', at(9), at(10)),
      item('m', 'monitoring', at(9), at(10)),
      item('r', 'routine', at(9), at(10)),
      item('c', 'critical', at(9, 30), at(11)),
    ]);
    expect(columnsOf(layout)).toEqual({ c: '0/3', w: '1/3', m: '2/3' });
    expect(overflowIds(layout)).toEqual([['r']]);
  });

  it("with columnPlacement: 'time', the earliest overlapping item keeps column 0 and nothing is promoted", () => {
    const items = [item('early', 'routine', at(9), at(11)), item('strong', 'critical', at(9, 30), at(10, 30))];
    expect(columnsOf(layoutOf(items))).toEqual({ strong: '0/2', early: '1/2' });
    expect(columnsOf(layoutOf(items, { columnPlacement: 'time' }))).toEqual({ early: '0/2', strong: '1/2' });
  });

  it('respects maxColumns and the crowded caps', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map((id) => item(id, 'routine', at(9), at(10)));
    expect(layoutOf(items, { maxColumns: 2, maxColumnsCrowded: 2 }).cards).toHaveLength(2);
    expect(layoutOf(items, { maxColumns: 3, maxColumnsCrowded: 5 }).cards).toHaveLength(5);
    expect(layoutOf(items, { compact: true, maxColumnsCompact: 2 }).cards).toHaveLength(2);
  });

  it('uses compareItems for placement order ties', () => {
    const items = [item('a', 'routine', at(9), at(10)), item('b', 'routine', at(9), at(10))];
    const reversed = layoutOf(items, { compareItems: (x, y) => y.id.localeCompare(x.id) });
    expect(columnsOf(reversed)).toEqual({ b: '0/2', a: '1/2' });
  });
});

describe('geometry', () => {
  it('places cards at (start − range start) × hourHeight / 60 per minute, minus the gap, at least minCardHeight', () => {
    const layout = layoutOf([item('ninety', 'routine', at(9), at(10, 30)), item('ten', 'routine', at(12), at(12, 10))]);
    const byId = Object.fromEntries(layout.cards.map((card) => [card.item.id, card]));
    expect(byId['ninety']).toMatchObject({ top: 13 * 172, height: 258 - 4 });
    expect(byId['ten']?.height).toBe(80);
  });

  it('uses defaultDuration for a missing end and zero duration for an end before the start', () => {
    const layout = layoutOf([item('open', 'routine', at(17)), item('backwards', 'routine', at(14), at(13))]);
    const byId = Object.fromEntries(layout.cards.map((card) => [card.item.id, card]));
    expect(byId['open']).toMatchObject({ height: 340, end: new Date(2031, 2, 12, 19).getTime() });
    expect(byId['backwards']).toMatchObject({ height: 80, end: new Date(2031, 2, 12, 14).getTime() });
  });

  it('honours hourHeight, cardGap and minCardHeight', () => {
    const layout = layoutOf([item('x', 'routine', at(9), at(10))], { hourHeight: 120, cardGap: 10, minCardHeight: 20 });
    expect(layout.cards[0]).toMatchObject({ top: 13 * 120, height: 110 });
    expect(layout.height).toBe(36 * 120);
  });

  it('skips items with an invalid start and returns an empty layout for no items', () => {
    expect(layoutOf([item('bad', 'routine', 'soon')]).cards).toEqual([]);
    const empty = layoutOf([]);
    expect([empty.cards, empty.overflow, empty.height]).toEqual([[], [], 36 * 172]);
  });

  it('is at least one hour tall', () => {
    const start = new Date(2031, 2, 12, 9).getTime();
    const options = { ...parityLayoutOptions(DAY, false), rangeStart: start, rangeEnd: start };
    expect(computeTimelineLayout([], options).height).toBe(172);
  });
});

describe('overflow groups', () => {
  it('buckets overflow by start hour and merges overlapping buckets within the window of the anchor', () => {
    const four = ['a', 'b', 'c', 'd'].map((id) => item(id, 'routine', at(10), at(11, 30)));
    const layout = layoutOf([...four, item('e', 'routine', at(11), at(12))]);
    expect(overflowIds(layout)).toEqual([['d', 'e']]);
    expect(layout.overflow[0]).toMatchObject({
      id: String(new Date(2031, 2, 12, 10).getTime()),
      anchor: new Date(2031, 2, 12, 10).getTime(),
    });
  });

  it('keeps buckets apart when they start more than overflowMergeWindow after the anchor', () => {
    const four = ['a', 'b', 'c', 'd'].map((id) => item(id, 'routine', at(10), at(11, 30)));
    const layout = layoutOf([...four, item('e', 'routine', at(11), at(12))], { overflowMergeWindow: 30 * MINUTE });
    expect(overflowIds(layout)).toEqual([['d'], ['e']]);
  });

  it('[B-10] dense data no longer collapses into one group at the default window', () => {
    const { items, date } = fixture('large');
    const chained = computeTimelineLayout(items, parityLayoutOptions(date, false, { overflowMergeWindow: Infinity }));
    expect(chained.overflow).toHaveLength(1);
    expect(chained.overflow[0]?.items).toHaveLength(157);

    const bounded = computeTimelineLayout(items, parityLayoutOptions(date, false));
    expect(bounded.overflow.length).toBeGreaterThan(1);
    expect(bounded.overflow.flatMap((group) => group.items)).toHaveLength(157);
    for (const group of bounded.overflow) {
      // Every merged bucket starts within the window of the group's anchor.
      const hours = group.items.map((i) => new Date(new Date(i.start).setMinutes(0, 0, 0)).getTime());
      expect(Math.max(...hours) - group.anchor).toBeLessThanOrEqual(2 * HOUR);
    }
  });

  it('orders a group by level rank, then placement order', () => {
    const items = [
      item('r1', 'routine', at(9), at(10)),
      item('r2', 'routine', at(9), at(10)),
      item('r3', 'routine', at(9), at(10)),
      item('w', 'watch', at(9, 15), at(10)),
      item('res', 'resolved', at(9), at(10)),
    ];
    expect(overflowIds(layoutOf(items, { levels: resolveLevels(classicLevels) }))).toEqual([['r3', 'res']]);
  });
});
