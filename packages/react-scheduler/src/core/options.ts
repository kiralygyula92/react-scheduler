// SPDX-License-Identifier: MIT
// Behavior options and their parity defaults (Feature Dossier 04 §5.10). At these defaults every
// feature reduces to the parity behavior of 01.
import { HOUR } from './time';
import type { LandingTarget, SchedulerItem } from './types';

/**
 * The list view's own options: when navigation appears, where a jump lands, and when the header
 * signal fires.
 *
 * @category List
 * @since 1.0.0
 */
export interface ListOptions {
  /**
   * Navigation appears only when some shift holds at least this many items.
   *
   * @defaultValue 5
   * @min 0
   * @max 50
   * @step 1
   * @category List
   */
  navigationThreshold?: number;
  /**
   * Gap, in pixels, between the sticky top and the shift header a jump landed on.
   *
   * @defaultValue 8
   * @min 0
   * @max 200
   * @step 1
   * @category List
   */
  alignOffset?: number;
  /**
   * Extra offset, in pixels, when the jump goes to an earlier shift, so its last items stay in view.
   *
   * @defaultValue 104
   * @min 0
   * @max 400
   * @step 1
   * @category List
   */
  previousJumpExtraOffset?: number;
  /**
   * Tolerance, in pixels, for deciding which shift section the scroller sits in.
   *
   * @defaultValue 8
   * @min 0
   * @max 100
   * @step 1
   * @category List
   */
  segmentEpsilon?: number;
  /**
   * The header signal may fire only when the current shift holds more items than this.
   *
   * @defaultValue 3
   * @min 0
   * @max 50
   * @step 1
   * @category List
   */
  collapseMinItems?: number;
  /**
   * The header signal fires after this many cards of the current shift have scrolled past.
   *
   * @defaultValue 3
   * @min 0
   * @max 50
   * @step 1
   * @category List
   */
  collapseAfterCards?: number;
  /**
   * Hysteresis, in pixels, around the point where the header signal flips back.
   *
   * @defaultValue 32
   * @min 0
   * @max 200
   * @step 1
   * @category List
   */
  collapseMargin?: number;
  /**
   * Scrolling further than this, in pixels, shows the scroll-to-top button.
   *
   * @defaultValue 96
   * @min 0
   * @max 1000
   * @step 1
   * @category List
   */
  scrollTopThreshold?: number;
  /**
   * Where the list lands on first render, on a date change and when the view is entered.
   *
   * @defaultValue { initial: 'shiftStart', onDateChange: 'shiftStart', onViewEnter: 'none' }
   * @category List
   */
  landing?: { initial?: LandingTarget; onDateChange?: LandingTarget; onViewEnter?: LandingTarget };
}

/**
 * The timeline view's own options: the size of an hour, how many columns overlapping items may use,
 * and when they collapse into a "+more" chip.
 *
 * @category Timeline
 * @since 1.0.0
 */
export interface TimelineOptions {
  /**
   * The height of one hour, in pixels. The density scale adjusts the default.
   *
   * @defaultValue 172
   * @min 40
   * @max 400
   * @step 4
   * @category Timeline
   */
  hourHeight?: number;
  /**
   * How many columns overlapping items may spread over.
   *
   * @defaultValue 3
   * @min 1
   * @max 10
   * @step 1
   * @category Timeline
   */
  maxColumns?: number;
  /**
   * The cap once more items overlap than `maxColumns`; the rest go to the "+more" chip.
   *
   * @defaultValue 3
   * @min 1
   * @max 10
   * @step 1
   * @category Timeline
   */
  maxColumnsCrowded?: number;
  /**
   * The crowded cap in the compact layout.
   *
   * @defaultValue 1
   * @min 1
   * @max 10
   * @step 1
   * @category Timeline
   */
  maxColumnsCompact?: number;
  /**
   * The shortest a card may be drawn, in pixels, however short the item is.
   *
   * @defaultValue 80
   * @min 20
   * @max 200
   * @step 4
   * @category Timeline
   */
  minCardHeight?: number;
  /**
   * The gap between two cards, in pixels.
   *
   * @defaultValue 4
   * @min 0
   * @max 24
   * @step 1
   * @category Timeline
   */
  cardGap?: number;
  /**
   * Which column an item takes: by its level (`'priority'`) or by the column that frees up first
   * (`'time'`).
   *
   * @defaultValue 'priority'
   * @category Timeline
   */
  columnPlacement?: 'priority' | 'time';
  /**
   * How far apart, in milliseconds, two crowded groups may be and still merge into one "+more" chip.
   * `Infinity` merges the whole chain.
   *
   * @defaultValue 7200000
   * @min 0
   * @max 21600000
   * @step 900000
   * @category Timeline
   */
  overflowMergeWindow?: number;
  /**
   * How much time, in minutes, landing and navigation leave above the target.
   *
   * @defaultValue 30
   * @min 0
   * @max 240
   * @step 5
   * @category Timeline
   */
  leadMinutes?: number;
  /**
   * How much time, in minutes, a "near bottom" landing leaves below the target.
   *
   * @defaultValue 30
   * @min 0
   * @max 240
   * @step 5
   * @category Timeline
   */
  nearBottomGutterMinutes?: number;
  /**
   * How long, in milliseconds, the timeline waits after the view is entered before it realigns.
   *
   * @defaultValue 280
   * @min 0
   * @max 2000
   * @step 20
   * @category Timeline
   */
  viewEnterRealignDelay?: number;
  /**
   * The hour labels down the axis: short (`"8AM"` in en-US) or the locale's own time format.
   *
   * @defaultValue 'compact'
   * @category Timeline
   */
  hourLabelFormat?: 'compact' | 'locale';
  /**
   * Where the timeline lands on first render, on a date change and when the view is entered.
   *
   * @defaultValue { initial: 'shiftStart', onDateChange: 'dateNearBottom', onViewEnter: 'dateNearBottom' }
   * @category Timeline
   */
  landing?: { initial?: LandingTarget; onDateChange?: LandingTarget; onViewEnter?: LandingTarget };
}

/**
 * When an item counts as pinned in one view: which edge of the scroller it has to pass, and how much
 * movement is ignored around that edge.
 *
 * @category Pinning
 * @since 1.0.0
 */
export interface PinRule {
  /**
   * The edge an item pins against.
   *
   * @category Pinning
   */
  edge?: 'top' | 'bottom';
  /**
   * Tolerance, in pixels, for reaching the edge.
   *
   * @min 0
   * @max 50
   * @step 1
   * @category Pinning
   */
  epsilon?: number;
  /**
   * How far back, in pixels, an item has to travel before it unpins again.
   *
   * @min 0
   * @max 200
   * @step 1
   * @category Pinning
   */
  hysteresis?: number;
}

/**
 * Where items pin in each view, and in which order the pinned strip lists them.
 *
 * @category Pinning
 * @since 1.0.0
 */
export interface PinningOptions {
  /**
   * The rule the list view pins by.
   *
   * @defaultValue { edge: 'top', epsilon: 2, hysteresis: 24 }
   * @category Pinning
   */
  list?: PinRule;
  /**
   * The rule the timeline view pins by.
   *
   * @defaultValue { edge: 'bottom', epsilon: 0, hysteresis: 0 }
   * @category Pinning
   */
  timeline?: PinRule;
  /**
   * Orders the pinned strip. By default it follows the order the items pinned in.
   *
   * @category Pinning
   */
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
