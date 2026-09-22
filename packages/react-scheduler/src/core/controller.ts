// SPDX-License-Identifier: MIT
// The scheduler controller (docs pack 09 §4.3 level 6; Feature Dossier 05 F-22, F-25, F-27): the
// shared state of both views, the model derived from options and state, and the actions. It knows
// nothing about React or the DOM: the view layer reports measurements (widths, scroll facts, pinned
// ids) and performs scrolling; the controller decides and notifies.
//
// Order for one action (F-25): middleware → default behavior → state callbacks (`onXChange`) →
// domain events. Controlled values (`x` given) are never written; uncontrolled ones live in the store.
import { bucketItems, segmentsFromInput } from './bucketing';
import { devWarnOnce } from './env';
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

export interface OverflowSort {
  column: string;
  direction: SortDirection;
}

export type NavPosition = 'top' | 'bottom';

/**
 * Interaction middleware (Feature Dossier 04 §5.11). `TEvent` / `TKeyEvent` are the event types of
 * the view layer (React's synthetic events in the main entry).
 */
export interface SchedulerHandlers<TItem, TEvent = unknown, TKeyEvent = TEvent> {
  onItemActivate?: Middleware<{ item: TItem; source: ActivationSource; event?: TEvent | undefined }> | undefined;
  onItemKeyDown?: Middleware<{ item: TItem; event: TKeyEvent }> | undefined;
  onNavigate?: Middleware<{ from: ShiftWindow; to: ShiftWindow; position: NavPosition; event: TEvent }> | undefined;
  onMoreActivate?: Middleware<{ group: OverflowGroup<TItem>; event: TEvent }> | undefined;
  onScrollTop?: Middleware<{ event: TEvent }> | undefined;
  onOverflowSort?: Middleware<{ sort: OverflowSort; event: TEvent }> | undefined;
  onOverflowPage?: Middleware<{ page: number; event: TEvent }> | undefined;
  onOverflowClose?: Middleware<{ group: OverflowGroup<TItem>; reason: CloseReason }> | undefined;
  onDetailClose?: Middleware<{ item: TItem; reason: CloseReason }> | undefined;
  onPin?: Middleware<{ item: TItem; pinned: boolean }> | undefined;
  onHeaderSignal?: Middleware<{ expanded: boolean; view: ViewKind; reason: HeaderReason }> | undefined;
}

/** State callbacks and domain events (Feature Dossier 04 §5.5–§5.9). */
export interface SchedulerEvents<TItem> {
  onDateChange?: ((date: Date) => void) | undefined;
  onViewChange?: ((view: ViewKind) => void) | undefined;
  onHeaderExpandedChange?: ((expanded: boolean, info: { view: ViewKind; reason: HeaderReason }) => void) | undefined;
  onOpenItemIdChange?: ((id: string | null) => void) | undefined;
  onItemOpen?: ((item: TItem, info: { source: ActivationSource }) => void) | undefined;
  onItemClose?: ((item: TItem, info: { reason: CloseReason }) => void) | undefined;
  onOpenOverflowIdChange?: ((id: string | null) => void) | undefined;
  onOverflowSortChange?: ((sort: OverflowSort) => void) | undefined;
  onOverflowPageChange?: ((page: number) => void) | undefined;
  onActiveShiftChange?: ((shift: ShiftWindow, info: { view: ViewKind }) => void) | undefined;
  onPinnedChange?:
    ((ids: readonly string[], diff: { added: readonly string[]; removed: readonly string[] }) => void) | undefined;
  onNavigate?:
    ((info: { from: ShiftWindow; to: ShiftWindow; position: NavPosition | 'api'; view: ViewKind }) => void) | undefined;
  onVisibleRangeChange?: ((range: { start: Date; end: Date }) => void) | undefined;
  onLayout?: ((layout: TimelineLayout<TItem>) => void) | undefined;
  onOverflowOpen?: ((group: OverflowGroup<TItem>) => void) | undefined;
  onOverflowClose?: ((group: OverflowGroup<TItem>) => void) | undefined;
  onScrollTop?: (() => void) | undefined;
}

/** Feature flags (Feature Dossier 04 §5.8); all default to `true`. */
export interface SchedulerFlags {
  enablePinning?: boolean | undefined;
  enableNavigation?: boolean | undefined;
  enableCarriedOverCount?: boolean | undefined;
  enableNowIndicator?: boolean | undefined;
  enableOffShiftBands?: boolean | undefined;
  enableOverflowDialog?: boolean | undefined;
  enableScrollTopButton?: boolean | undefined;
  enableHeaderSignal?: boolean | undefined;
  enableTooltips?: boolean | undefined;
  enableAnimations?: boolean | undefined;
  enableItemDetail?: boolean | undefined;
}

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
  items?: readonly TItem[] | undefined;
  segments?: readonly SegmentInput<TItem>[] | undefined;
  date?: DateInput | undefined;
  defaultDate?: DateInput | undefined;
  now?: DateInput | undefined;
  nowTickInterval?: number | undefined;
  loading?: boolean | undefined;
  error?: unknown;
  defaultDuration?: number | undefined;
  levels?: readonly LevelDefinition[] | undefined;
  tags?: readonly TagDefinition[] | undefined;
  shifts?: ShiftOptions | undefined;
  compareItems?: ((a: TItem, b: TItem) => number) | undefined;
  view?: ViewKind | undefined;
  defaultView?: ViewKind | undefined;
  listOnlyBreakpoint?: number | undefined;
  list?: ListOptions | undefined;
  timeline?: TimelineOptions | undefined;
  pinning?: PinningOptions | undefined;
  compact?: boolean | 'auto' | undefined;
  compactBreakpoint?: number | undefined;
  reducedMotion?: boolean | 'auto' | undefined;
  density?: Density | undefined;
  headerExpanded?: boolean | undefined;
  defaultHeaderExpanded?: boolean | undefined;
  openItemId?: string | null | undefined;
  defaultOpenItemId?: string | null | undefined;
  openOverflowId?: string | null | undefined;
  defaultOpenOverflowId?: string | null | undefined;
  overflowColumns?: readonly SortableColumn<TItem>[] | undefined;
  overflowPageSize?: number | undefined;
  overflowSort?: OverflowSort | undefined;
  defaultOverflowSort?: OverflowSort | undefined;
  overflowPage?: number | undefined;
  defaultOverflowPage?: number | undefined;
  localization?: DeepPartial<SchedulerLocalization> | undefined;
  locale?: string | undefined;
  formatters?: Partial<SchedulerFormatters> | undefined;
  dir?: 'ltr' | 'rtl' | 'auto' | undefined;
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

export interface SchedulerStoreState {
  /** Uncontrolled values. */
  date: number;
  view: ViewKind;
  headerExpanded: boolean;
  openItemId: string | null;
  openSource: ActivationSource;
  openOverflowId: string | null;
  overflowSort: OverflowSort;
  overflowPage: number;
  /** Measured by the view layer. */
  width: number | null;
  clock: number;
  prefersReducedMotion: boolean;
  documentDir: 'ltr' | 'rtl';
  views: Readonly<Record<ViewKind, ViewState>>;
}

export interface SchedulerModel<TItem extends SchedulerItem> {
  localization: SchedulerLocalization;
  formatters: SchedulerFormatters;
  locale: string;
  /** Resolved direction; `explicitDir` is set on the root only when it did not come from the document. */
  dir: 'ltr' | 'rtl';
  explicitDir: 'ltr' | 'rtl' | undefined;
  levels: ReadonlyMap<string, ResolvedLevel>;
  tags: ReadonlyMap<string, TagDefinition>;
  compare: (a: TItem, b: TItem) => number;
  /** Pinned-strip order: `pinning.compare`, else `compare`. */
  pinCompare: (a: TItem, b: TItem) => number;
  view: ViewKind;
  compact: boolean;
  /** Pinned-chip width class from the root width: lg ≥ 900, md 600–899, sm < 600. */
  size: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
  /** Smooth scrolling and entrance animations run. */
  animate: boolean;
  density: Density;
  flags: ResolvedFlags;
  list: ResolvedListOptions;
  timeline: ResolvedTimelineOptions;
  pinRules: { list: ResolvedPinRule; timeline: ResolvedPinRule };
  date: number;
  now: number;
  loading: boolean;
  error: unknown;
  defaultDuration: number;
  shifts: readonly ShiftWindow[];
  segments: readonly ShiftSegment<TItem>[];
  /** -1 when no rendered shift has offset 0 (the views render only their root, LV-10). */
  currentIndex: number;
  current: ShiftWindow | null;
  hasItems: boolean;
  itemsById: ReadonlyMap<string, TItem>;
  geometry: TimelineGeometry;
  nowVisible: boolean;
  carriedOverCount: number;
  headerExpanded: boolean;
  openItemId: string | null;
  openItem: TItem | null;
  openSource: ActivationSource;
  /** The open id names an item that is no longer in the data (B-03: the view closes). */
  openItemMissing: boolean;
  openOverflowId: string | null;
  overflowSort: OverflowSort;
  overflowPage: number;
  overflowPageSize: number;
}

export interface SchedulerViewModel<TItem extends SchedulerItem> {
  view: ViewKind;
  facts: ScrollFacts;
  activeShift: ShiftWindow | null;
  /** Pinned-strip ids in strip order (position-pinned plus `pinned: true` items). */
  pinnedIds: readonly string[];
  pinned: readonly PinnedEntry<TItem>[];
  navigation: { top: NavState; bottom: NavState };
  scrollTopVisible: boolean;
}

export interface SchedulerController<TItem extends SchedulerItem, TEvent = unknown, TKeyEvent = TEvent> {
  /** Replaces the options. Does not notify: the owner re-renders with the new options anyway. */
  setOptions(options: SchedulerOptions<TItem, TEvent, TKeyEvent>): void;
  getOptions(): SchedulerOptions<TItem, TEvent, TKeyEvent>;
  getState: () => SchedulerStoreState;
  subscribe: (listener: () => void) => () => void;
  getModel(): SchedulerModel<TItem>;
  getViewModel(view: ViewKind): SchedulerViewModel<TItem>;
  getLayout(): TimelineLayout<TItem> | null;
  getOverflowGroup(id: string | null): OverflowGroup<TItem> | null;
  /** Marks the owner (un)mounted; an asynchronous `next()` after unmount is ignored (F-22). */
  setMounted(mounted: boolean): void;
  /** Records that `view` is shown; true when another view was shown before (a view switch). */
  noteViewShown(view: ViewKind): boolean;

  // Measurements reported by the view layer.
  setWidth(width: number): void;
  setClock(time: number): void;
  setPrefersReducedMotion(matches: boolean): void;
  setDocumentDir(dir: 'ltr' | 'rtl'): void;
  setScrollFacts(view: ViewKind, facts: ScrollFacts): void;
  /** Ids the view's pin engine pinned by position; `handlers.onPin` may veto each change. */
  setPinnedByPosition(view: ViewKind, ids: readonly string[]): void;
  /** Emits `onPinnedChange` when the strip's ids differ from the last emission for the view. */
  flushPinned(view: ViewKind): void;
  /** Resets the per-view header memory, so the next signal is compared afresh (view enter). */
  resetHeader(view: ViewKind): void;
  signalHeader(view: ViewKind, expanded: boolean, reason: HeaderReason): void;

  // Actions.
  activateItem(item: TItem, source: ActivationSource, event?: TEvent): void;
  /** Imperative open (`api`): no middleware (F-26); disabled or unknown items do not open. */
  openItem(id: string): void;
  keyDownItem(item: TItem, event: TKeyEvent, activate: () => void): void;
  closeItem(reason: CloseReason): void;
  /** Closes the view of an item that left the data (B-03); no middleware, never reopens by itself. */
  reconcileOpenItem(): void;
  activateMore(group: OverflowGroup<TItem>, event: TEvent): void;
  openOverflow(groupId: string): void;
  closeOverflow(reason: CloseReason): void;
  sortOverflow(column: string, event: TEvent): void;
  setOverflowPage(page: number, event: TEvent): void;
  navigate(view: ViewKind, position: NavPosition, event: TEvent, perform: (to: ShiftWindow) => void): void;
  /** Imperative navigation (`api`): no middleware (F-26). */
  navigateTo(view: ViewKind, to: ShiftWindow, perform: (to: ShiftWindow) => void): void;
  scrollToTop(event: TEvent, perform: () => void): void;
  setView(view: ViewKind): void;
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
    devWarnOnce(`invalid-${name}`, `The "${name}" value is not a valid date; the current time is used.`);
    return fallback;
  }
  return time;
}

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
