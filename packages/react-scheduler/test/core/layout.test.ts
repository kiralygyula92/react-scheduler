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

  it('honors hourHeight, cardGap and minCardHeight', () => {
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

describe('keepCardsApart (ADR 0005 D2)', () => {
  // Two drawn boxes of the same column overlap when one starts before the other's drawn end.
  const collisions = (layout: TimelineLayout<SchedulerItem>, gap: number): string[] => {
    const found: string[] = [];
    const lanes = new Map<string, { id: string; top: number; bottom: number; from: number; to: number }[]>();
    for (const card of layout.cards) {
      // A card spans its column only; with `columns` columns, column c covers [c/columns, (c+1)/columns).
      const from = card.column / card.columns;
      const to = (card.column + 1) / card.columns;
      for (const [, boxes] of lanes) {
        for (const box of boxes) {
          const sideBySide = to <= box.from + 1e-9 || from >= box.to - 1e-9;
          const apart = card.top >= box.bottom + gap - 1e-6 || box.top >= card.top + card.height + gap - 1e-6;
          if (!sideBySide && !apart) found.push(`${box.id}×${card.item.id}`);
        }
      }
      const key = 'all';
      lanes.set(key, [
        ...(lanes.get(key) ?? []),
        { id: card.item.id, top: card.top, bottom: card.top + card.height, from, to },
      ]);
    }
    return found;
  };

  it('starts the next item of a column below a short card drawn at the minimum height', () => {
    // 20:00–20:30 is drawn 108 px (86 px of time at 172 px/h), so 20:30 would start under it.
    const items = [item('short', 'routine', at(20), at(20, 30)), item('next', 'routine', at(20, 30), at(21, 30))];
    const options = { minCardHeight: 108, hourHeight: 172, cardGap: 4 };
    expect(columnsOf(layoutOf(items, options))).toEqual({ short: '0/1', next: '0/1' });
    expect(collisions(layoutOf(items, options), 4)).toEqual(['short×next']);
    const apart = layoutOf(items, { ...options, keepCardsApart: true });
    expect(columnsOf(apart)).toEqual({ short: '0/2', next: '1/2' });
    expect(collisions(apart, 4)).toEqual([]);
    // What is drawn does not change: the item's own end and height.
    expect(apart.cards.map((card) => [card.end, card.height])).toEqual(
      layoutOf(items, options).cards.map((card) => [card.end, card.height]),
    );
  });

  it('never draws two cards over each other, compact or not (DQ-3)', () => {
    // A deterministic spread of starts, lengths and levels, dense enough to crowd and to promote.
    const levels = ['critical', 'watch', 'monitoring', 'routine', 'ready', 'normal'];
    let seed = 7;
    const next = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let round = 0; round < 40; round++) {
      const items = Array.from({ length: 14 }, (_, index) => {
        const start = 6 * 60 + Math.floor(next() * 64) * 15;
        const length = [15, 30, 45, 60, 90, 120][Math.floor(next() * 6)] as number;
        const time = (minutes: number): string => at(Math.floor(minutes / 60) % 24, minutes % 60);
        return item(
          `i${String(index)}`,
          levels[Math.floor(next() * levels.length)] as string,
          time(start),
          time(Math.min(start + length, 23 * 60 + 45)),
        );
      });
      for (const compact of [false, true]) {
        const layout = layoutOf(items, { compact, minCardHeight: 108, keepCardsApart: true });
        for (const card of layout.cards) expect(card.column).toBeLessThan(card.columns);
        expect(collisions(layout, 4), `round ${String(round)}, compact ${String(compact)}`).toEqual([]);
      }
    }
  });
});
