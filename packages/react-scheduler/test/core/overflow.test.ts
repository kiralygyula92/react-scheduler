import { describe, expect, it } from 'vitest';
import { classicLevels, compareByPlacement, rankOf, resolveLevels } from '../../src/core/levels';
import { overflowSortValues, pageList, sortOverflowItems, type SortableColumn } from '../../src/core/overflow';
import type { SchedulerItem } from '../../src/core/types';

const levels = resolveLevels(classicLevels);
const values = overflowSortValues(levels);
const columns: SortableColumn<SchedulerItem>[] = [
  ...Object.entries(values).map(([id, sortValue]) => ({ id, sortValue })),
  { id: 'actions' },
];
const placement = compareByPlacement(levels);
// Parity tie-break: rank, then start, then id (Feature Dossier 01 §T.7).
const tieBreak = (a: SchedulerItem, b: SchedulerItem): number =>
  rankOf(levels, a.level) - rankOf(levels, b.level) || placement(a, b);

const item = (id: string, level: string, start: string, title: string, description?: string): SchedulerItem =>
  description === undefined ? { id, level, start, title } : { id, level, start, title, description };
const items = [
  item('a', 'routine', '2031-03-12T10:00:00', 'beta', 'Zulu'),
  item('b', 'critical', '2031-03-12T09:00:00', 'Alpha'),
  item('c', 'watch', '2031-03-12T09:00:00', 'alpha', 'echo'),
  item('d', 'watch', 'not a date', 'gamma'),
];
const ids = (list: readonly SchedulerItem[]): string[] => list.map((x) => x.id);

describe('sortOverflowItems', () => {
  it('sorts by time ascending by default, invalid starts last, ties by rank', () => {
    expect(ids(sortOverflowItems(items, { column: 'time', direction: 'asc' }, columns, tieBreak))).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
  });

  it('reverses the whole comparison, ties included, for descending order', () => {
    expect(ids(sortOverflowItems(items, { column: 'time', direction: 'desc' }, columns, tieBreak))).toEqual([
      'd',
      'a',
      'c',
      'b',
    ]);
  });

  it('sorts titles and descriptions case-insensitively and levels by rank', () => {
    expect(ids(sortOverflowItems(items, { column: 'title', direction: 'asc' }, columns, tieBreak))).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
    expect(ids(sortOverflowItems(items, { column: 'description', direction: 'asc' }, columns, tieBreak))).toEqual([
      'b',
      'd',
      'c',
      'a',
    ]);
    expect(ids(sortOverflowItems(items, { column: 'level', direction: 'asc' }, columns, tieBreak))).toEqual([
      'b',
      'c',
      'd',
      'a',
    ]);
  });

  it('falls back to the tie-break order for unsortable or unknown columns', () => {
    expect(ids(sortOverflowItems(items, { column: 'actions', direction: 'asc' }, columns, tieBreak))).toEqual([
      'b',
      'c',
      'd',
      'a',
    ]);
    expect(ids(sortOverflowItems(items, { column: 'nope', direction: 'asc' }, columns, tieBreak))).toEqual([
      'b',
      'c',
      'd',
      'a',
    ]);
  });
});

describe('pageList', () => {
  it('lists every page when there are at most 7', () => {
    expect(pageList(0, 0)).toEqual([]);
    expect(pageList(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('shows the first two, the last two and the current page ±1 with ellipses in the gaps', () => {
    expect(pageList(0, 12)).toEqual([0, 1, 'ellipsis', 10, 11]);
    expect(pageList(5, 12)).toEqual([0, 1, 'ellipsis', 4, 5, 6, 'ellipsis', 10, 11]);
    expect(pageList(3, 12)).toEqual([0, 1, 2, 3, 4, 'ellipsis', 10, 11]);
    expect(pageList(11, 12)).toEqual([0, 1, 'ellipsis', 10, 11]);
  });
});
