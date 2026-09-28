// SPDX-License-Identifier: MIT
// Public types of the core (Feature Dossier 04 §2–§3). Names and shapes follow 04 exactly.

/** Date, epoch milliseconds, or ISO-8601 string (a string without offset is local wall-clock time). */
export type DateInput = Date | number | string;
/** 24-hour wall-clock time "HH:mm". */
export type WallClock = `${number}:${number}`;

/** The two views: a scrollable list of cards, or a time axis with placed cards. */
export type ViewKind = 'list' | 'timeline';
/** Sign of a shift offset relative to the current shift. */
export type ShiftRole = 'previous' | 'current' | 'next';
/** The bundled looks: the library's own, or the classic one it reproduces. */
export type PresetName = 'default' | 'classic';
/** Which color scheme the component renders in; `'system'` follows the reader's setting. */
export type ColorScheme = 'light' | 'dark' | 'system';
/** The spacing scale of the rendered parts. */
export type Density = 'standard' | 'comfortable' | 'dense';
/** How a card is drawn: normally, as an alert, or muted. */
export type CardVariant = 'default' | 'alert' | 'muted';
/** Where a view lands: on the shift's start, on the date, just above it, or nowhere. */
export type LandingTarget = 'shiftStart' | 'date' | 'dateNearBottom' | 'none';
/** Sort direction of the overflow table. */
export type SortDirection = 'asc' | 'desc';

/**
 * One rank of the level scale: what it is called, how strong it is, and how its items look.
 *
 * @category Levels and tags
 * @since 1.0.0
 */
export interface LevelDefinition<K extends string = string> {
  /** The key items refer to this level by. */
  key: K;
  /**
   * Strength of the level; lower is stronger.
   *
   * @defaultValue the index in the `levels` array
   */
  rank?: number;
  /**
   * Accent color, as any CSS color.
   *
   * @defaultValue the token `--rs-level-<key>`
   */
  color?: string;
  /**
   * Color of the text and icon on that accent.
   *
   * @defaultValue the token `--rs-level-<key>-on`
   */
  onColor?: string;
  /**
   * How cards of this level are drawn.
   *
   * @defaultValue 'default'
   */
  variant?: CardVariant;
  /**
   * Items of this level pin into the pinned strip once they scroll past, and count as carried over.
   *
   * @defaultValue false
   */
  pinOnPass?: boolean;
  /**
   * The label shown on the level pill.
   *
   * @defaultValue `localization.levels[key]`, then the key itself
   */
  label?: string;
}

/**
 * One tag an item can carry, with its label and colors.
 *
 * @category Levels and tags
 * @since 1.0.0
 */
export interface TagDefinition<K extends string = string> {
  /** The key items refer to this tag by. */
  key: K;
  /**
   * The label shown on the tag pill.
   *
   * @defaultValue `localization.tags[key]`, then the key itself
   */
  label?: string;
  /**
   * Background of the pill.
   *
   * @defaultValue the token `--rs-color-pill-neutral`
   */
  background?: string;
  /**
   * Text color of the pill.
   *
   * @defaultValue the token `--rs-color-on-pill-dark`
   */
  color?: string;
}

/**
 * The keys of the classic level scale.
 *
 * @category Levels and tags
 * @since 1.0.0
 */
export type ClassicLevelKey =
  'critical' | 'watch' | 'monitoring' | 'capacityWatch' | 'ready' | 'normal' | 'onTarget' | 'routine' | 'resolved';

/**
 * The keys of the classic tag set.
 *
 * @category Levels and tags
 * @since 1.0.0
 */
export type ClassicTagKey = 'impactsNextShift' | 'carriedOver';

/**
 * One thing on the schedule. Only `id`, `start`, `level` and `title` are required; everything else
 * refines how the card reads.
 *
 * @category Data
 * @since 1.0.0
 */
export interface SchedulerItem<TData = unknown, TLevel extends string = string, TTag extends string = string> {
  /** Stable, unique, never mutated by the library. */
  id: string;
  /** When it starts. */
  start: DateInput;
  /**
   * When it ends. An end before the start counts as zero duration.
   *
   * @defaultValue `start` plus `defaultDuration`
   */
  end?: DateInput;
  /** The `key` of one of the levels in the scale. */
  level: TLevel;
  /** The card's first line. */
  title: string;
  /** The card's second line. */
  description?: string;
  /** Bottom line of timeline cards. */
  suggestion?: string;
  /** Keys of the tags this item carries. */
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

/**
 * One shift of an irregular daily pattern: when it starts and what it is called.
 *
 * @category Shifts
 * @since 1.0.0
 */
export interface ShiftPatternEntry {
  /** The key of the shift, from the pattern or from the regular keys. */
  key: string;
  /** Start wall-clock time. The entry ends where the next entry (cyclically) starts. */
  start: WallClock;
  /** A label of your own for the shift, instead of the generated one. */
  label?: string;
}

/**
 * The shift pattern of a day. Either regular shifts of one length, or an irregular `pattern` of
 * named shifts.
 *
 * @category Shifts
 * @since 1.0.0
 */
export interface ShiftOptions {
  /**
   * Length of a regular shift, in hours. It has to divide 24.
   *
   * @defaultValue 12
   * @min 1
   * @max 24
   * @step 1
   * @category Shifts
   */
  durationHours?: number;
  /**
   * The wall-clock time one regular shift starts at; the others follow from it.
   *
   * @defaultValue '08:00'
   * @category Shifts
   */
  anchor?: WallClock;
  /**
   * Keys for the regular shifts, assigned in turn from the anchor.
   *
   * @defaultValue ['day', 'night']
   * @category Shifts
   */
  keys?: readonly string[];
  /**
   * An irregular daily pattern, as start times in order. It replaces `durationHours`, `anchor` and
   * `keys`.
   *
   * @category Shifts
   */
  pattern?: readonly ShiftPatternEntry[];
  /**
   * How many shifts are rendered before the current one.
   *
   * @defaultValue 1
   * @min 0
   * @max 10
   * @step 1
   * @category Shifts
   */
  before?: number;
  /**
   * How many shifts are rendered after the current one.
   *
   * @defaultValue 1
   * @min 0
   * @max 10
   * @step 1
   * @category Shifts
   */
  after?: number;
}

/**
 * One rendered shift: its offset from the current one, its key and its boundaries.
 *
 * @category Shifts
 * @since 1.0.0
 */
export interface ShiftWindow {
  /** 0 = current; negative = earlier. */
  offset: number;
  /** Sign of offset. */
  role: ShiftRole;
  /** The key of the shift, from the pattern or from the regular keys. */
  key: string;
  /** A label of your own for the shift, instead of the generated one. */
  label?: string;
  /** Epoch ms at the wall-clock boundaries (DST-safe). */
  start: number;
  /** The end of the shift, in epoch milliseconds; exclusive. */
  end: number;
}

/**
 * A shift with the items that fall into it, in the order they are rendered.
 *
 * @category Shifts
 * @since 1.0.0
 */
export interface ShiftSegment<TItem> {
  /** The shift this segment renders. */
  shift: ShiftWindow;
  /** Items whose start is in [shift.start, shift.end), in placement order. */
  items: readonly TItem[];
}

/** Parity input: pre-bucketed segments (drop-in for the source data shape). */
export interface SegmentInput<TItem> {
  /** Whether the segment is before, at or after the current shift. */
  role: ShiftRole;
  /** Default: -1 / 0 / 1 from role. */
  offset?: number;
  /** A key of your own for the shift; the default comes from the role. */
  key?: string;
  /** When the segment starts. */
  start: DateInput;
  /** When the segment ends; exclusive. */
  end: DateInput;
  /** The items of this segment; they are sorted for you. */
  items: readonly TItem[];
}

/**
 * One card placed on the timeline: its item, its column and its geometry.
 *
 * @category Timeline
 * @since 1.0.0
 */
export interface PlacedCard<TItem> {
  /** The item this card stands for. */
  item: TItem;
  /** The column it takes, counted from the start edge. */
  column: number;
  /** How many columns its overlap group is sharing the lane in. */
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

/**
 * The items a "More" chip stands for, with the range they cover.
 *
 * @category Overflow
 * @since 1.0.0
 */
export interface OverflowGroup<TItem> {
  /** Stable id: String(anchor). */
  id: string;
  /** Earliest start of the group, epoch ms. */
  anchor: number;
  /** Rank, then placement order. */
  items: readonly TItem[];
}

/**
 * The computed timeline: every placed card, every overflow group and the geometry around them.
 *
 * @category Timeline
 * @since 1.0.0
 */
export interface TimelineLayout<TItem> {
  /** Every placed card, in placement order. */
  cards: readonly PlacedCard<TItem>[];
  /** The groups the placement could not fit, each behind a "More" chip. */
  overflow: readonly OverflowGroup<TItem>[];
  /** The first moment the grid covers, in epoch milliseconds. */
  rangeStart: number;
  /** The last moment the grid covers, in epoch milliseconds. */
  rangeEnd: number;
  /** hours(range) × hourHeight, minimum hourHeight. */
  height: number;
}

/**
 * What the layout engine needs besides the items: the hour size, the column caps and the merge window.
 *
 * @category Timeline
 * @since 1.0.0
 */
export interface TimelineLayoutOptions<TItem> {
  /** The first moment the grid covers, in epoch milliseconds. */
  rangeStart: number;
  /** The last moment the grid covers, in epoch milliseconds. */
  rangeEnd: number;
  /** The resolved level scale, which gives each item its rank. */
  levels: ReadonlyMap<string, { rank: number }>;
  /** Whether the compact caps apply instead of the usual ones. */
  compact: boolean;
  /** The height of one hour, in pixels. */
  hourHeight: number;
  /** How many columns overlapping items may share the lane in. */
  maxColumns: number;
  /** The cap that applies where the day is crowded. */
  maxColumnsCrowded: number;
  /** The cap that applies in compact mode. */
  maxColumnsCompact: number;
  /** The shortest a card may be drawn, in pixels. */
  minCardHeight: number;
  /** The gap between two columns, in pixels. */
  cardGap: number;
  /**
   * Whether a card keeps its column until the end of what is drawn and a group has a column for every
   * card, so no two cards overlap. Off, a short card can run under the next one.
   */
  keepCardsApart?: boolean;
  /** Which column an item takes when several overlap. */
  columnPlacement: 'priority' | 'time';
  /** How far apart, in milliseconds, two crowded groups may be and still merge. */
  overflowMergeWindow: number;
  /** How long an item without an end lasts, in milliseconds. */
  defaultDuration: number;
  /** The order the placement sequence follows. */
  compareItems?: (a: TItem, b: TItem) => number;
}

/** Why the header-expanded value changed (Feature Dossier 04 §5.5). */
export type HeaderReason = 'scroll' | 'resize' | 'empty' | 'viewEnter' | 'dataChange';
/** What activated an item (Feature Dossier 04 §5.6). */
export type ActivationSource = 'listCard' | 'timelineCard' | 'pinnedChip' | 'overflowRow' | 'api';
/** Why a detail view or the overflow dialog closed (Feature Dossier 04 §5.6). */
export type CloseReason = 'escape' | 'backdrop' | 'closeButton' | 'itemRemoved' | 'api';
