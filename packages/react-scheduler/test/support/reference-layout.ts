// Test-only oracle: a direct, deliberately naive transcription of Feature Dossier 01 §T.5 with the
// 05 F-06 options. It reproduces every golden file; the optimized engine must equal it on any input.
import { rankOf } from '../../src/core/levels';
import { resolveEnd, startOfLocalHour, toMs } from '../../src/core/time';
import type { SchedulerItem, TimelineLayoutOptions } from '../../src/core/types';

interface Rec {
  id: string;
  item: SchedulerItem;
  s: number;
  e: number;
  rank: number;
  p: number;
}

export interface ReferenceLayout {
  placed: { id: string; column: number; columns: number; top: number; height: number }[];
  overflow: { anchor: number; ids: string[] }[];
}

const overlap = (a: Rec, b: Rec): boolean => a.s < b.e && b.s < a.e;

export function referenceLayout(
  items: readonly SchedulerItem[],
  options: TimelineLayoutOptions<SchedulerItem>,
): ReferenceLayout {
  const o = options;
  const recs: Rec[] = items
    .filter((item) => !Number.isNaN(toMs(item.start)))
    .map((item) => {
      const s = toMs(item.start);
      return {
        id: item.id,
        item,
        s,
        e: resolveEnd(s, item.end, o.defaultDuration),
        rank: rankOf(o.levels, item.level),
        p: 0,
      };
    });
  recs.sort(
    o.compareItems
      ? (a, b) => o.compareItems!(a.item, b.item)
      : (a, b) => a.s - b.s || a.rank - b.rank || a.id.localeCompare(b.id),
  );
  recs.forEach((rec, index) => (rec.p = index));

  const count = (t: number): number => recs.filter((x) => x.s <= t && t < x.e).length;
  const cap = (t: number): number =>
    count(t) > o.maxColumns ? (o.compact ? o.maxColumnsCompact : o.maxColumnsCrowded) : o.maxColumns;
  const stronger = (a: Rec, b: Rec): number => a.rank - b.rank || a.p - b.p;

  const components = (list: readonly Rec[]): Rec[][] => {
    const parent = list.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) if (overlap(list[i]!, list[j]!)) parent[find(i)] = find(j);
    const groups = new Map<number, Rec[]>();
    list.forEach((rec, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), rec]));
    return [...groups.values()].sort(
      (a, b) =>
        Math.min(...a.map((x) => x.s)) - Math.min(...b.map((x) => x.s)) ||
        Math.min(...a.map((x) => x.p)) - Math.min(...b.map((x) => x.p)),
    );
  };

  // 1–2. Placement sequence, greedy columns (column ends reset per component).
  const column = new Map<Rec, number>();
  const overflow: Rec[] = [];
  const greedy = (sequence: readonly Rec[]): void => {
    const ends: number[] = [];
    for (const x of sequence) {
      let k = ends.findIndex((end) => end <= x.s);
      if (k < 0 && ends.length < cap(x.s)) k = ends.push(0) - 1;
      if (k < 0) {
        overflow.push(x);
        continue;
      }
      ends[k] = x.e;
      column.set(x, k);
    }
  };
  if (o.columnPlacement === 'time') greedy(recs);
  else for (const component of components(recs)) greedy([...component].sort(stronger));
  const placed = (): Rec[] => [...column.keys()];

  // 3. Promotion (priority placement only).
  if (o.columnPlacement !== 'time') {
    for (let changed = true; changed;) {
      changed = false;
      search: for (const x of [...overflow].sort(stronger)) {
        const weaker = placed()
          .filter((w) => w.rank > x.rank)
          .sort((a, b) => b.rank - a.rank || a.p - b.p);
        for (const w of weaker) {
          const k = column.get(w)!;
          if (placed().some((y) => y !== w && column.get(y) === k && overlap(y, x))) continue;
          column.delete(w);
          column.set(x, k);
          overflow.splice(overflow.indexOf(x), 1);
          overflow.push(w);
          changed = true;
          break search;
        }
      }
    }
  }

  // 4. Gap fill: strongest-first, then weakest-first; restart after each placement.
  for (let changed = true; changed;) {
    changed = false;
    const strongFirst = [...overflow].sort(stronger);
    const weakFirst = [...overflow].sort((a, b) => b.rank - a.rank || a.p - b.p);
    search: for (const x of [...strongFirst, ...weakFirst]) {
      for (let k = 0; k < cap(x.s); k++) {
        if (placed().some((y) => column.get(y) === k && overlap(y, x))) continue;
        const bounds = new Set([x.s, x.e]);
        for (const y of recs) {
          if (y.s > x.s && y.s < x.e) bounds.add(y.s);
          if (y.e > x.s && y.e < x.e) bounds.add(y.e);
        }
        const sorted = [...bounds].sort((a, b) => a - b);
        let fits = true;
        for (let i = 0; i + 1 < sorted.length; i++) {
          const mid = (sorted[i]! + sorted[i + 1]!) / 2;
          if (placed().filter((y) => y.s <= mid && mid < y.e).length + 1 > cap(mid)) fits = false;
        }
        if (!fits) continue;
        column.set(x, k);
        overflow.splice(overflow.indexOf(x), 1);
        changed = true;
        break search;
      }
    }
  }

  // 7. Column counts (a card's own start always counts, which matters only for zero-length cards).
  const P = placed().sort((a, b) => a.s - b.s || column.get(a)! - column.get(b)! || a.p - b.p);
  const slots = (t: number): number =>
    Math.min(cap(t), Math.max(1, ...P.filter((y) => y.s <= t && t < y.e).map((y) => column.get(y)! + 1)));
  const initial = new Map(
    P.map((x) => [x, Math.max(slots(x.s), ...P.filter((y) => y.s >= x.s && y.s < x.e).map((y) => slots(y.s)))]),
  );
  const counts = new Map<Rec, number>();
  for (const group of components(P)) {
    const max = Math.max(...group.map((x) => initial.get(x)!));
    for (const x of group) counts.set(x, max);
  }

  // 5. Geometry. 6. Overflow groups.
  const buckets = new Map<number, Rec[]>();
  for (const x of overflow) buckets.set(startOfLocalHour(x.s), [...(buckets.get(startOfLocalHour(x.s)) ?? []), x]);
  const groups: { anchor: number; end: number; recs: Rec[] }[] = [];
  for (const bucket of [...buckets.values()]
    .map((list) => ({ anchor: Math.min(...list.map((x) => x.s)), end: Math.max(...list.map((x) => x.e)), recs: list }))
    .sort((a, b) => a.anchor - b.anchor)) {
    const previous = groups[groups.length - 1];
    if (previous && previous.end > bucket.anchor && bucket.anchor - previous.anchor <= o.overflowMergeWindow) {
      previous.recs.push(...bucket.recs);
      previous.end = Math.max(previous.end, bucket.end);
    } else groups.push({ ...bucket, recs: [...bucket.recs] });
  }

  return {
    placed: P.map((x) => ({
      id: x.id,
      column: column.get(x)!,
      columns: counts.get(x)!,
      top: ((x.s - o.rangeStart) / 60_000) * (o.hourHeight / 60),
      height: Math.max((Math.max(0, x.e - x.s) / 60_000) * (o.hourHeight / 60) - o.cardGap, o.minCardHeight),
    })),
    overflow: groups.map((group) => ({ anchor: group.anchor, ids: group.recs.sort(stronger).map((x) => x.id) })),
  };
}
