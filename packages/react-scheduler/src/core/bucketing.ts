// SPDX-License-Identifier: MIT
// Bucketing and ordering (Feature Dossier 05 F-02). Ids are never changed: the source appended a
// role suffix to previous/next ids and detected carried-over items by substring (B-20).
import { type BundlerProcess, devWarnOnce } from './env';
import { classicLevels, compareByPlacement, resolveLevels } from './levels';
import { toMs } from './time';
import type { LevelDefinition, SchedulerItem, SegmentInput, ShiftRole, ShiftSegment, ShiftWindow } from './types';

// Development-only branches read the bundler-replaced NODE_ENV behind a typeof guard (env.ts).
declare const process: BundlerProcess;

export interface BucketOptions<TItem> {
  /** Replaces the placement order (start → rank → id). */
  compareItems?: (a: TItem, b: TItem) => number;
  levels?: readonly LevelDefinition[];
  /** Duration of items without `end`, in ms. Bucketing uses starts only; accepted for API symmetry. */
  defaultDuration?: number;
}

function comparator<TItem extends SchedulerItem>(options: BucketOptions<TItem>): (a: TItem, b: TItem) => number {
  return options.compareItems ?? compareByPlacement(resolveLevels(options.levels ?? classicLevels));
}

/**
 * Puts each item into the window with `start ≤ item.start < end`. Items outside every window are
 * not shown; items with an invalid start are dropped; for duplicate ids the first occurrence wins.
 *
 * @param items The items to place, in any order.
 * @param windows The rendered shifts, in order.
 * @param options How to order the items inside a shift, and how long an item without an end lasts.
 */
export function bucketItems<TItem extends SchedulerItem>(
  items: readonly TItem[],
  windows: readonly ShiftWindow[],
  options: BucketOptions<TItem> = {},
): readonly ShiftSegment<TItem>[] {
  const buckets = windows.map(() => [] as TItem[]);
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        devWarnOnce(`duplicate:${item.id}`, `Duplicate item id "${item.id}"; the first occurrence is used.`);
      }
      continue;
    }
    seen.add(item.id);
    const start = toMs(item.start);
    if (Number.isNaN(start)) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        devWarnOnce(`invalid-start:${item.id}`, `Item "${item.id}" has an invalid start and is not shown.`);
      }
      continue;
    }
    const index = windows.findIndex((window) => window.start <= start && start < window.end);
    if (index >= 0) buckets[index]?.push(item);
  }
  const compare = comparator(options);
  return windows.map((shift, index) => ({ shift, items: (buckets[index] ?? []).sort(compare) }));
}

const ROLE_OFFSET: Record<ShiftRole, number> = { previous: -1, current: 0, next: 1 };

/** Pre-bucketed parity input (`segments` prop): buckets are kept as given, items are sorted. */
export function segmentsFromInput<TItem extends SchedulerItem>(
  segments: readonly SegmentInput<TItem>[],
  options: BucketOptions<TItem> = {},
): readonly ShiftSegment<TItem>[] {
  const compare = comparator(options);
  return segments
    .map((segment) => ({
      shift: {
        offset: segment.offset ?? ROLE_OFFSET[segment.role],
        role: segment.role,
        key: segment.key ?? '',
        start: toMs(segment.start),
        end: toMs(segment.end),
      },
      items: [...segment.items].sort(compare),
    }))
    .sort((a, b) => a.shift.offset - b.shift.offset);
}
