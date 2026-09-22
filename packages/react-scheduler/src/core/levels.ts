// SPDX-License-Identifier: MIT
import { toMs } from './time';
import type { ClassicLevelKey, ClassicTagKey, LevelDefinition, SchedulerItem, TagDefinition } from './types';

/** The 9 parity levels, strongest first (Feature Dossier 01 §2.2). */
export const classicLevels: readonly LevelDefinition<ClassicLevelKey>[] = Object.freeze([
  { key: 'critical', rank: 0, variant: 'alert', pinOnPass: true },
  { key: 'watch', rank: 1, variant: 'default', pinOnPass: false },
  { key: 'monitoring', rank: 2, variant: 'default', pinOnPass: false },
  { key: 'capacityWatch', rank: 3, variant: 'default', pinOnPass: false },
  { key: 'ready', rank: 4, variant: 'default', pinOnPass: false },
  { key: 'normal', rank: 5, variant: 'default', pinOnPass: false },
  { key: 'onTarget', rank: 6, variant: 'default', pinOnPass: false },
  { key: 'routine', rank: 7, variant: 'default', pinOnPass: false },
  { key: 'resolved', rank: 8, variant: 'muted', pinOnPass: false },
]);

export const classicTags: readonly TagDefinition<ClassicTagKey>[] = Object.freeze([
  { key: 'impactsNextShift' },
  { key: 'carriedOver' },
]);

/** Tag key the library adds to carried-over pinned items. */
export const CARRIED_OVER_TAG = 'carriedOver';

export type ResolvedLevel = LevelDefinition & Required<Pick<LevelDefinition, 'key' | 'rank' | 'variant' | 'pinOnPass'>>;

/** Level definitions keyed by `key`, with `rank` (default: array index), `variant` and `pinOnPass` filled in. */
export function resolveLevels(levels: readonly LevelDefinition[]): ReadonlyMap<string, ResolvedLevel> {
  const resolved = new Map<string, ResolvedLevel>();
  levels.forEach((level, index) => {
    resolved.set(level.key, {
      ...level,
      rank: level.rank ?? index,
      variant: level.variant ?? 'default',
      pinOnPass: level.pinOnPass ?? false,
    });
  });
  return resolved;
}

/** Rank of a level key; unknown keys rank after every known level. */
export function rankOf(levels: ReadonlyMap<string, { rank: number }>, key: string): number {
  return levels.get(key)?.rank ?? Number.MAX_SAFE_INTEGER;
}

/** Placement order: start ascending, then level rank ascending (stronger first), then id. */
export function compareByPlacement(
  levels: ReadonlyMap<string, { rank: number }>,
): (a: SchedulerItem, b: SchedulerItem) => number {
  return (a, b) => {
    const startA = toMs(a.start);
    const startB = toMs(b.start);
    if (startA !== startB) return startA - startB;
    const rankDelta = rankOf(levels, a.level) - rankOf(levels, b.level);
    if (rankDelta !== 0) return rankDelta;
    return a.id.localeCompare(b.id);
  };
}
