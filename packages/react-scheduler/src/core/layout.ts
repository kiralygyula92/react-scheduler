// SPDX-License-Identifier: MIT
// Timeline layout engine (Feature Dossier 01 §T.5, 05 F-06). The output equals the reference
// algorithm exactly (golden files and a differential test); the implementation replaces the
// source's pairwise scans with sorted structures (B-11) and bounds overflow merging (B-10).
import { rankOf } from './levels';
import { MINUTE, HOUR, resolveEnd, startOfLocalHour, toMs } from './time';
import type { OverflowGroup, PlacedCard, SchedulerItem, TimelineLayout, TimelineLayoutOptions } from './types';

interface Rec<TItem> {
  item: TItem;
  start: number;
  end: number;
  rank: number;
  /** Position in placement order (`compareItems`, default start → rank → id). */
  order: number;
  /** Column index, or -1 while in overflow. */
  column: number;
}

/** Index of the first element for which `before` is false (arrays sorted accordingly). */
function search<T>(array: readonly T[], before: (value: T) => boolean): number {
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (before(array[mid] as T)) low = mid + 1;
    else high = mid;
  }
  return low;
}

const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }): boolean =>
  a.start < b.end && b.start < a.end;

/** Strongest first: rank ascending, then placement order. */
const strongerFirst = <T>(a: Rec<T>, b: Rec<T>): number => a.rank - b.rank || a.order - b.order;

/**
 * Overlap-connected components (union of pairwise overlaps), each in placement order. Components
 * are ordered by earliest start, ties by smallest placement index. A zero-length item overlaps only
 * an item that strictly contains its instant.
 */
function components<T>(records: readonly Rec<T>[]): Rec<T>[][] {
  const byStart = [...records].sort((a, b) => a.start - b.start || a.order - b.order);
  const groups: { recs: Rec<T>[]; start: number; end: number; minOrder: number }[] = [];
  const zeroLength: Rec<T>[] = [];
  for (const rec of byStart) {
    if (rec.end <= rec.start) {
      zeroLength.push(rec);
      continue;
    }
    const last = groups[groups.length - 1];
    if (last && rec.start < last.end) {
      last.recs.push(rec);
      last.end = Math.max(last.end, rec.end);
      last.minOrder = Math.min(last.minOrder, rec.order);
    } else {
      groups.push({ recs: [rec], start: rec.start, end: rec.end, minOrder: rec.order });
    }
  }
  // Positive-length components cover disjoint spans; an instant strictly inside a span is strictly
  // inside one of its items, because the component would otherwise split at that instant.
  const singletons: typeof groups = [];
  for (const rec of zeroLength) {
    const group = groups[search(groups, (candidate) => candidate.start < rec.start) - 1];
    if (group && rec.start < group.end) {
      group.recs.push(rec);
      group.minOrder = Math.min(group.minOrder, rec.order);
    } else {
      singletons.push({ recs: [rec], start: rec.start, end: rec.end, minOrder: rec.order });
    }
  }
  return [...groups, ...singletons]
    .sort((a, b) => a.start - b.start || a.minOrder - b.minOrder)
    .map((group) => group.recs.sort((a, b) => a.order - b.order));
}

/** Columns of placed records, each kept sorted by (start, end); intervals in a column never overlap. */
class Columns<T> {
  readonly lists: Rec<T>[][] = [];
  /** Per column and rank index, placement orders sorted ascending. */
  private readonly byRank: number[][][] = [];

  constructor(
    private readonly rankIndex: ReadonlyMap<number, number>,
    private readonly byOrder: readonly Rec<T>[],
  ) {}

  private ensure(column: number): void {
    while (this.lists.length <= column) {
      this.lists.push([]);
      this.byRank.push(Array.from({ length: this.rankIndex.size }, () => []));
    }
  }

  add(rec: Rec<T>, column: number): void {
    this.ensure(column);
    const list = this.lists[column] as Rec<T>[];
    list.splice(
      search(list, (other) => other.start < rec.start || (other.start === rec.start && other.end <= rec.end)),
      0,
      rec,
    );
    const orders = this.byRank[column]?.[this.rankIndex.get(rec.rank) ?? 0] as number[];
    orders.splice(
      search(orders, (order) => order < rec.order),
      0,
      rec.order,
    );
    rec.column = column;
  }

  remove(rec: Rec<T>): void {
    const list = this.lists[rec.column] as Rec<T>[];
    list.splice(list.indexOf(rec), 1);
    const orders = this.byRank[rec.column]?.[this.rankIndex.get(rec.rank) ?? 0] as number[];
    orders.splice(
      search(orders, (order) => order < rec.order),
      1,
    );
    rec.column = -1;
  }

  /** Up to `limit` records of `column` overlapping `rec`. */
  overlapping(column: number, rec: Rec<T>, limit: number): Rec<T>[] {
    const list = this.lists[column] ?? [];
    const found: Rec<T>[] = [];
    for (let index = search(list, (other) => other.end <= rec.start); index < list.length; index++) {
      const other = list[index] as Rec<T>;
      if (other.start >= rec.end || found.length === limit) break;
      if (overlaps(other, rec)) found.push(other);
    }
    return found;
  }

  /** The weakest record of `column` whose rank is above `rank` (rank descending, then placement order). */
  weakestAbove(column: number, rank: number, ranks: readonly number[]): Rec<T> | undefined {
    const perRank = this.byRank[column];
    if (!perRank) return undefined;
    for (let index = ranks.length - 1; index >= 0 && (ranks[index] as number) > rank; index--) {
      const first = perRank[index]?.[0];
      if (first !== undefined) return this.byOrder[first];
    }
    return undefined;
  }
}

/** Range add / range max over elementary intervals (placed count minus cap). */
class MaxTree {
  private readonly size: number;
  private readonly max: number[];
  private readonly lazy: number[];

  constructor(initial: readonly number[]) {
    this.size = Math.max(1, initial.length);
    this.max = new Array<number>(4 * this.size).fill(-Infinity);
    this.lazy = new Array<number>(4 * this.size).fill(0);
    if (initial.length > 0) this.build(1, 0, this.size - 1, initial);
  }

  private build(node: number, low: number, high: number, initial: readonly number[]): void {
    if (low === high) {
      this.max[node] = initial[low] ?? -Infinity;
      return;
    }
    const mid = (low + high) >> 1;
    this.build(2 * node, low, mid, initial);
    this.build(2 * node + 1, mid + 1, high, initial);
    this.max[node] = Math.max(this.max[2 * node] as number, this.max[2 * node + 1] as number);
  }

  add(from: number, to: number, delta: number, node = 1, low = 0, high = this.size - 1): void {
    if (to < low || high < from) return;
    if (from <= low && high <= to) {
      this.max[node] = (this.max[node] as number) + delta;
      this.lazy[node] = (this.lazy[node] as number) + delta;
      return;
    }
    const mid = (low + high) >> 1;
    this.add(from, to, delta, 2 * node, low, mid);
    this.add(from, to, delta, 2 * node + 1, mid + 1, high);
    this.max[node] =
      Math.max(this.max[2 * node] as number, this.max[2 * node + 1] as number) + (this.lazy[node] as number);
  }

  query(from: number, to: number, node = 1, low = 0, high = this.size - 1): number {
    if (to < low || high < from) return -Infinity;
    if (from <= low && high <= to) return this.max[node] as number;
    const mid = (low + high) >> 1;
    return (
      Math.max(this.query(from, to, 2 * node, low, mid), this.query(from, to, 2 * node + 1, mid + 1, high)) +
      (this.lazy[node] as number)
    );
  }
}

/** Largest value over index ranges of a fixed array (sparse table). */
function rangeMax(values: readonly number[]): (from: number, to: number) => number {
  const table: number[][] = [[...values]];
  for (let width = 1; 2 * width <= values.length; width *= 2) {
    const previous = table[table.length - 1] as number[];
    const next: number[] = [];
    for (let index = 0; index + 2 * width <= values.length; index++) {
      next.push(Math.max(previous[index] as number, previous[index + width] as number));
    }
    table.push(next);
  }
  return (from, to) => {
    const level = Math.floor(Math.log2(to - from + 1));
    const row = table[level] as number[];
    return Math.max(row[from] as number, row[to - (1 << level) + 1] as number);
  };
}

/**
 * Places items into timeline columns and overflow groups (Feature Dossier 01 §T.5 steps 1–7):
 * placement sequence, greedy columns, promotion from overflow, gap fill, geometry, overflow
 * groups (bounded by `overflowMergeWindow`, measured from each group's anchor) and column counts.
 *
 * @param items The items of the rendered range, in any order.
 * @param options The geometry and the caps: the hour height, the columns, the merge window.
 */
export function computeTimelineLayout<TItem extends SchedulerItem>(
  items: readonly TItem[],
  options: TimelineLayoutOptions<TItem>,
): TimelineLayout<TItem> {
  const {
    rangeStart,
    rangeEnd,
    levels,
    compact,
    hourHeight,
    maxColumns,
    maxColumnsCrowded,
    maxColumnsCompact,
    minCardHeight,
    cardGap,
    columnPlacement,
    overflowMergeWindow,
    defaultDuration,
    compareItems,
  } = options;

  const records: Rec<TItem>[] = [];
  for (const item of items) {
    const start = toMs(item.start);
    if (Number.isNaN(start)) continue;
    records.push({
      item,
      start,
      end: resolveEnd(start, item.end, defaultDuration),
      rank: rankOf(levels, item.level),
      order: 0,
      column: -1,
    });
  }
  records.sort(
    compareItems
      ? (a, b) => compareItems(a.item, b.item)
      : (a, b) => a.start - b.start || a.rank - b.rank || a.item.id.localeCompare(b.item.id),
  );
  records.forEach((rec, index) => {
    rec.order = index;
  });

  // Overlap count of the input at an instant: starts ≤ t minus ends ≤ t.
  const starts = records.map((rec) => rec.start).sort((a, b) => a - b);
  const ends = records.map((rec) => rec.end).sort((a, b) => a - b);
  const overlapCount = (time: number): number =>
    search(starts, (value) => value <= time) - search(ends, (value) => value <= time);
  const cap = (time: number): number =>
    overlapCount(time) > maxColumns ? (compact ? maxColumnsCompact : maxColumnsCrowded) : maxColumns;

  const ranks = [...new Set(records.map((rec) => rec.rank))].sort((a, b) => a - b);
  const columns = new Columns<TItem>(new Map(ranks.map((rank, index) => [rank, index])), records);
  const overflow: Rec<TItem>[] = [];

  // Steps 1–2: placement sequence and greedy columns.
  const greedy = (sequence: readonly Rec<TItem>[]): void => {
    const columnEnds: number[] = [];
    for (const rec of sequence) {
      let column = columnEnds.findIndex((end) => end <= rec.start);
      if (column < 0 && columnEnds.length < cap(rec.start)) column = columnEnds.push(0) - 1;
      if (column < 0) {
        overflow.push(rec);
        continue;
      }
      columnEnds[column] = rec.end;
      columns.add(rec, column);
    }
  };
  if (columnPlacement === 'time') {
    greedy(records);
  } else {
    for (const component of components(records)) greedy([...component].sort(strongerFirst));
  }
  overflow.sort(strongerFirst);

  // Step 3: promotion. An overflowed item takes the column of the weakest weaker placed item
  // whose removal leaves that column free around it; the displaced item goes to overflow.
  // Skipped for 'time' placement, so earlier items keep the left columns.
  if (columnPlacement !== 'time') {
    for (let swapped = true; swapped;) {
      swapped = false;
      for (const candidate of overflow) {
        let victim: Rec<TItem> | undefined;
        for (let column = 0; column < columns.lists.length; column++) {
          const blocking = columns.overlapping(column, candidate, 2);
          const option =
            blocking.length === 0
              ? columns.weakestAbove(column, candidate.rank, ranks)
              : blocking.length === 1 && (blocking[0] as Rec<TItem>).rank > candidate.rank
                ? blocking[0]
                : undefined;
          if (
            option &&
            (!victim || option.rank > victim.rank || (option.rank === victim.rank && option.order < victim.order))
          ) {
            victim = option;
          }
        }
        if (!victim) continue;
        const column = victim.column;
        columns.remove(victim);
        columns.add(candidate, column);
        overflow.splice(overflow.indexOf(candidate), 1);
        overflow.splice(
          search(overflow, (other) => strongerFirst(other, victim) < 0),
          0,
          victim,
        );
        swapped = true;
        break;
      }
    }
  }

  // Step 4: gap fill, strongest first. The source ran a second, weakest-first pass; it can only
  // place an item the first pass rejected under the same state, so it never places anything.
  const coordinates = [...new Set([...starts, ...ends])].sort((a, b) => a - b);
  const indexOf = (time: number): number => search(coordinates, (value) => value < time);
  const tree = new MaxTree(coordinates.slice(0, -1).map((time) => -cap(time)));
  for (const list of columns.lists) {
    for (const rec of list) {
      const from = indexOf(rec.start);
      const to = indexOf(rec.end) - 1;
      if (from <= to) tree.add(from, to, 1);
    }
  }
  for (let placed = true; placed;) {
    placed = false;
    for (const candidate of overflow) {
      const from = indexOf(candidate.start);
      const to = indexOf(candidate.end) - 1;
      if (from <= to && tree.query(from, to) + 1 > 0) continue;
      const limit = cap(candidate.start);
      let column = 0;
      while (column < limit && columns.overlapping(column, candidate, 1).length > 0) column++;
      if (column >= limit) continue;
      columns.add(candidate, column);
      if (from <= to) tree.add(from, to, 1);
      overflow.splice(overflow.indexOf(candidate), 1);
      placed = true;
      break;
    }
  }

  // Step 7: column count per card and per overlapping group of placed cards.
  // Cards are listed by start, then column (the golden files' order; also the lane's DOM order).
  const placed = columns.lists.flat().sort((a, b) => a.start - b.start || a.column - b.column || a.order - b.order);
  const placedStarts = [...new Set(placed.map((rec) => rec.start))].sort((a, b) => a - b);
  const byStart = [...placed].sort((a, b) => a.start - b.start);
  const byEnd = [...placed].sort((a, b) => a.end - b.end);
  const active = new Array<number>(columns.lists.length).fill(0);
  const slots: number[] = [];
  let startPointer = 0;
  let endPointer = 0;
  for (const time of placedStarts) {
    while (startPointer < byStart.length && (byStart[startPointer] as Rec<TItem>).start <= time) {
      const rec = byStart[startPointer++] as Rec<TItem>;
      if (rec.end > rec.start) active[rec.column] = (active[rec.column] as number) + 1;
    }
    while (endPointer < byEnd.length && (byEnd[endPointer] as Rec<TItem>).end <= time) {
      const rec = byEnd[endPointer++] as Rec<TItem>;
      if (rec.end > rec.start) active[rec.column] = (active[rec.column] as number) - 1;
    }
    let highest = active.length - 1;
    while (highest >= 0 && active[highest] === 0) highest--;
    slots.push(Math.min(cap(time), Math.max(1, highest + 1)));
  }
  const maxSlots = rangeMax(slots);
  const initial = new Map<Rec<TItem>, number>();
  for (const rec of placed) {
    const from = search(placedStarts, (time) => time < rec.start);
    const to = Math.max(from, search(placedStarts, (time) => time < rec.end) - 1);
    initial.set(rec, maxSlots(from, to));
  }
  const groupColumns = new Map<Rec<TItem>, number>();
  for (const group of components(placed)) {
    const count = Math.max(...group.map((rec) => initial.get(rec) ?? 1));
    for (const rec of group) groupColumns.set(rec, count);
  }

  // Step 5: geometry.
  const pixels = (duration: number): number => (duration / MINUTE) * (hourHeight / 60);
  const cards: PlacedCard<TItem>[] = placed.map((rec) => ({
    item: rec.item,
    column: rec.column,
    columns: groupColumns.get(rec) ?? 1,
    top: ((rec.start - rangeStart) / MINUTE) * (hourHeight / 60),
    height: Math.max(pixels(Math.max(0, rec.end - rec.start)) - cardGap, minCardHeight),
    start: rec.start,
    end: rec.end,
  }));

  // Step 6: overflow groups. Items are bucketed by local start hour; consecutive buckets merge while
  // they overlap the group and start within `overflowMergeWindow` of its anchor (B-10).
  const buckets = new Map<number, Rec<TItem>[]>();
  for (const rec of overflow) {
    const hour = startOfLocalHour(rec.start);
    const bucket = buckets.get(hour);
    if (bucket) bucket.push(rec);
    else buckets.set(hour, [rec]);
  }
  const groups: { anchor: number; end: number; recs: Rec<TItem>[] }[] = [];
  const sortedBuckets = [...buckets.values()]
    .map((recs) => ({
      anchor: Math.min(...recs.map((rec) => rec.start)),
      end: Math.max(...recs.map((rec) => rec.end)),
      recs,
    }))
    .sort((a, b) => a.anchor - b.anchor);
  for (const bucket of sortedBuckets) {
    const previous = groups[groups.length - 1];
    if (previous && previous.end > bucket.anchor && bucket.anchor - previous.anchor <= overflowMergeWindow) {
      previous.recs.push(...bucket.recs);
      previous.end = Math.max(previous.end, bucket.end);
    } else {
      groups.push({ ...bucket, recs: [...bucket.recs] });
    }
  }
  const overflowGroups: OverflowGroup<TItem>[] = groups.map((group) => ({
    id: String(group.anchor),
    anchor: group.anchor,
    items: group.recs.sort(strongerFirst).map((rec) => rec.item),
  }));

  return {
    cards,
    overflow: overflowGroups,
    rangeStart,
    rangeEnd,
    height: Math.max((rangeEnd - rangeStart) / HOUR, 1) * hourHeight,
  };
}
