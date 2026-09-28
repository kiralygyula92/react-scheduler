// SPDX-License-Identifier: MIT
// The scheduler controller (docs pack 09 §4.3 level 6; Feature Dossier 05 F-22, F-25, F-27): the
// shared state of both views, the model derived from options and state, and the actions. It knows
// nothing about React or the DOM: the view layer reports measurements (widths, scroll facts, pinned
// ids) and performs scrolling; the controller decides and notifies.
//
// Order for one action (F-25): middleware → default behavior → state callbacks (`onXChange`) →
// domain events. Controlled values (`x` given) are never written; uncontrolled ones live in the store.
import { bucketItems, segmentsFromInput } from './bucketing';
import { type BundlerProcess, devWarnOnce } from './env';
import { shallowEqual, stabilizer } from './equal';
import { createFormatters, type SchedulerFormatters } from './format';
import { computeTimelineLayout } from './layout';
import { classicLevels, classicTags, compareByPlacement, resolveLevels, type ResolvedLevel } from './levels';
import { type DeepPartial, mergeLocalization, type SchedulerLocalization } from './localization';
import { type Middleware, runMiddleware } from './middleware';
import { bottomNavState, carriedOverCount, navigationAllowed, type NavState, topNavState } from './navigation';
import { nowVisible } from './now';
import {
  type ListOptions,
  type PinningOptions,
  type ResolvedListOptions,
  type ResolvedPinRule,
  type ResolvedTimelineOptions,
  resolveListOptions,
  resolvePinRule,
  resolveTimelineOptions,
  type TimelineOptions,
} from './options';
import type { SortableColumn } from './overflow';
import { diffPinned, type PinnedEntry, pinnedEntries } from './pinning';
import { getShiftWindows } from './shifts';
import { createStore } from './store';
import { timelineGeometry, type TimelineGeometry } from './timeline';
import { toMs } from './time';
import type {
  ActivationSource,
  CloseReason,
  DateInput,
  Density,
  HeaderReason,
  LevelDefinition,
  OverflowGroup,
  SchedulerItem,
  SegmentInput,
  ShiftOptions,
  ShiftSegment,
  ShiftWindow,
  SortDirection,
  TagDefinition,
  TimelineLayout,
  ViewKind,
} from './types';
import { enUS } from '../locales/en';

// Development-only branches read the bundler-replaced NODE_ENV behind a typeof guard (env.ts).
declare const process: BundlerProcess;

/**
 * Which column the overflow table is sorted by, and in which direction.
 *
 * @category Overflow
 * @since 1.0.0
 */
export interface OverflowSort {
  /** The id of the column being sorted by. */
  column: string;
  /** Ascending or descending. */
  direction: SortDirection;
}

/**
 * Which navigation button an event came from.
 *
 * @category Navigation
 * @since 1.0.0
 */
export type NavPosition = 'top' | 'bottom';

/**
 * Interaction middleware (Feature Dossier 04 §5.11). `TEvent` / `TKeyEvent` are the event types of
 * the view layer (React's synthetic events in the main entry).
 */
export interface SchedulerHandlers<TItem, TEvent = unknown, TKeyEvent = TEvent> {
  /** Runs before an item opens; not calling `next` leaves it closed. */
  onItemActivate?: Middleware<{ item: TItem; source: ActivationSource; event?: TEvent | undefined }> | undefined;
  /** Runs on every key pressed on a card, before the built-in handling. */
  onItemKeyDown?: Middleware<{ item: TItem; event: TKeyEvent }> | undefined;
  /** Runs before a jump between shifts; not calling `next` cancels it. */
  onNavigate?: Middleware<{ from: ShiftWindow; to: ShiftWindow; position: NavPosition; event: TEvent }> | undefined;
  /** Runs before an overflow group opens. */
  onMoreActivate?: Middleware<{ group: OverflowGroup<TItem>; event: TEvent }> | undefined;
  /** Runs before the scroll back to the top. */
  onScrollTop?: Middleware<{ event: TEvent }> | undefined;
  /** Runs before the overflow table is sorted, and may change the sort it applies. */
  onOverflowSort?: Middleware<{ sort: OverflowSort; event: TEvent }> | undefined;
  /** Runs before the overflow table changes page. */
  onOverflowPage?: Middleware<{ page: number; event: TEvent }> | undefined;
  /** Runs before the overflow dialog closes, with what asked for it. */
  onOverflowClose?: Middleware<{ group: OverflowGroup<TItem>; reason: CloseReason }> | undefined;
  /** Runs before an item detail closes, with what asked for it. */
  onDetailClose?: Middleware<{ item: TItem; reason: CloseReason }> | undefined;
  /** Runs before an item pins or unpins; not calling `next` leaves the strip as it was. */
  onPin?: Middleware<{ item: TItem; pinned: boolean }> | undefined;
  /** Runs before the header signal changes, with what caused it. */
  onHeaderSignal?: Middleware<{ expanded: boolean; view: ViewKind; reason: HeaderReason }> | undefined;
}

/**
 * State callbacks and domain events (Feature Dossier 04 §5.5–§5.9). They report what happened; to
 * intervene before it happens, use `handlers`.
 *
 * @category Events
 * @since 1.0.0
 */
export interface SchedulerEvents<TItem> {
  /**
   * The rendered date changed, in the uncontrolled case.
   *
   * @category Events
   */
  onDateChange?: ((date: Date) => void) | undefined;
  /**
   * The view changed, whether by the reader, by the breakpoint or through the API.
   *
   * @category Events
   */
  onViewChange?: ((view: ViewKind) => void) | undefined;
  /**
   * The header signal changed. `reason` says what caused it, so a page can ignore the causes it does
   * not care about.
   *
   * @category Events
   */
  onHeaderExpandedChange?: ((expanded: boolean, info: { view: ViewKind; reason: HeaderReason }) => void) | undefined;
  /**
   * The open item changed, in the uncontrolled case. `null` means the detail view closed.
   *
   * @category Events
   */
  onOpenItemIdChange?: ((id: string | null) => void) | undefined;
  /**
   * An item was opened. `source` says whether it came from a pointer, the keyboard or the API.
   *
   * @category Events
   */
  onItemOpen?: ((item: TItem, info: { source: ActivationSource }) => void) | undefined;
  /**
   * The open item was closed, with the reason it closed.
   *
   * @category Events
   */
  onItemClose?: ((item: TItem, info: { reason: CloseReason }) => void) | undefined;
  /**
   * The open overflow group changed, in the uncontrolled case.
   *
   * @category Events
   */
  onOpenOverflowIdChange?: ((id: string | null) => void) | undefined;
  /**
   * The overflow dialog's sort changed, in the uncontrolled case.
   *
   * @category Events
   */
  onOverflowSortChange?: ((sort: OverflowSort) => void) | undefined;
  /**
   * The overflow dialog's page changed, in the uncontrolled case.
   *
   * @category Events
   */
  onOverflowPageChange?: ((page: number) => void) | undefined;
  /**
   * The shift the reader is looking at changed, by scrolling or by navigating.
   *
   * @category Events
   */
  onActiveShiftChange?: ((shift: ShiftWindow, info: { view: ViewKind }) => void) | undefined;
  /**
   * The set of pinned items changed, with what entered and left it.
   *
   * @category Events
   */
  onPinnedChange?:
    ((ids: readonly string[], diff: { added: readonly string[]; removed: readonly string[] }) => void) | undefined;
  /**
   * A jump to another shift finished. `position` is `'api'` when the handle was called.
   *
   * @category Events
   */
  onNavigate?:
    ((info: { from: ShiftWindow; to: ShiftWindow; position: NavPosition | 'api'; view: ViewKind }) => void) | undefined;
  /**
   * The time range on screen changed. This is the hook for loading a day's items on demand.
   *
   * @category Events
   */
  onVisibleRangeChange?: ((range: { start: Date; end: Date }) => void) | undefined;
  /**
   * The timeline recomputed its layout, with the placement of every card.
   *
   * @category Events
   */
  onLayout?: ((layout: TimelineLayout<TItem>) => void) | undefined;
  /**
   * An overflow group was opened.
   *
   * @category Events
   */
  onOverflowOpen?: ((group: OverflowGroup<TItem>) => void) | undefined;
  /**
   * An overflow group was closed.
   *
   * @category Events
   */
  onOverflowClose?: ((group: OverflowGroup<TItem>) => void) | undefined;
  /**
   * The scroll-to-top button was used.
   *
   * @category Events
   */
  onScrollTop?: (() => void) | undefined;
}

/**
 * Feature flags (Feature Dossier 04 §5.8). Turning one off removes the feature and everything it
 * renders; nothing else changes.
 *
 * @category Features
 * @since 1.0.0
 */
export interface SchedulerFlags {
  /**
   * Items may pin to the edge of the scroller and appear in the pinned strip.
   *
   * @defaultValue true
   * @category Features
   */
  enablePinning?: boolean | undefined;
  /**
   * The buttons that jump to the previous and next shift.
   *
   * @defaultValue true
   * @category Features
   */
  enableNavigation?: boolean | undefined;
  /**
   * The count of items carried over from earlier shifts, shown on the navigation button.
   *
   * @defaultValue true
   * @category Features
   */
  enableCarriedOverCount?: boolean | undefined;
  /**
   * The marker for the current time in the list and the line in the timeline.
   *
   * @defaultValue true
   * @category Features
   */
  enableNowIndicator?: boolean | undefined;
  /**
   * The shaded bands the timeline draws outside the active shift.
   *
   * @defaultValue true
   * @category Features
   */
  enableOffShiftBands?: boolean | undefined;
  /**
   * The dialog that lists the items behind a "More" chip.
   *
   * @defaultValue true
   * @category Features
   */
  enableOverflowDialog?: boolean | undefined;
  /**
   * The button that returns the scroller to the top.
   *
   * @defaultValue true
   * @category Features
   */
  enableScrollTopButton?: boolean | undefined;
  /**
   * The signal that tells the surrounding page to collapse its header while reading a shift.
   *
   * @defaultValue true
   * @category Features
   */
  enableHeaderSignal?: boolean | undefined;
  /**
   * Tooltips on truncated card titles.
   *
   * @defaultValue true
   * @category Features
   */
  enableTooltips?: boolean | undefined;
  /**
   * Transitions and animations. `reducedMotion` switches them off per reader; this switches them off
   * for everyone.
   *
   * @defaultValue true
   * @category Features
   */
  enableAnimations?: boolean | undefined;
  /**
   * Opening an item shows its detail view.
   *
   * @defaultValue true
   * @category Features
   */
  enableItemDetail?: boolean | undefined;
}

/**
 * Every feature flag with its value filled in.
 *
 * @category Features
 * @since 1.0.0
 */
export type ResolvedFlags = { [K in keyof SchedulerFlags]-?: boolean };

const FLAG_NAMES: readonly (keyof SchedulerFlags)[] = [
  'enablePinning',
  'enableNavigation',
  'enableCarriedOverCount',
  'enableNowIndicator',
  'enableOffShiftBands',
  'enableOverflowDialog',
  'enableScrollTopButton',
  'enableHeaderSignal',
  'enableTooltips',
  'enableAnimations',
  'enableItemDetail',
];

/** Everything the controller reads; the React props add render props, slots and styling. */
export interface SchedulerOptions<TItem extends SchedulerItem, TEvent = unknown, TKeyEvent = TEvent>
  extends SchedulerEvents<TItem>, SchedulerFlags {
  /**
   * The items to place. Each needs an `id` and a `start`; an item without an `end` lasts
   * `defaultDuration`.
   *
   * @category Data
   * @since 1.0.0
   */
  items?: readonly TItem[] | undefined;
  /**
   * Ready-made shift segments, for data that is already grouped. Given these, the scheduler does not
   * bucket `items` itself.
   *
   * @category Data
   * @since 1.0.0
   */
  segments?: readonly SegmentInput<TItem>[] | undefined;
  /**
   * The day to render, controlled. Pair it with `onDateChange`.
   *
   * @category Date and time
   * @since 1.0.0
   */
  date?: DateInput | undefined;
  /**
   * The day to start on when `date` is not controlled.
   *
   * @defaultValue the current day
   * @category Date and time
   * @since 1.0.0
   */
  defaultDate?: DateInput | undefined;
  /**
   * The moment the "now" indicator points at. Set it to freeze the clock, in a test or a demo.
   *
   * @defaultValue the current time
   * @category Date and time
   * @since 1.0.0
   */
  now?: DateInput | undefined;
  /**
   * How often the clock advances, in milliseconds.
   *
   * @defaultValue 60000
   * @min 1000
   * @max 600000
   * @step 1000
   * @category Date and time
   * @since 1.0.0
   */
  nowTickInterval?: number | undefined;
  /**
   * Renders the loading state. With items already present, they stay on screen and the state is
   * shown over them.
   *
   * @defaultValue false
   * @category States
   * @since 1.0.0
   */
  loading?: boolean | undefined;
  /**
   * Renders the error state. Any value is accepted; the message comes from `localization`.
   *
   * @category States
   * @since 1.0.0
   */
  error?: unknown;
  /**
   * How long an item without an `end` lasts, in milliseconds.
   *
   * @defaultValue 7200000
   * @min 900000
   * @max 86400000
   * @step 900000
   * @category Data
   * @since 1.0.0
   */
  defaultDuration?: number | undefined;
  /**
   * The level scale: the ranks an item can have, with their colors and labels.
   *
   * @defaultValue classicLevels
   * @category Levels and tags
   * @since 1.0.0
   */
  levels?: readonly LevelDefinition[] | undefined;
  /**
   * The tags an item can carry, with their labels.
   *
   * @defaultValue classicTags
   * @category Levels and tags
   * @since 1.0.0
   */
  tags?: readonly TagDefinition[] | undefined;
  /**
   * The shift pattern of the day: how long a shift is, where it starts, and how many are rendered
   * before and after the current one.
   *
   * @category Shifts
   * @since 1.0.0
   */
  shifts?: ShiftOptions | undefined;
  /**
   * Orders items inside a shift. The default order is by start, then by level, then by title.
   *
   * @category Data
   * @since 1.0.0
   */
  compareItems?: ((a: TItem, b: TItem) => number) | undefined;
  /**
   * The view to render, controlled. Pair it with `onViewChange`.
   *
   * @category View
   * @since 1.0.0
   */
  view?: ViewKind | undefined;
  /**
   * The view to start in when `view` is not controlled.
   *
   * @defaultValue 'list'
   * @category View
   * @since 1.0.0
   */
  defaultView?: ViewKind | undefined;
  /**
   * Below this width, in pixels, only the list is offered. Leave it out to keep both views at every
   * width.
   *
   * @min 320
   * @max 1600
   * @step 10
   * @category View
   * @since 1.0.0
   */
  listOnlyBreakpoint?: number | undefined;
  /**
   * The list view's own options.
   *
   * @category List
   * @since 1.0.0
   */
  list?: ListOptions | undefined;
  /**
   * The timeline view's own options.
   *
   * @category Timeline
   * @since 1.0.0
   */
  timeline?: TimelineOptions | undefined;
  /**
   * Where items pin, and in which order the pinned strip shows them.
   *
   * @category Pinning
   * @since 1.0.0
   */
  pinning?: PinningOptions | undefined;
  /**
   * The compact layout: `'auto'` switches at `compactBreakpoint`, a boolean forces it.
   *
   * @defaultValue 'auto'
   * @category Compact
   * @since 1.0.0
   */
  compact?: boolean | 'auto' | undefined;
  /**
   * The width, in pixels, below which `compact: 'auto'` turns compact on.
   *
   * @defaultValue 900
   * @min 320
   * @max 1600
   * @step 10
   * @category Compact
   * @since 1.0.0
   */
  compactBreakpoint?: number | undefined;
  /**
   * Motion: `'auto'` follows the reader's `prefers-reduced-motion`, a boolean forces it.
   *
   * @defaultValue 'auto'
   * @category Motion
   * @since 1.0.0
   */
  reducedMotion?: boolean | 'auto' | undefined;
  /**
   * The spacing scale of the rendered parts.
   *
   * @defaultValue 'standard'
   * @category Appearance
   * @since 1.0.0
   */
  density?: Density | undefined;
  /**
   * The header signal, controlled. Pair it with `onHeaderExpandedChange`.
   *
   * @category Header
   * @since 1.0.0
   */
  headerExpanded?: boolean | undefined;
  /**
   * The header signal's starting value when it is not controlled.
   *
   * @defaultValue true
   * @category Header
   * @since 1.0.0
   */
  defaultHeaderExpanded?: boolean | undefined;
  /**
   * The open item, controlled by id. `null` closes the detail view.
   *
   * @category Item detail
   * @since 1.0.0
   */
  openItemId?: string | null | undefined;
  /**
   * The item open on first render when `openItemId` is not controlled.
   *
   * @defaultValue null
   * @category Item detail
   * @since 1.0.0
   */
  defaultOpenItemId?: string | null | undefined;
  /**
   * The open overflow group, controlled by id.
   *
   * @category Overflow
   * @since 1.0.0
   */
  openOverflowId?: string | null | undefined;
  /**
   * The overflow group open on first render when `openOverflowId` is not controlled.
   *
   * @defaultValue null
   * @category Overflow
   * @since 1.0.0
   */
  defaultOpenOverflowId?: string | null | undefined;
  /**
   * The columns of the overflow dialog's table, in order.
   *
   * @defaultValue defaultOverflowColumns
   * @category Overflow
   * @since 1.0.0
   */
  overflowColumns?: readonly SortableColumn<TItem>[] | undefined;
  /**
   * Rows per page in the overflow dialog.
   *
   * @defaultValue 10
   * @min 1
   * @max 100
   * @step 1
   * @category Overflow
   * @since 1.0.0
   */
  overflowPageSize?: number | undefined;
  /**
   * The overflow dialog's sort, controlled.
   *
   * @category Overflow
   * @since 1.0.0
   */
  overflowSort?: OverflowSort | undefined;
  /**
   * The overflow dialog's sort on first open when it is not controlled.
   *
   * @category Overflow
   * @since 1.0.0
   */
  defaultOverflowSort?: OverflowSort | undefined;
  /**
   * The overflow dialog's page, controlled, counted from 1.
   *
   * @category Overflow
   * @since 1.0.0
   */
  overflowPage?: number | undefined;
  /**
   * The overflow dialog's page on first open when it is not controlled.
   *
   * @defaultValue 1
   * @category Overflow
   * @since 1.0.0
   */
  defaultOverflowPage?: number | undefined;
  /**
   * Every string the component can show. Pass a whole locale pack, or only the entries to replace.
   *
   * @defaultValue enUS
   * @category Localization
   * @since 1.0.0
   */
  localization?: DeepPartial<SchedulerLocalization> | undefined;
  /**
   * The BCP 47 locale used to format dates, times and numbers.
   *
   * @defaultValue the locale of the pack in `localization`
   * @category Localization
   * @since 1.0.0
   */
  locale?: string | undefined;
  /**
   * Replaces single formatters, for a house format the locale does not produce.
   *
   * @category Localization
   * @since 1.0.0
   */
  formatters?: Partial<SchedulerFormatters> | undefined;
  /**
   * Writing direction. `'auto'` reads it from the surrounding document.
   *
   * @defaultValue 'auto'
   * @category Localization
   * @since 1.0.0
   */
  dir?: 'ltr' | 'rtl' | 'auto' | undefined;
  /**
   * Middleware that runs before each interaction and can change or cancel it.
   *
   * @category Handlers
   * @since 1.0.0
   */
  handlers?: SchedulerHandlers<TItem, TEvent, TKeyEvent> | undefined;
}

/** What a view measured on its last scroll frame. */
export interface ScrollFacts {
  /** Index of the active shift in `shifts`. */
  activeIndex: number;
  /** The view sits at the start of the active shift (F-08 `atStart`). */
  atStart: boolean;
  /** List only: the section of the shift with offset +1 is visible below the fold. */
  nextVisible: boolean;
  /** List only: scrolled past `list.scrollTopThreshold`. */
  pastScrollTopThreshold: boolean;
}

interface ViewState {
  facts: ScrollFacts | null;
  /** Ids the pin engine reports as pinned by position (after `handlers.onPin`). */
  pinnedIds: readonly string[];
}

/**
 * The controller’s stored state: what the reader changed, before any option is applied.
 *
 * @category Headless
 * @since 1.0.0
 */
export interface SchedulerStoreState {
  /** Uncontrolled values. */
  date: number;
  /** The view being shown, when it is not controlled. */
  view: ViewKind;
  /** The header signal, when it is not controlled. */
  headerExpanded: boolean;
  /** The item whose detail is open, when it is not controlled. */
  openItemId: string | null;
  /** What opened that item. */
  openSource: ActivationSource;
  /** The overflow group whose dialog is open, when it is not controlled. */
  openOverflowId: string | null;
  /** The sort of the overflow table, when it is not controlled. */
  overflowSort: OverflowSort;
  /** The page of the overflow table, when it is not controlled. */
  overflowPage: number;
  /** Measured by the view layer. */
  width: number | null;
  /** The current moment, as the internal clock last reported it. */
  clock: number;
  /** Whether the reader's system asks for reduced motion. */
  prefersReducedMotion: boolean;
  /** The writing direction the document is in. */
  documentDir: 'ltr' | 'rtl';
  /** Per-view state: scroll facts, pinned ids and the header memory. */
  views: Readonly<Record<ViewKind, ViewState>>;
}

/**
 * The resolved input: options, defaults and state merged into one shape the views read.
 *
 * @category Headless
 * @since 1.0.0
 */
export interface SchedulerModel<TItem extends SchedulerItem> {
  /** The locale pack in force, with every default filled in. */
  localization: SchedulerLocalization;
  /** The formatters in force, already bound to the locale. */
  formatters: SchedulerFormatters;
  /** The BCP 47 tag every format is produced with. */
  locale: string;
  /** Resolved direction; `explicitDir` is set on the root only when it did not come from the document. */
  dir: 'ltr' | 'rtl';
  /** The direction to set on the root, when it did not come from the document. */
  explicitDir: 'ltr' | 'rtl' | undefined;
  /** The level scale, resolved and keyed by level key. */
  levels: ReadonlyMap<string, ResolvedLevel>;
  /** The tags an item may carry, keyed by tag key. */
  tags: ReadonlyMap<string, TagDefinition>;
  /** The order of items inside a shift. */
  compare: (a: TItem, b: TItem) => number;
  /** Pinned-strip order: `pinning.compare`, else `compare`. */
  pinCompare: (a: TItem, b: TItem) => number;
  /** The view to render. */
  view: ViewKind;
  /** Whether the schedule is in compact mode. */
  compact: boolean;
  /** Pinned-chip width class from the root width: lg ≥ 900, md 600–899, sm < 600. */
  size: 'sm' | 'md' | 'lg';
  /** Whether motion is being kept to a minimum. */
  reducedMotion: boolean;
  /** Smooth scrolling and entrance animations run. */
  animate: boolean;
  /** The spacing scale in force. */
  density: Density;
  /** Every feature flag, resolved. */
  flags: ResolvedFlags;
  /** The list options, with every default filled in. */
  list: ResolvedListOptions;
  /** The timeline options, with every default filled in. */
  timeline: ResolvedTimelineOptions;
  /** The pin rule of each view, with every default filled in. */
  pinRules: { list: ResolvedPinRule; timeline: ResolvedPinRule };
  /** The moment being read. */
  date: number;
  /** The current moment. */
  now: number;
  /** Whether the schedule is waiting for data. */
  loading: boolean;
  /** The error to show instead of the content, if any. */
  error: unknown;
  /** How long an item without an end lasts, in milliseconds. */
  defaultDuration: number;
  /** The rendered shifts, in order. */
  shifts: readonly ShiftWindow[];
  /** The rendered shifts with their items, in order. */
  segments: readonly ShiftSegment<TItem>[];
  /** -1 when no rendered shift has offset 0 (the views render only their root, LV-10). */
  currentIndex: number;
  /** The current shift, or `null` when no rendered shift is the current one. */
  current: ShiftWindow | null;
  /** Whether any rendered shift holds an item. */
  hasItems: boolean;
  /** Every rendered item, by id. */
  itemsById: ReadonlyMap<string, TItem>;
  /** The timeline's measurements: the range, the hour height and the anchors. */
  geometry: TimelineGeometry;
  /** Whether the now indicator may be shown at all. */
  nowVisible: boolean;
  /** How many items of the shifts already passed can still pin. */
  carriedOverCount: number;
  /** The current value of the header signal. */
  headerExpanded: boolean;
  /** The id of the item whose detail is open. */
  openItemId: string | null;
  /** The item whose detail is open, when it is still in the data. */
  openItem: TItem | null;
  /** What opened it. */
  openSource: ActivationSource;
  /** The open id names an item that is no longer in the data (B-03: the view closes). */
  openItemMissing: boolean;
  /** The id of the overflow group whose dialog is open. */
  openOverflowId: string | null;
  /** The sort of the overflow table. */
  overflowSort: OverflowSort;
  /** The page of the overflow table. */
  overflowPage: number;
  /** How many rows a page of the overflow table holds. */
  overflowPageSize: number;
}

/**
 * Everything a view needs to render, derived from the model.
 *
 * @category Headless
 * @since 1.0.0
 */
export interface SchedulerViewModel<TItem extends SchedulerItem> {
  /** The view this model describes. */
  view: ViewKind;
  /** What the last measurement of the scroller found. */
  facts: ScrollFacts;
  /** The shift being read, or `null` before the first measurement. */
  activeShift: ShiftWindow | null;
  /** Pinned-strip ids in strip order (position-pinned plus `pinned: true` items). */
  pinnedIds: readonly string[];
  /** The pinned items with their chips, in strip order. */
  pinned: readonly PinnedEntry<TItem>[];
  /** What the two navigation buttons point at. */
  navigation: { top: NavState; bottom: NavState };
  /** Whether the button back to the top is shown. */
  scrollTopVisible: boolean;
}

/**
 * The framework-agnostic controller behind the components: state, actions and a subscription.
 *
 * @category Headless
 * @since 1.0.0
 */
export interface SchedulerController<TItem extends SchedulerItem, TEvent = unknown, TKeyEvent = TEvent> {
  /** Replaces the options. Does not notify: the owner re-renders with the new options anyway. */
  setOptions(options: SchedulerOptions<TItem, TEvent, TKeyEvent>): void;
  /** The options as they were last set. */
  getOptions(): SchedulerOptions<TItem, TEvent, TKeyEvent>;
  /** The stored state: what the reader changed, before any option is applied. */
  getState: () => SchedulerStoreState;
  /** Subscribes to state changes; the returned function unsubscribes. */
  subscribe: (listener: () => void) => () => void;
  /** The resolved model the views read. */
  getModel(): SchedulerModel<TItem>;
  /** Everything one view needs beyond the model. */
  getViewModel(view: ViewKind): SchedulerViewModel<TItem>;
  /** The computed timeline layout, or `null` outside the timeline. */
  getLayout(): TimelineLayout<TItem> | null;
  /** One overflow group by id, or `null` when there is none. */
  getOverflowGroup(id: string | null): OverflowGroup<TItem> | null;
  /** Marks the owner (un)mounted; an asynchronous `next()` after unmount is ignored (F-22). */
  setMounted(mounted: boolean): void;
  /** Records that `view` is shown; true when another view was shown before (a view switch). */
  noteViewShown(view: ViewKind): boolean;

  // Measurements reported by the view layer.
  /** Reports the root's width, which decides compact mode. */
  setWidth(width: number): void;
  /** Reports the current moment, on every tick of the clock. */
  setClock(time: number): void;
  /** Reports whether the system asks for reduced motion. */
  setPrefersReducedMotion(matches: boolean): void;
  /** Reports the direction the document is in. */
  setDocumentDir(dir: 'ltr' | 'rtl'): void;
  /** Reports what a measurement of the scroller found. */
  setScrollFacts(view: ViewKind, facts: ScrollFacts): void;
  /** Ids the view's pin engine pinned by position; `handlers.onPin` may veto each change. */
  setPinnedByPosition(view: ViewKind, ids: readonly string[]): void;
  /** Emits `onPinnedChange` when the strip's ids differ from the last emission for the view. */
  flushPinned(view: ViewKind): void;
  /** Resets the per-view header memory, so the next signal is compared afresh (view enter). */
  resetHeader(view: ViewKind): void;
  /** Reports a header signal from a view, which the middleware may veto. */
  signalHeader(view: ViewKind, expanded: boolean, reason: HeaderReason): void;

  // Actions.
  /** Opens an item the way a card does: middleware first, then the state, then the event. */
  activateItem(item: TItem, source: ActivationSource, event?: TEvent): void;
  /** Imperative open (`api`): no middleware (F-26); disabled or unknown items do not open. */
  openItem(id: string): void;
  /** Runs the key middleware for a card, then activates it when the key asks for that. */
  keyDownItem(item: TItem, event: TKeyEvent, activate: () => void): void;
  /** Closes the open item detail, with the reason. */
  closeItem(reason: CloseReason): void;
  /** Closes the view of an item that left the data (B-03); no middleware, never reopens by itself. */
  reconcileOpenItem(): void;
  /** Opens an overflow group the way its chip does. */
  activateMore(group: OverflowGroup<TItem>, event: TEvent): void;
  /** Opens an overflow group by id, without middleware. */
  openOverflow(groupId: string): void;
  /** Closes the overflow dialog, with the reason. */
  closeOverflow(reason: CloseReason): void;
  /** Sorts the overflow table by a column, toggling the direction when it is already sorted by it. */
  sortOverflow(column: string, event: TEvent): void;
  /** Moves the overflow table to a page. */
  setOverflowPage(page: number, event: TEvent): void;
  /** Runs a navigation from one of the buttons: middleware, then the scroll the view performs. */
  navigate(view: ViewKind, position: NavPosition, event: TEvent, perform: (to: ShiftWindow) => void): void;
  /** Imperative navigation (`api`): no middleware (F-26). */
  navigateTo(view: ViewKind, to: ShiftWindow, perform: (to: ShiftWindow) => void): void;
  /** Runs the scroll back to the top: middleware, then the scroll the view performs. */
  scrollToTop(event: TEvent, perform: () => void): void;
  /** Switches the view, in the uncontrolled case. */
  setView(view: ViewKind): void;
  /** Moves to another moment, in the uncontrolled case. */
  setDate(date: DateInput): void;
}

const DENSITY_TIMELINE: Record<Density, { hourHeight: number; minCardHeight: number }> = {
  standard: { hourHeight: 172, minCardHeight: 80 },
  comfortable: { hourHeight: 200, minCardHeight: 96 },
  dense: { hourHeight: 120, minCardHeight: 56 },
};

const DEFAULT_DURATION = 2 * 3_600_000;
const DEFAULT_SORT: OverflowSort = { column: 'time', direction: 'asc' };
const EMPTY: readonly never[] = Object.freeze([]);

/** Memoizes the last call by argument identity. */
function memoizeOne<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let lastArgs: A | undefined;
  let lastResult: R;
  return (...args) => {
    if (lastArgs && args.length === lastArgs.length && args.every((arg, index) => Object.is(arg, lastArgs?.[index]))) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  };
}

function sameFacts(a: ScrollFacts | null, b: ScrollFacts): boolean {
  return (
    a !== null &&
    a.activeIndex === b.activeIndex &&
    a.atStart === b.atStart &&
    a.nextVisible === b.nextVisible &&
    a.pastScrollTopThreshold === b.pastScrollTopThreshold
  );
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function controlled<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

/** Epoch ms of a date input, or `fallback` (with a development warning) when it is invalid. */
function validTime(input: DateInput | undefined, fallback: number, name: string): number {
  if (input === undefined) return fallback;
  const time = toMs(input);
  if (Number.isNaN(time)) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      devWarnOnce(`invalid-${name}`, `The "${name}" value is not a valid date; the current time is used.`);
    }
    return fallback;
  }
  return time;
}

/**
 * Creates a controller. This is the whole library without React: feed it options, read the view model, call its actions.
 *
 * @category Headless
 * @since 1.0.0
 * @param initialOptions The options the controller starts with; `setOptions` replaces them later.
 */
export function createScheduler<TItem extends SchedulerItem, TEvent = unknown, TKeyEvent = TEvent>(
  initialOptions: SchedulerOptions<TItem, TEvent, TKeyEvent>,
): SchedulerController<TItem, TEvent, TKeyEvent> {
  let options = initialOptions;
  let mounted = true;
  const isActive = (): boolean => mounted;

  // The clock starts from `now`, else `defaultDate`, else the current time (F-28); `defaultDate`
  // is captured once, so an absent `date` never re-lands on every render (B-23).
  const startClock = validTime(initialOptions.now ?? initialOptions.defaultDate, Date.now(), 'now');
  const store = createStore<SchedulerStoreState>({
    date: validTime(initialOptions.defaultDate, startClock, 'defaultDate'),
    view: initialOptions.defaultView ?? 'list',
    headerExpanded: initialOptions.defaultHeaderExpanded ?? true,
    openItemId: initialOptions.defaultOpenItemId ?? null,
    openSource: 'api',
    openOverflowId: initialOptions.defaultOpenOverflowId ?? null,
    overflowSort: initialOptions.defaultOverflowSort ?? DEFAULT_SORT,
    overflowPage: initialOptions.defaultOverflowPage ?? 0,
    width: null,
    clock: startClock,
    prefersReducedMotion: false,
    documentDir: 'ltr',
    views: { list: { facts: null, pinnedIds: EMPTY }, timeline: { facts: null, pinnedIds: EMPTY } },
  });

  const update = (patch: Partial<SchedulerStoreState>): void => store.setState((state) => ({ ...state, ...patch }));
  const updateView = (view: ViewKind, patch: Partial<ViewState>): void =>
    store.setState((state) => ({ ...state, views: { ...state.views, [view]: { ...state.views[view], ...patch } } }));

  // ------------------------------------------------------------------ derived model
  //
  // The model is keyed on its inputs one by one. Small option objects are compared structurally, so
  // inline props do not re-derive it; `items`, `segments` and functions compare by identity.

  const stable = {
    levels: stabilizer<readonly LevelDefinition[] | undefined>(),
    tags: stabilizer<readonly TagDefinition[] | undefined>(),
    shifts: stabilizer<ShiftOptions | undefined>(),
    list: stabilizer<ListOptions | undefined>(),
    timeline: stabilizer<TimelineOptions | undefined>(),
    pinning: stabilizer<PinningOptions | undefined>(),
    localization: stabilizer<DeepPartial<SchedulerLocalization> | undefined>(),
    formatters: stabilizer<Partial<SchedulerFormatters> | undefined>(),
    overflowSort: stabilizer<OverflowSort>(),
  };

  // A controlled open id whose item left the data is ignored until the consumer changes it, so the
  // view never reopens by itself when the item returns (B-03).
  let suppressedOpenId: string | null = null;
  let lastOpenItem: TItem | null = null;

  const inputsOf = (opts: SchedulerOptions<TItem, TEvent, TKeyEvent>, state: SchedulerStoreState) => ({
    items: opts.items,
    segments: opts.segments,
    date: opts.date === undefined ? state.date : validTime(opts.date, state.clock, 'date'),
    now: opts.now === undefined ? state.clock : validTime(opts.now, state.clock, 'now'),
    loading: opts.loading === true,
    error: opts.error,
    defaultDuration: opts.defaultDuration ?? DEFAULT_DURATION,
    levels: stable.levels(opts.levels) ?? classicLevels,
    tags: stable.tags(opts.tags) ?? classicTags,
    shifts: stable.shifts(opts.shifts),
    compareItems: opts.compareItems,
    view: controlled(opts.view, state.view),
    listOnlyBreakpoint: opts.listOnlyBreakpoint,
    list: stable.list(opts.list),
    timeline: stable.timeline(opts.timeline),
    pinning: stable.pinning(opts.pinning),
    compact: opts.compact ?? 'auto',
    compactBreakpoint: opts.compactBreakpoint ?? 900,
    reducedMotion: opts.reducedMotion ?? 'auto',
    density: opts.density ?? 'standard',
    headerExpanded: controlled(opts.headerExpanded, state.headerExpanded),
    openItemId: controlled(opts.openItemId, state.openItemId),
    openSource: state.openSource,
    suppressedOpenId,
    openOverflowId: controlled(opts.openOverflowId, state.openOverflowId),
    overflowSort: stable.overflowSort(controlled(opts.overflowSort, state.overflowSort)),
    overflowPage: controlled(opts.overflowPage, state.overflowPage),
    overflowPageSize: Math.max(1, opts.overflowPageSize ?? 10),
    localization: stable.localization(opts.localization),
    locale: opts.locale,
    formatters: stable.formatters(opts.formatters),
    dir: opts.dir,
    width: state.width,
    prefersReducedMotion: state.prefersReducedMotion,
    documentDir: state.documentDir,
    flags: FLAG_NAMES.map((name) => opts[name] ?? true).join(),
  });
  type ModelInputs = ReturnType<typeof inputsOf>;

  const localizationOf = memoizeOne((override: DeepPartial<SchedulerLocalization> | undefined) =>
    mergeLocalization(enUS, override),
  );
  const formattersOf = memoizeOne(
    (locale: string, hourLabelFormat: 'compact' | 'locale', override: Partial<SchedulerFormatters> | undefined) => ({
      ...createFormatters(locale, { hourLabelFormat }),
      ...override,
    }),
  );
  const levelsOf = memoizeOne((levels: readonly LevelDefinition[]) => resolveLevels(levels));
  const tagsOf = memoizeOne((tags: readonly TagDefinition[]) => new Map(tags.map((tag) => [tag.key, tag])));
  const compareOf = memoizeOne(
    (levels: ReadonlyMap<string, ResolvedLevel>, custom: ((a: TItem, b: TItem) => number) | undefined) =>
      custom ?? (compareByPlacement(levels) as (a: TItem, b: TItem) => number),
  );
  const listOptionsOf = memoizeOne((list: ListOptions | undefined) => resolveListOptions(list));
  const timelineOptionsOf = memoizeOne((timeline: TimelineOptions | undefined, density: Density) =>
    resolveTimelineOptions({ ...DENSITY_TIMELINE[density], ...timeline }),
  );
  const pinRulesOf = memoizeOne((pinning: PinningOptions | undefined) => ({
    list: resolvePinRule('list', pinning?.list),
    timeline: resolvePinRule('timeline', pinning?.timeline),
  }));
  const flagsOf = memoizeOne((key: string) => {
    const values = key.split(',');
    const flags = {} as ResolvedFlags;
    FLAG_NAMES.forEach((name, index) => {
      flags[name] = values[index] !== 'false';
    });
    return flags;
  });
  const segmentsOf = memoizeOne(
    (
      items: readonly TItem[] | undefined,
      segments: readonly SegmentInput<TItem>[] | undefined,
      date: number,
      shiftOptions: ShiftOptions | undefined,
      levels: readonly LevelDefinition[],
      compareItems: ((a: TItem, b: TItem) => number) | undefined,
    ) => {
      const bucketOptions = compareItems ? { levels, compareItems } : { levels };
      const result = segments
        ? segmentsFromInput(segments, bucketOptions)
        : bucketItems(items ?? EMPTY, getShiftWindows(date, shiftOptions), bucketOptions);
      const itemsById = new Map<string, TItem>();
      for (const segment of result) for (const item of segment.items) itemsById.set(item.id, item);
      return { segments: result, shifts: result.map((segment) => segment.shift), itemsById };
    },
  );
  const geometryOf = memoizeOne((shifts: readonly ShiftWindow[], hourHeight: number, leadMinutes: number) =>
    timelineGeometry(shifts, hourHeight, leadMinutes),
  );
  const layoutOf = memoizeOne(
    (
      segments: readonly ShiftSegment<TItem>[],
      compact: boolean,
      geometry: TimelineGeometry,
      levels: ReadonlyMap<string, ResolvedLevel>,
      timeline: ResolvedTimelineOptions,
      compareItems: ((a: TItem, b: TItem) => number) | undefined,
      defaultDuration: number,
    ): TimelineLayout<TItem> =>
      computeTimelineLayout(
        segments.flatMap((segment) => segment.items),
        {
          rangeStart: geometry.rangeStart,
          rangeEnd: geometry.rangeEnd,
          levels,
          compact,
          hourHeight: timeline.hourHeight,
          maxColumns: timeline.maxColumns,
          maxColumnsCrowded: timeline.maxColumnsCrowded,
          maxColumnsCompact: timeline.maxColumnsCompact,
          minCardHeight: timeline.minCardHeight,
          cardGap: timeline.cardGap,
          keepCardsApart: timeline.keepCardsApart,
          columnPlacement: timeline.columnPlacement,
          overflowMergeWindow: timeline.overflowMergeWindow,
          defaultDuration,
          ...(compareItems ? { compareItems } : {}),
        },
      ),
  );

  function computeModel(input: ModelInputs): SchedulerModel<TItem> {
    const localization = localizationOf(input.localization);
    const locale = input.locale ?? localization.locale;
    const timeline = timelineOptionsOf(input.timeline, input.density);
    const levels = levelsOf(input.levels);
    const flags = flagsOf(input.flags);
    const { segments, shifts, itemsById } = segmentsOf(
      input.items,
      input.segments,
      input.date,
      input.shifts,
      input.levels,
      input.compareItems,
    );
    const currentIndex = shifts.findIndex((shift) => shift.offset === 0);
    const current = shifts[currentIndex] ?? null;
    const geometry = geometryOf(shifts, timeline.hourHeight, timeline.leadMinutes);
    const { width } = input;
    const compact = input.compact === 'auto' ? width !== null && width < input.compactBreakpoint : input.compact;
    const listOnly = input.listOnlyBreakpoint !== undefined && width !== null && width < input.listOnlyBreakpoint;
    const reducedMotion = input.reducedMotion === 'auto' ? input.prefersReducedMotion : input.reducedMotion;
    const explicitDir = input.dir === 'ltr' || input.dir === 'rtl' ? input.dir : localization.dir;
    const suppressed = input.openItemId !== null && input.openItemId === input.suppressedOpenId;
    const openItemId = suppressed ? null : input.openItemId;
    const openItem = openItemId === null ? null : (itemsById.get(openItemId) ?? null);

    return {
      localization,
      formatters: formattersOf(locale, timeline.hourLabelFormat, input.formatters),
      locale,
      dir: explicitDir ?? input.documentDir,
      explicitDir,
      levels,
      tags: tagsOf(input.tags),
      compare: compareOf(levels, input.compareItems),
      pinCompare:
        (input.pinning?.compare as ((a: TItem, b: TItem) => number) | undefined) ??
        compareOf(levels, input.compareItems),
      view: listOnly ? 'list' : input.view,
      compact,
      size: width === null || width >= 900 ? 'lg' : width >= 600 ? 'md' : 'sm',
      reducedMotion,
      animate: flags.enableAnimations && !reducedMotion,
      density: input.density,
      flags,
      list: listOptionsOf(input.list),
      timeline,
      pinRules: pinRulesOf(input.pinning),
      date: input.date,
      now: input.now,
      loading: input.loading,
      error: input.error,
      defaultDuration: input.defaultDuration,
      shifts,
      segments,
      currentIndex,
      current,
      hasItems: segments.some((segment) => segment.items.length > 0),
      itemsById,
      geometry,
      nowVisible:
        current !== null &&
        nowVisible({
          enabled: flags.enableNowIndicator,
          now: input.now,
          date: input.date,
          current,
          rangeStart: geometry.rangeStart,
          rangeEnd: geometry.rangeEnd,
        }),
      carriedOverCount: flags.enableCarriedOverCount ? carriedOverCount(segments, levels) : 0,
      headerExpanded: input.headerExpanded,
      openItemId: openItem === null ? null : openItemId,
      openItem,
      openSource: input.openSource,
      openItemMissing: openItemId !== null && openItem === null,
      openOverflowId: input.openOverflowId,
      overflowSort: input.overflowSort,
      overflowPage: input.overflowPage,
      overflowPageSize: input.overflowPageSize,
    };
  }

  let lastInputs: ModelInputs | undefined;
  let lastModel: SchedulerModel<TItem> | undefined;

  const getModel = (): SchedulerModel<TItem> => {
    if (suppressedOpenId !== null && options.openItemId !== suppressedOpenId) suppressedOpenId = null;
    const inputs = inputsOf(options, store.getState());
    if (!lastModel || !lastInputs || !shallowEqual(lastInputs, inputs)) {
      lastInputs = inputs;
      lastModel = computeModel(inputs);
    }
    if (lastModel.openItem) lastOpenItem = lastModel.openItem;
    return lastModel;
  };

  const defaultFacts = (model: SchedulerModel<TItem>): ScrollFacts => ({
    activeIndex: Math.max(0, model.currentIndex),
    atStart: true,
    nextVisible: false,
    pastScrollTopThreshold: false,
  });

  const viewModelOf = {
    list: memoizeOne((model: SchedulerModel<TItem>, view: ViewState) => buildViewModel('list', model, view)),
    timeline: memoizeOne((model: SchedulerModel<TItem>, view: ViewState) => buildViewModel('timeline', model, view)),
  };

  function buildViewModel(kind: ViewKind, model: SchedulerModel<TItem>, view: ViewState): SchedulerViewModel<TItem> {
    const facts = view.facts ?? defaultFacts(model);
    const pinned = model.flags.enablePinning
      ? pinnedEntries(model.segments, new Set(view.pinnedIds), model.pinCompare)
      : [];
    const navInput = {
      view: kind,
      shifts: model.shifts,
      activeIndex: facts.activeIndex,
      atStart: () => facts.atStart,
      nextOffsetVisible: facts.nextVisible,
      navigationAllowed: navigationAllowed(model.segments, model.list.navigationThreshold),
      carriedOverCount: model.carriedOverCount,
      localization: model.localization,
    };
    const navigation = model.flags.enableNavigation
      ? { top: topNavState(navInput), bottom: bottomNavState(navInput) }
      : { top: HIDDEN_NAV, bottom: HIDDEN_NAV };
    return {
      view: kind,
      facts,
      activeShift: model.shifts[facts.activeIndex] ?? null,
      pinnedIds: pinned.map((entry) => entry.item.id),
      pinned,
      navigation,
      scrollTopVisible:
        kind === 'list' &&
        model.compact &&
        model.flags.enableScrollTopButton &&
        model.currentIndex >= 0 &&
        facts.pastScrollTopThreshold,
    };
  }

  // ------------------------------------------------------------------ notifications

  let lastShownView: ViewKind | null = null;
  const lastActive: Partial<Record<ViewKind, number>> = {};
  const lastHeader: Partial<Record<ViewKind, boolean>> = {};
  const lastPinnedEmitted: Record<ViewKind, readonly string[]> = { list: EMPTY, timeline: EMPTY };

  const setOpenItem = (item: TItem, source: ActivationSource): void => {
    if (options.openItemId === undefined) update({ openItemId: item.id, openSource: source });
    else update({ openSource: source });
    options.onOpenItemIdChange?.(item.id);
    options.onItemOpen?.(item, { source });
  };

  const clearOpenItem = (item: TItem, reason: CloseReason): void => {
    if (options.openItemId === undefined) update({ openItemId: null });
    options.onOpenItemIdChange?.(null);
    options.onItemClose?.(item, { reason });
  };

  const resetOverflowState = (): void => {
    // Sort and page reset on each open unless controlled (F-13).
    update({
      overflowSort: options.defaultOverflowSort ?? DEFAULT_SORT,
      overflowPage: options.defaultOverflowPage ?? 0,
    });
  };

  const controller: SchedulerController<TItem, TEvent, TKeyEvent> = {
    setOptions(next) {
      options = next;
    },
    getOptions: () => options,
    getState: store.getState,
    subscribe: store.subscribe,
    getModel,
    getViewModel(view) {
      return viewModelOf[view](getModel(), store.getState().views[view]);
    },
    getLayout() {
      const model = getModel();
      if (model.currentIndex < 0) return null;
      return layoutOf(
        model.segments,
        model.compact,
        model.geometry,
        model.levels,
        model.timeline,
        options.compareItems,
        model.defaultDuration,
      );
    },
    getOverflowGroup(id) {
      if (id === null) return null;
      return controller.getLayout()?.overflow.find((group) => group.id === id) ?? null;
    },
    setMounted(value) {
      mounted = value;
    },
    noteViewShown(view) {
      const switched = lastShownView !== null && lastShownView !== view;
      lastShownView = view;
      return switched;
    },

    setWidth(width) {
      if (store.getState().width !== width) update({ width });
    },
    setClock(time) {
      if (store.getState().clock !== time) update({ clock: time });
    },
    setPrefersReducedMotion(matches) {
      if (store.getState().prefersReducedMotion !== matches) update({ prefersReducedMotion: matches });
    },
    setDocumentDir(dir) {
      if (store.getState().documentDir !== dir) update({ documentDir: dir });
    },
    setScrollFacts(view, facts) {
      if (!sameFacts(store.getState().views[view].facts, facts)) updateView(view, { facts });
      const model = getModel();
      if (view !== model.view || lastActive[view] === facts.activeIndex) return;
      lastActive[view] = facts.activeIndex;
      const shift = model.shifts[facts.activeIndex];
      if (shift) options.onActiveShiftChange?.(shift, { view });
    },
    setPinnedByPosition(view, ids) {
      const previous = store.getState().views[view].pinnedIds;
      const { added, removed } = diffPinned(previous, ids);
      if (added.length === 0 && removed.length === 0) return;
      const middleware = options.handlers?.onPin;
      if (!middleware) {
        updateView(view, { pinnedIds: ids });
        return;
      }
      const model = getModel();
      const apply = (id: string, pinned: boolean): void => {
        const current = store.getState().views[view].pinnedIds;
        const next = pinned ? (current.includes(id) ? current : [...current, id]) : current.filter((x) => x !== id);
        if (next !== current) updateView(view, { pinnedIds: next });
      };
      for (const [list, pinned] of [
        [added, true],
        [removed, false],
      ] as const) {
        for (const id of list) {
          const item = model.itemsById.get(id);
          if (!item) {
            apply(id, pinned);
            continue;
          }
          runMiddleware(middleware, { item, pinned }, (ctx) => apply(id, ctx.pinned), isActive);
        }
      }
    },
    flushPinned(view) {
      const ids = controller.getViewModel(view).pinnedIds;
      const previous = lastPinnedEmitted[view];
      if (sameIds(previous, ids)) return;
      lastPinnedEmitted[view] = ids;
      options.onPinnedChange?.(ids, diffPinned(previous, ids));
    },
    resetHeader(view) {
      delete lastHeader[view];
    },
    signalHeader(view, expanded, reason) {
      const model = getModel();
      if (!model.flags.enableHeaderSignal || view !== model.view) return;
      if (lastHeader[view] === expanded) return;
      lastHeader[view] = expanded;
      if (expanded === model.headerExpanded) return;
      runMiddleware(
        options.handlers?.onHeaderSignal,
        { expanded, view, reason },
        (ctx) => {
          if (options.headerExpanded === undefined) update({ headerExpanded: ctx.expanded });
          options.onHeaderExpandedChange?.(ctx.expanded, { view: ctx.view, reason: ctx.reason });
        },
        isActive,
      );
    },

    activateItem(item, source, event) {
      if (item.disabled === true) return;
      runMiddleware(
        options.handlers?.onItemActivate,
        { item, source, event },
        (ctx) => {
          if (ctx.item.disabled === true) return;
          if (getModel().flags.enableItemDetail) {
            setOpenItem(ctx.item, ctx.source);
          } else {
            options.onItemOpen?.(ctx.item, { source: ctx.source });
          }
        },
        isActive,
      );
    },
    openItem(id) {
      const item = getModel().itemsById.get(id);
      if (!item || item.disabled === true) return;
      if (getModel().flags.enableItemDetail) setOpenItem(item, 'api');
      else options.onItemOpen?.(item, { source: 'api' });
    },
    keyDownItem(item, event, activate) {
      runMiddleware(options.handlers?.onItemKeyDown, { item, event }, () => activate(), isActive);
    },
    closeItem(reason) {
      const item = getModel().openItem;
      if (!item) return;
      if (reason === 'api') {
        clearOpenItem(item, reason);
        return;
      }
      runMiddleware(
        options.handlers?.onDetailClose,
        { item, reason },
        (ctx) => clearOpenItem(ctx.item, ctx.reason),
        isActive,
      );
    },
    reconcileOpenItem() {
      const model = getModel();
      if (!model.openItemMissing) return;
      const id = options.openItemId === undefined ? store.getState().openItemId : options.openItemId;
      if (options.openItemId !== undefined) suppressedOpenId = id;
      if (options.openItemId === undefined) update({ openItemId: null });
      options.onOpenItemIdChange?.(null);
      if (lastOpenItem && lastOpenItem.id === id) options.onItemClose?.(lastOpenItem, { reason: 'itemRemoved' });
      lastOpenItem = null;
    },
    activateMore(group, event) {
      runMiddleware(
        options.handlers?.onMoreActivate,
        { group, event },
        (ctx) => {
          if (!getModel().flags.enableOverflowDialog) {
            options.onOverflowOpen?.(ctx.group);
            return;
          }
          if (options.openOverflowId === undefined) update({ openOverflowId: ctx.group.id });
          resetOverflowState();
          options.onOpenOverflowIdChange?.(ctx.group.id);
          options.onOverflowOpen?.(ctx.group);
        },
        isActive,
      );
    },
    openOverflow(groupId) {
      const group = controller.getOverflowGroup(groupId);
      if (!group) return;
      if (options.openOverflowId === undefined) update({ openOverflowId: group.id });
      resetOverflowState();
      options.onOpenOverflowIdChange?.(group.id);
      options.onOverflowOpen?.(group);
    },
    closeOverflow(reason) {
      const group = controller.getOverflowGroup(getModel().openOverflowId);
      const close = (target: OverflowGroup<TItem> | null): void => {
        if (options.openOverflowId === undefined) update({ openOverflowId: null });
        options.onOpenOverflowIdChange?.(null);
        if (target) options.onOverflowClose?.(target);
      };
      if (!group || reason === 'api') {
        close(group);
        return;
      }
      runMiddleware(options.handlers?.onOverflowClose, { group, reason }, (ctx) => close(ctx.group), isActive);
    },
    sortOverflow(column, event) {
      const current = getModel().overflowSort;
      const sort: OverflowSort =
        current.column === column
          ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
          : { column, direction: 'asc' };
      runMiddleware(
        options.handlers?.onOverflowSort,
        { sort, event },
        (ctx) => {
          const pageChanged = getModel().overflowPage !== 0;
          const patch: Partial<SchedulerStoreState> = {};
          if (options.overflowSort === undefined) patch.overflowSort = ctx.sort;
          if (options.overflowPage === undefined) patch.overflowPage = 0;
          update(patch);
          options.onOverflowSortChange?.(ctx.sort);
          if (pageChanged) options.onOverflowPageChange?.(0);
        },
        isActive,
      );
    },
    setOverflowPage(page, event) {
      runMiddleware(
        options.handlers?.onOverflowPage,
        { page, event },
        (ctx) => {
          if (options.overflowPage === undefined) update({ overflowPage: ctx.page });
          options.onOverflowPageChange?.(ctx.page);
        },
        isActive,
      );
    },
    navigate(view, position, event, perform) {
      const viewModel = controller.getViewModel(view);
      const nav = viewModel.navigation[position];
      const from = viewModel.activeShift;
      if (!nav.visible || nav.disabled || !nav.target || !from) return;
      runMiddleware(
        options.handlers?.onNavigate,
        { from, to: nav.target, position, event },
        (ctx) => {
          perform(ctx.to);
          options.onNavigate?.({ from: ctx.from, to: ctx.to, position: ctx.position, view });
        },
        isActive,
      );
    },
    navigateTo(view, to, perform) {
      const from = controller.getViewModel(view).activeShift ?? to;
      perform(to);
      options.onNavigate?.({ from, to, position: 'api', view });
    },
    scrollToTop(event, perform) {
      runMiddleware(
        options.handlers?.onScrollTop,
        { event },
        () => {
          perform();
          options.onScrollTop?.();
        },
        isActive,
      );
    },
    setView(view) {
      if (getModel().view === view && options.view === undefined && store.getState().view === view) return;
      if (options.view === undefined) update({ view });
      options.onViewChange?.(view);
    },
    setDate(input) {
      const time = toMs(input);
      if (Number.isNaN(time)) return;
      if (options.date === undefined) update({ date: time });
      options.onDateChange?.(new Date(time));
    },
  };
  return controller;
}

const HIDDEN_NAV: NavState = Object.freeze({
  visible: false,
  disabled: false,
  target: null,
  label: '',
  hint: '',
  carriedOverCount: 0,
});
