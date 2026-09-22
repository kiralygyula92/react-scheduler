// SPDX-License-Identifier: MIT
// Public types of the core (Feature Dossier 04 §2–§3). Names and shapes follow 04 exactly.

/** Date, epoch milliseconds, or ISO-8601 string (a string without offset is local wall-clock time). */
export type DateInput = Date | number | string;
/** 24-hour wall-clock time "HH:mm". */
export type WallClock = `${number}:${number}`;

export type ViewKind = 'list' | 'timeline';
/** Sign of a shift offset relative to the current shift. */
export type ShiftRole = 'previous' | 'current' | 'next';
export type PresetName = 'default' | 'classic';
export type ColorScheme = 'light' | 'dark' | 'system';
export type Density = 'standard' | 'comfortable' | 'dense';
export type CardVariant = 'default' | 'alert' | 'muted';
export type LandingTarget = 'shiftStart' | 'date' | 'dateNearBottom' | 'none';
export type SortDirection = 'asc' | 'desc';

export interface LevelDefinition<K extends string = string> {
  key: K;
  /** Lower = stronger. Default: index in the `levels` array. */
  rank?: number;
  /** Accent colour (any CSS colour). Default: token `--rs-level-<key>`. */
  color?: string;
  /** Pill text/icon colour. Default: token `--rs-level-<key>-on`. */
  onColor?: string;
  /** Card look. Default 'default'. */
  variant?: CardVariant;
  /** Items of this level pin into the pinned strip once scrolled past, and count as carried over. */
  pinOnPass?: boolean;
  /** Label override. Default: `localization.levels[key]`, then `key`. */
  label?: string;
}

export interface TagDefinition<K extends string = string> {
  key: K;
  /** Default: `localization.tags[key]`, then `key`. */
  label?: string;
  /** Default: token `--rs-color-pill-neutral`. */
  background?: string;
  /** Default: token `--rs-color-on-pill-dark`. */
  color?: string;
}

export type ClassicLevelKey =
  'critical' | 'watch' | 'monitoring' | 'capacityWatch' | 'ready' | 'normal' | 'onTarget' | 'routine' | 'resolved';

export type ClassicTagKey = 'impactsNextShift' | 'carriedOver';

export interface SchedulerItem<TData = unknown, TLevel extends string = string, TTag extends string = string> {
  /** Stable, unique, never mutated by the library. */
  id: string;
  start: DateInput;
  /** Default: start + `defaultDuration`. An end before the start counts as zero duration. */
  end?: DateInput;
  level: TLevel;
  title: string;
  description?: string;
  /** Bottom line of timeline cards. */
  suggestion?: string;
  tags?: readonly TTag[];
  /** Shown as a reference pill: "{localization.referenceLabel} {reference}". */
  reference?: string;
  /** Time label "{timeLabel.observed} {observedLabel}". Takes precedence over `since`. */
  observedLabel?: string;
  /** Time label "{timeLabel.since} {formatters.sinceTimestamp(since)}". */
  since?: DateInput;
  /** Replaces the computed time label entirely. */
  timeLabel?: string;
  /** Always in the pinned strip while its shift is rendered. */
  pinned?: boolean;
  /** Overrides the level's `pinOnPass` for this item. */
  pinnable?: boolean;
  /** Not activatable: rendered with aria-disabled, ignored by activation handlers. */
  disabled?: boolean;
  /** Opaque payload for detail rendering. */
  data?: TData;
}

/** Helpers to infer item types from level/tag definitions. */
export type ItemOf<
  L extends readonly LevelDefinition[],
  T extends readonly TagDefinition[] = readonly TagDefinition[],
  D = unknown,
> = SchedulerItem<D, L[number]['key'], T[number]['key']>;

export interface ShiftPatternEntry {
  key: string;
  /** Start wall-clock time. The entry ends where the next entry (cyclically) starts. */
  start: WallClock;
  label?: string;
}

export interface ShiftOptions {
  /** Regular shifts: length in hours; MUST divide 24. Default 12. */
  durationHours?: number;
  /** Regular shifts: one boundary time. Default '08:00'. */
  anchor?: WallClock;
  /** Regular shifts: keys assigned cyclically from the anchor. Default ['day', 'night']. */
  keys?: readonly string[];
  /** Irregular daily pattern; overrides durationHours/anchor/keys. At least one entry; starts strictly increasing. */
  pattern?: readonly ShiftPatternEntry[];
  /** Shifts rendered before the current one. Default 1. */
  before?: number;
  /** Shifts rendered after the current one. Default 1. */
  after?: number;
}

export interface ShiftWindow {
  /** 0 = current; negative = earlier. */
  offset: number;
  /** Sign of offset. */
  role: ShiftRole;
  key: string;
  label?: string;
  /** Epoch ms at the wall-clock boundaries (DST-safe). */
  start: number;
  end: number;
}

export interface ShiftSegment<TItem> {
  shift: ShiftWindow;
  /** Items whose start is in [shift.start, shift.end), in placement order. */
  items: readonly TItem[];
}

/** Parity input: pre-bucketed segments (drop-in for the source data shape). */
export interface SegmentInput<TItem> {
  role: ShiftRole;
  /** Default: -1 / 0 / 1 from role. */
  offset?: number;
  key?: string;
  start: DateInput;
  end: DateInput;
  items: readonly TItem[];
}

export interface PlacedCard<TItem> {
  item: TItem;
  column: number;
  columns: number;
  /** px from range start */
  top: number;
  /** px */
  height: number;
  /** epoch ms */
  start: number;
  /** epoch ms (resolved) */
  end: number;
}

export interface OverflowGroup<TItem> {
  /** Stable id: String(anchor). */
  id: string;
  /** Earliest start of the group, epoch ms. */
  anchor: number;
  /** Rank, then placement order. */
  items: readonly TItem[];
}

export interface TimelineLayout<TItem> {
  cards: readonly PlacedCard<TItem>[];
  overflow: readonly OverflowGroup<TItem>[];
  rangeStart: number;
  rangeEnd: number;
  /** hours(range) × hourHeight, minimum hourHeight. */
  height: number;
}

export interface TimelineLayoutOptions<TItem> {
  rangeStart: number;
  rangeEnd: number;
  levels: ReadonlyMap<string, { rank: number }>;
  compact: boolean;
  hourHeight: number;
  maxColumns: number;
  maxColumnsCrowded: number;
  maxColumnsCompact: number;
  minCardHeight: number;
  cardGap: number;
  columnPlacement: 'priority' | 'time';
  overflowMergeWindow: number;
  defaultDuration: number;
  compareItems?: (a: TItem, b: TItem) => number;
}

/** Why the header-expanded value changed (Feature Dossier 04 §5.5). */
export type HeaderReason = 'scroll' | 'resize' | 'empty' | 'viewEnter' | 'dataChange';
/** What activated an item (Feature Dossier 04 §5.6). */
export type ActivationSource = 'listCard' | 'timelineCard' | 'pinnedChip' | 'overflowRow' | 'api';
/** Why a detail view or the overflow dialog closed (Feature Dossier 04 §5.6). */
export type CloseReason = 'escape' | 'backdrop' | 'closeButton' | 'itemRemoved' | 'api';
