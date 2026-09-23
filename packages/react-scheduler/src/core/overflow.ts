// SPDX-License-Identifier: MIT
// Overflow table sorting and paging (Feature Dossier 01 §T.7, 05 F-13).
import { rankOf } from './levels';
import { toMs } from './time';
import type { SchedulerItem, SortDirection } from './types';

/** The part of an overflow column that sorting needs; `OverflowColumn` (React layer) extends it. */
export interface SortableColumn<TItem> {
  /** Identifies the column in a sort. */
  id: string;
  /** Omit to make the column unsortable. */
  sortValue?: ((item: TItem) => string | number) | undefined;
}

export type DefaultOverflowColumnId = 'time' | 'level' | 'title' | 'description';

/**
 * Sort values of the default columns: time → start (an invalid start sorts last), level → rank,
 * title and description → lower-case text.
 */
export function overflowSortValues(
  levels: ReadonlyMap<string, { rank: number }>,
): Record<DefaultOverflowColumnId, (item: SchedulerItem) => string | number> {
  return {
    time: (item) => {
      const start = toMs(item.start);
      return Number.isNaN(start) ? Number.POSITIVE_INFINITY : start;
    },
    level: (item) => rankOf(levels, item.level),
    title: (item) => item.title.toLowerCase(),
    description: (item) => (item.description ?? '').toLowerCase(),
  };
}

function compareValues(a: string | number, b: string | number): number {
  if (a === b) return 0;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : 1;
  return String(a).localeCompare(String(b));
}

/**
 * Items sorted by the column's value; ties break by `compare`. The whole comparison, ties
 * included, follows the direction. An unsortable or unknown column sorts by `compare` alone.
 *
 * @param items The items of one overflow group.
 * @param sort The column and the direction to sort by.
 * @param columns The columns in force, which say how each one sorts.
 * @param compare The order that breaks a tie.
 */
export function sortOverflowItems<TItem>(
  items: readonly TItem[],
  sort: { column: string; direction: SortDirection },
  columns: readonly SortableColumn<TItem>[],
  compare: (a: TItem, b: TItem) => number,
): TItem[] {
  const sortValue = columns.find((column) => column.id === sort.column)?.sortValue;
  const sign = sort.direction === 'desc' ? -1 : 1;
  const keyed = items.map((item) => ({ item, key: sortValue ? sortValue(item) : 0 }));
  keyed.sort((a, b) => sign * (compareValues(a.key, b.key) || compare(a.item, b.item)));
  return keyed.map((entry) => entry.item);
}

/**
 * Pages to show in the pager (0-based): every page when there are at most 7; otherwise the first
 * two, the last two and the current page ±1, with 'ellipsis' in each gap.
 *
 * @param currentPage The page being shown, counted from zero.
 * @param totalPages How many pages there are.
 */
export function pageList(currentPage: number, totalPages: number): readonly (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: Math.max(0, totalPages) }, (_, page) => page);
  const pages = [...new Set([0, 1, totalPages - 2, totalPages - 1, currentPage - 1, currentPage, currentPage + 1])]
    .filter((page) => page >= 0 && page < totalPages)
    .sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) result.push('ellipsis');
    result.push(page);
  });
  return result;
}
