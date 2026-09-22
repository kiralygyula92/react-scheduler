// SPDX-License-Identifier: MIT
// Pinning rules (Feature Dossier 05 F-07) without the DOM: which items can pin, the pin rule with
// epsilon and hysteresis, the pinned strip's content and change diffs.
import { CARRIED_OVER_TAG } from './levels';
import type { ResolvedPinRule } from './options';
import type { LevelDefinition, SchedulerItem, ShiftSegment } from './types';

/** `item.pinned` always pins; otherwise `item.pinnable`, then the level's `pinOnPass`. */
export function isPinnable(item: SchedulerItem, level: LevelDefinition | undefined): boolean {
  return item.pinned === true || (item.pinnable ?? level?.pinOnPass ?? false);
}

/**
 * Next pinned state of an item from its sentinel position. An unpinned item pins when
 * `sentinelTop ≤ line − epsilon`; a pinned item unpins when `sentinelTop > line + hysteresis − epsilon`.
 */
export function nextPinned(
  pinned: boolean,
  sentinelTop: number,
  line: number,
  rule: Pick<ResolvedPinRule, 'epsilon' | 'hysteresis'>,
): boolean {
  return pinned ? sentinelTop <= line + rule.hysteresis - rule.epsilon : sentinelTop <= line - rule.epsilon;
}

/** Tags of a carried-over chip: the carried-over tag is appended; existing tags are kept (B-25). */
export function withCarriedOverTag(tags: readonly string[] | undefined): readonly string[] {
  const list = tags ?? [];
  return list.includes(CARRIED_OVER_TAG) ? list : [...list, CARRIED_OVER_TAG];
}

export interface PinnedEntry<TItem> {
  item: TItem;
  /** From a shift before the current one. */
  carriedOver: boolean;
  /** Tags to show on the chip. */
  tags: readonly string[];
}

/**
 * Content of the pinned strip: items pinned by position plus items with `pinned: true`, from the
 * rendered segments, ordered by `compare`.
 */
export function pinnedEntries<TItem extends SchedulerItem>(
  segments: readonly ShiftSegment<TItem>[],
  pinnedIds: ReadonlySet<string>,
  compare: (a: TItem, b: TItem) => number,
): PinnedEntry<TItem>[] {
  const entries: PinnedEntry<TItem>[] = [];
  for (const segment of segments) {
    const carriedOver = segment.shift.offset < 0;
    for (const item of segment.items) {
      if (item.pinned !== true && !pinnedIds.has(item.id)) continue;
      entries.push({ item, carriedOver, tags: carriedOver ? withCarriedOverTag(item.tags) : (item.tags ?? []) });
    }
  }
  return entries.sort((a, b) => compare(a.item, b.item));
}

/** Ids added and removed between two pinned-id lists. */
export function diffPinned(
  previous: readonly string[],
  next: readonly string[],
): { added: readonly string[]; removed: readonly string[] } {
  const before = new Set(previous);
  const after = new Set(next);
  return { added: next.filter((id) => !before.has(id)), removed: previous.filter((id) => !after.has(id)) };
}
