// SPDX-License-Identifier: MIT
// Behavior options and their parity defaults (Feature Dossier 04 §5.10). At these defaults every
// feature reduces to the parity behavior of 01.
import { HOUR } from './time';
import type { LandingTarget, SchedulerItem } from './types';

export interface ListOptions {
  /** Navigation shows only if some shift has ≥ N items. Default 5. */
  navigationThreshold?: number;
  /** Gap between the sticky top and a landed shift header. Default 8. */
  alignOffset?: number;
  /** Extra offset when jumping to an earlier shift. Default 104. */
  previousJumpExtraOffset?: number;
  /** Default 8. */
  segmentEpsilon?: number;
  /** The header may collapse only if the current shift has more items than this. Default 3. */
  collapseMinItems?: number;
  /** Collapse after the Nth card of the current shift. Default 3. */
  collapseAfterCards?: number;
  /** Default 32. */
  collapseMargin?: number;
  /** Default 96. */
  scrollTopThreshold?: number;
  landing?: { initial?: LandingTarget; onDateChange?: LandingTarget; onViewEnter?: LandingTarget };
}

export interface TimelineOptions {
  /** Default 172 (density may change the default). */
  hourHeight?: number;
  /** Default 3. */
  maxColumns?: number;
  /** Cap when more than maxColumns items overlap. Default 3. */
  maxColumnsCrowded?: number;
  /** Crowded cap in compact mode. Default 1. */
  maxColumnsCompact?: number;
  /** Default 80. */
  minCardHeight?: number;
  /** Default 4. */
  cardGap?: number;
  /** Default 'priority'. */
  columnPlacement?: 'priority' | 'time';
  /** Default 7 200 000 (2 h). `Infinity` reproduces the source's chain merge (B-10). */
  overflowMergeWindow?: number;
  /** Landing and navigation leave this much time above the target. Default 30. */
  leadMinutes?: number;
  /** Default 30. */
  nearBottomGutterMinutes?: number;
  /** ms. Default 280. */
  viewEnterRealignDelay?: number;
  /** Default 'compact' ("8AM" in en-US). */
  hourLabelFormat?: 'compact' | 'locale';
  landing?: { initial?: LandingTarget; onDateChange?: LandingTarget; onViewEnter?: LandingTarget };
}

export interface PinRule {
  edge?: 'top' | 'bottom';
  epsilon?: number;
  hysteresis?: number;
}

export interface PinningOptions {
  /** Default { edge: 'top', epsilon: 2, hysteresis: 24 }. */
  list?: PinRule;
  /** Default { edge: 'bottom', epsilon: 0, hysteresis: 0 }. */
  timeline?: PinRule;
  /** Pinned-strip order. Default: placement order. */
  compare?: (a: SchedulerItem, b: SchedulerItem) => number;
}

type Landing = Required<NonNullable<ListOptions['landing']>>;
export type ResolvedListOptions = Required<Omit<ListOptions, 'landing'>> & { landing: Landing };
export type ResolvedTimelineOptions = Required<Omit<TimelineOptions, 'landing'>> & { landing: Landing };
export type ResolvedPinRule = Required<PinRule>;

export const listDefaults: ResolvedListOptions = {
  navigationThreshold: 5,
  alignOffset: 8,
  previousJumpExtraOffset: 104,
  segmentEpsilon: 8,
  collapseMinItems: 3,
  collapseAfterCards: 3,
  collapseMargin: 32,
  scrollTopThreshold: 96,
  landing: { initial: 'shiftStart', onDateChange: 'shiftStart', onViewEnter: 'none' },
};

export const timelineDefaults: ResolvedTimelineOptions = {
  hourHeight: 172,
  maxColumns: 3,
  maxColumnsCrowded: 3,
  maxColumnsCompact: 1,
  minCardHeight: 80,
  cardGap: 4,
  columnPlacement: 'priority',
  overflowMergeWindow: 2 * HOUR,
  leadMinutes: 30,
  nearBottomGutterMinutes: 30,
  viewEnterRealignDelay: 280,
  hourLabelFormat: 'compact',
  landing: { initial: 'shiftStart', onDateChange: 'dateNearBottom', onViewEnter: 'dateNearBottom' },
};

export const pinDefaults: { list: ResolvedPinRule; timeline: ResolvedPinRule } = {
  list: { edge: 'top', epsilon: 2, hysteresis: 24 },
  timeline: { edge: 'bottom', epsilon: 0, hysteresis: 0 },
};

/** Removes `undefined` values so they do not override defaults when spread. */
function defined<T extends object>(value: T | undefined): Partial<T> {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function resolveListOptions(options?: ListOptions): ResolvedListOptions {
  return { ...listDefaults, ...defined(options), landing: { ...listDefaults.landing, ...defined(options?.landing) } };
}

export function resolveTimelineOptions(options?: TimelineOptions): ResolvedTimelineOptions {
  return {
    ...timelineDefaults,
    ...defined(options),
    landing: { ...timelineDefaults.landing, ...defined(options?.landing) },
  };
}

export function resolvePinRule(view: 'list' | 'timeline', rule?: PinRule): ResolvedPinRule {
  return { ...pinDefaults[view], ...defined(rule) };
}
