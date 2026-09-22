# 04 — API reference

This document is the **source of truth for every public name, type and signature**. Behaviour lives in
`01-behaviour-spec.md` for parity, `05-features.md` for extensions, and `07-parity-and-bugs.md` for fixes.

Rules:

- Every option defaults to the **parity value** (column "Default"). An extension **MUST NOT** change
  parity behaviour while it is at its default.
- Naming conventions:
  - `enableX` — feature flags;
  - `x` / `defaultX` / `onXChange` — controlled and uncontrolled state;
  - `renderX` — render props;
  - `getXProps` — prop getters in hooks;
  - `slots` / `slotProps` — part overrides;
  - `handlers.onX` — middleware;
  - `localization` — strings;
  - `classNames` / `styles` — per-part styling.
- CSS: classes `rs-<part>`, attribute `data-rs-part="<part>"`, variables `--rs-*`.
- Status marks: **v1.0** ships in the first stable release; **v1.x** is designed now and ships later.
  Everything without a mark is v1.0.

---

## 1. Package layout

| Entry | Content |
|---|---|
| `react-scheduler` *(working name; scoped name TBD — see 11)* | React components, hooks, types, presets, `classicLevels`, `classicTags` |
| `react-scheduler/core` | Framework-agnostic pure functions and types (no React, no DOM) |
| `react-scheduler/dom` | Framework-agnostic DOM engines (pinning, navigation, compact detection) used by the hooks |
| `react-scheduler/styles.css` | Stylesheet: tokens for both presets and both colour schemes, plus part styles |
| `react-scheduler/locales` | Locale packs `enUS`, `esES`, `roRO`, `huHU`, `frFR`, `deDE`, `ptPT` (tree-shakable named exports) |

- `peerDependencies`: `react` and `react-dom`, `>=18.2.0 <20`. `dependencies`: none.
- Output: ES modules with type definitions; `sideEffects: ["*.css"]`.

---

## 2. Primitive types

```ts
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
```

---

## 3. Data model

### 3.1 Levels and tags

```ts
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
  label?: string;       // default: localization.tags[key], then key
  background?: string;  // default: token --rs-color-pill-neutral
  color?: string;       // default: token --rs-color-on-pill-dark
}

/** The 9 parity levels, strongest first (see 01 §2.2). */
export const classicLevels: readonly LevelDefinition<ClassicLevelKey>[];
export type ClassicLevelKey =
  | 'critical' | 'watch' | 'monitoring' | 'capacityWatch' | 'ready'
  | 'normal' | 'onTarget' | 'routine' | 'resolved';

export const classicTags: readonly TagDefinition<ClassicTagKey>[];
export type ClassicTagKey = 'impactsNextShift' | 'carriedOver';

/** Tag key the library adds to carried-over pinned items. */
export const CARRIED_OVER_TAG = 'carriedOver';
```

`classicLevels` sets `rank` 0…8 in the order above. Its variants: `critical` is `alert` with
`pinOnPass: true`; `resolved` is `muted`; all others are `default`.

### 3.2 Item

```ts
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
export type ItemOf<L extends readonly LevelDefinition[], T extends readonly TagDefinition[] = readonly TagDefinition[], D = unknown> =
  SchedulerItem<D, L[number]['key'], T[number]['key']>;
```

### 3.3 Shifts

```ts
export interface ShiftPatternEntry {
  key: string;
  /** Start wall-clock time. The entry ends where the next entry (cyclically) starts. */
  start: WallClock;
  label?: string;
}

export interface ShiftOptions {
  /** Regular shifts: length in hours; MUST divide 24. */
  durationHours?: number;             // default 12
  /** Regular shifts: one boundary time. */
  anchor?: WallClock;                 // default '08:00'
  /** Regular shifts: keys assigned cyclically from the anchor. */
  keys?: readonly string[];           // default ['day', 'night']
  /** Irregular daily pattern; overrides durationHours/anchor/keys. At least one entry; starts strictly increasing. */
  pattern?: readonly ShiftPatternEntry[];
  /** Shifts rendered before / after the current one. */
  before?: number;                    // default 1
  after?: number;                     // default 1
}

export interface ShiftWindow {
  /** 0 = current; negative = earlier. */
  offset: number;
  role: ShiftRole;                    // sign of offset
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
  offset?: number;                    // default: -1 / 0 / 1 from role
  key?: string;
  start: DateInput;
  end: DateInput;
  items: readonly TItem[];
}
```

### 3.4 Timeline layout

```ts
export interface PlacedCard<TItem> {
  item: TItem;
  column: number;
  columns: number;
  top: number;       // px from range start
  height: number;    // px
  start: number;     // epoch ms
  end: number;       // epoch ms (resolved)
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
```

---

## 4. Components

```ts
export function Scheduler<TItem extends SchedulerItem<any, any, any>>(
  props: SchedulerProps<TItem> & { ref?: React.Ref<SchedulerHandle<TItem>> },
): JSX.Element;

/** The two views, usable standalone (same props minus the view-selection group). */
export function ListView<TItem extends SchedulerItem<any, any, any>>(props: ListViewProps<TItem>): JSX.Element;
export function TimelineView<TItem extends SchedulerItem<any, any, any>>(props: TimelineViewProps<TItem>): JSX.Element;

export type ListViewProps<TItem> = Omit<SchedulerProps<TItem>, ViewSelectionProps>;
export type TimelineViewProps<TItem> = Omit<SchedulerProps<TItem>, ViewSelectionProps>;
type ViewSelectionProps = 'view' | 'defaultView' | 'onViewChange' | 'listOnlyBreakpoint' | 'keepInactiveViewMounted';
```

Parts are exported for composition and as slot defaults (§8):

`ListCard`, `TimelineCard`, `PinnedStrip`, `PinnedChip`, `ShiftHeader`, `ShiftNavButton`,
`TimeGrid`, `MoreChip`, `OverflowDialog`, `OverflowTable`, `Pagination`, `LevelPill`, `TagPill`,
`ReferencePill`, `DiamondIcon`, `Tooltip`, `ScrollTopButton`, `DefaultItemDetail`, `EmptyState`,
`LoadingState`, `ErrorState`, `NowIndicator`.

---

## 5. `SchedulerProps<TItem>`

### 5.1 Data

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `readonly TItem[]` | `[]` | Raw items; the library buckets them into shifts. |
| `segments` | `readonly SegmentInput<TItem>[]` | — | Parity alternative to `items` (pre-bucketed). When set, `items` and `shifts` are ignored. |
| `date` / `defaultDate` / `onDateChange` | `DateInput` / `DateInput` / `(date: Date) => void` | `defaultDate`: now at mount | Selected date-time; decides the current shift. |
| `now` | `DateInput` | internal clock | When omitted, an internal clock ticks every `nowTickInterval`. |
| `nowTickInterval` | `number` (ms) | `60000` | |
| `loading` | `boolean` | `false` | Both views show the loading state (B-02). |
| `error` | `unknown` | — | Truthy → error state. |
| `onRetry` | `() => void` | — | Shows the retry action in the error state. |
| `defaultDuration` | `number` (ms) | `7200000` | Duration of items without `end`. |

### 5.2 Model

| Prop | Type | Default | Notes |
|---|---|---|---|
| `levels` | `readonly LevelDefinition[]` | `classicLevels` | Array order = rank unless `rank` is given. |
| `tags` | `readonly TagDefinition[]` | `classicTags` | |
| `shifts` | `ShiftOptions` | `{ durationHours: 12, anchor: '08:00', keys: ['day','night'], before: 1, after: 1 }` | |
| `compareItems` | `(a: TItem, b: TItem) => number` | placement order (start → rank → id) | Replaces the placement order everywhere (list, timeline sequence, strip, overflow tie-breaks). |

### 5.3 View selection (`<Scheduler>` only)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `view` / `defaultView` / `onViewChange` | `ViewKind` / `ViewKind` / `(view) => void` | `'list'` | |
| `listOnlyBreakpoint` | `number` (px) | — | Below this container width the view is forced to `'list'`; `onViewChange` is not called. Parity consumer: `600`. |
| `keepInactiveViewMounted` | `boolean` | `false` | `true` keeps the other view mounted but paused (no listeners). |

### 5.4 Per-view behaviour

| Prop | Type | Default |
|---|---|---|
| `list` | `ListOptions` | §5.10 |
| `timeline` | `TimelineOptions` | §5.10 |
| `pinning` | `PinningOptions` | §5.10 |
| `compact` | `boolean \| 'auto'` | `'auto'` (container width < `compactBreakpoint`) |
| `compactBreakpoint` | `number` (px) | `900` |
| `reducedMotion` | `boolean \| 'auto'` | `'auto'` (media query) |

### 5.5 Header signal

| Prop | Type | Default |
|---|---|---|
| `headerExpanded` / `defaultHeaderExpanded` | `boolean` | `true` |
| `onHeaderExpandedChange` | `(expanded: boolean, info: { view: ViewKind; reason: HeaderReason }) => void` | — |
| `renderHeader` | `(ctx: HeaderContext<TItem>) => ReactNode` | — (the header lives outside by default) |

```ts
export type HeaderReason = 'scroll' | 'resize' | 'empty' | 'viewEnter' | 'dataChange';
export interface HeaderContext<TItem> {
  expanded: boolean;
  view: ViewKind;
  activeShift: ShiftWindow | null;
  segments: readonly ShiftSegment<TItem>[];
}
```

- **Emission:** called only when the value **changes**. The source called it on every scroll event with the same value; the new behaviour is observably equivalent for a consumer storing the value.
- **Reason:** `info.reason` tells why the value changed.

### 5.6 Detail view

| Prop | Type | Default | Notes |
|---|---|---|---|
| `openItemId` / `defaultOpenItemId` / `onOpenItemIdChange` | `string \| null` | `null` | |
| `onItemOpen` | `(item, info: { source: ActivationSource }) => void` | — | |
| `onItemClose` | `(item, info: { reason: CloseReason }) => void` | — | |
| `renderItemDetail` | `(ctx: { item: TItem; close: () => void; source: ActivationSource }) => ReactNode` | — | Rendered while an item is open. When absent, `DefaultItemDetail` is used. |
| `enableItemDetail` | `boolean` | `true` | `false`: activation only fires callbacks. |

```ts
export type ActivationSource = 'listCard' | 'timelineCard' | 'pinnedChip' | 'overflowRow' | 'api';
export type CloseReason = 'escape' | 'backdrop' | 'closeButton' | 'itemRemoved' | 'api';
```

### 5.7 Overflow (timeline)

| Prop | Type | Default |
|---|---|---|
| `openOverflowId` / `defaultOpenOverflowId` / `onOpenOverflowIdChange` | `string \| null` | `null` |
| `overflowColumns` | `readonly OverflowColumn<TItem>[]` | `defaultOverflowColumns` (time, level, title, description, actions) |
| `overflowPageSize` | `number` | `10` |
| `overflowSort` / `defaultOverflowSort` / `onOverflowSortChange` | `{ column: string; direction: SortDirection }` | `{ column: 'time', direction: 'asc' }` |
| `overflowPage` / `defaultOverflowPage` / `onOverflowPageChange` | `number` (0-based) | `0` |

```ts
export interface OverflowColumn<TItem> {
  id: string;
  header: ReactNode | ((l: SchedulerLocalization) => ReactNode);
  align?: 'start' | 'center' | 'end';
  minWidth?: number;
  maxWidth?: number;
  /** Omit to make the column unsortable. */
  sortValue?: (item: TItem) => string | number;
  renderCell: (item: TItem, ctx: { openItem: () => void; localization: SchedulerLocalization }) => ReactNode;
}
export const defaultOverflowColumns: readonly OverflowColumn<SchedulerItem>[];
```

### 5.8 Feature flags

All default to `true` unless noted.

| Flag | Controls |
|---|---|
| `enablePinning` | pinned strip and pin-on-pass |
| `enableNavigation` | top/bottom shift navigation buttons |
| `enableCarriedOverCount` | "(N inherited)" count |
| `enableNowIndicator` | now line and label in both views (the list gains a marker, B-01) |
| `enableOffShiftBands` | timeline off-shift hour bands |
| `enableOverflowDialog` | "+more" opens the dialog (`false`: only `onOverflowOpen` fires) |
| `enableScrollTopButton` | compact scroll-to-top button |
| `enableHeaderSignal` | header-expanded computation and callback |
| `enableTooltips` | tooltips on navigation and table actions |
| `enableAnimations` | chip entrance and smooth scrolling (still off under reduced motion) |
| `enableItemDetail` | §5.6 |

### 5.9 Events

| Prop | Signature |
|---|---|
| `onActiveShiftChange` | `(shift: ShiftWindow, info: { view: ViewKind }) => void` |
| `onPinnedChange` | `(ids: readonly string[], diff: { added: readonly string[]; removed: readonly string[] }) => void` |
| `onNavigate` | `(info: { from: ShiftWindow; to: ShiftWindow; position: 'top' \| 'bottom' \| 'api'; view: ViewKind }) => void` |
| `onVisibleRangeChange` | `(range: { start: Date; end: Date }) => void` — first shift start to last shift end; fired on mount and whenever it changes |
| `onLayout` | `(layout: TimelineLayout<TItem>) => void` — after each timeline layout computation |
| `onOverflowOpen` / `onOverflowClose` | `(group: OverflowGroup<TItem>) => void` |
| `onScrollTop` | `() => void` |

The detail, header, view, date and overflow state callbacks are listed with their props above.

### 5.10 Behaviour options (defaults = parity)

```ts
export interface ListOptions {
  navigationThreshold?: number;       // 5 — navigation shows only if some shift has ≥ N items
  alignOffset?: number;               // 8 — gap between sticky top and a landed shift header
  previousJumpExtraOffset?: number;   // 104 — extra offset when jumping to an earlier shift
  segmentEpsilon?: number;            // 8
  collapseMinItems?: number;          // 3 — header may collapse only if the current shift has more items than this
  collapseAfterCards?: number;        // 3 — collapse after the Nth card of the current shift
  collapseMargin?: number;            // 32
  scrollTopThreshold?: number;        // 96
  landing?: {
    initial?: LandingTarget;          // 'shiftStart'
    onDateChange?: LandingTarget;     // 'shiftStart'
    onViewEnter?: LandingTarget;      // 'none'
  };
}

export interface TimelineOptions {
  hourHeight?: number;                // 172 (density may change the default, 06 §4)
  maxColumns?: number;                // 3
  maxColumnsCrowded?: number;         // 3 — cap when more than maxColumns items overlap
  maxColumnsCompact?: number;         // 1 — crowded cap in compact mode
  minCardHeight?: number;             // 80
  cardGap?: number;                   // 4
  columnPlacement?: 'priority' | 'time'; // 'priority'
  overflowMergeWindow?: number;       // 7200000 (2 h). Infinity reproduces the source's chain merge (B-10)
  leadMinutes?: number;               // 30 — landing/navigation leaves this much time above the target
  nearBottomGutterMinutes?: number;   // 30
  viewEnterRealignDelay?: number;     // 280 (ms)
  hourLabelFormat?: 'compact' | 'locale'; // 'compact' ("8AM" in en-US; see 05 F-12)
  landing?: {
    initial?: LandingTarget;          // 'shiftStart'
    onDateChange?: LandingTarget;     // 'dateNearBottom'
    onViewEnter?: LandingTarget;      // 'dateNearBottom'
  };
}

export interface PinningOptions {
  list?: { edge?: 'top' | 'bottom'; epsilon?: number; hysteresis?: number };     // { 'top', 2, 24 }
  timeline?: { edge?: 'top' | 'bottom'; epsilon?: number; hysteresis?: number }; // { 'bottom', 0, 0 }
  /** Pinned-strip order. Default: placement order. */
  compare?: (a: SchedulerItem, b: SchedulerItem) => number;
}
```

### 5.11 Handlers (middleware)

```ts
export type Middleware<C> = (ctx: C, next: () => void) => void;

export interface SchedulerHandlers<TItem> {
  onItemActivate?: Middleware<{ item: TItem; source: ActivationSource; event?: React.SyntheticEvent }>;
  onItemKeyDown?: Middleware<{ item: TItem; event: React.KeyboardEvent }>;
  onNavigate?: Middleware<{ from: ShiftWindow; to: ShiftWindow; position: 'top' | 'bottom'; event: React.SyntheticEvent }>;
  onMoreActivate?: Middleware<{ group: OverflowGroup<TItem>; event: React.SyntheticEvent }>;
  onScrollTop?: Middleware<{ event: React.SyntheticEvent }>;
  onOverflowSort?: Middleware<{ sort: { column: string; direction: SortDirection }; event: React.SyntheticEvent }>;
  onOverflowPage?: Middleware<{ page: number; event: React.SyntheticEvent }>;
  onOverflowClose?: Middleware<{ group: OverflowGroup<TItem>; reason: CloseReason }>;
  onDetailClose?: Middleware<{ item: TItem; reason: CloseReason }>;
  onPin?: Middleware<{ item: TItem; pinned: boolean }>;
  onHeaderSignal?: Middleware<{ expanded: boolean; view: ViewKind; reason: HeaderReason }>;
}
```

Order: middleware → (if `next()` was called) default behaviour → state update → event callbacks.
Not calling `next()` cancels the default behaviour and its callbacks.

### 5.12 Render props

| Prop | Signature | Replaces |
|---|---|---|
| `renderItem` | `(item, ctx: { view; variant; compact; defaultRender: () => ReactNode }) => ReactNode` | whole card |
| `renderCardContent` | `(item, ctx) => ReactNode` | inside the card activator (keeps the card shell) |
| `renderTimeLabel` | `(item, ctx: { defaultLabel: string }) => ReactNode` | time label |
| `renderShiftHeader` | `(segment, ctx: { defaultTitle; rangeLabel }) => ReactNode` | shift header content |
| `renderItemDetail` | §5.6 | detail view |
| `renderPinnedChip` | `(item, ctx: { carriedOver: boolean; defaultRender }) => ReactNode` | chip |
| `renderNavLabel` | `(ctx: { position; target: ShiftWindow \| null; disabled; carriedOverCount }) => ReactNode` | nav button content |
| `renderMoreLabel` | `(group) => ReactNode` | "+more" label |
| `renderEmpty` | `(ctx: { scope: 'all' \| 'shift'; segment?: ShiftSegment<TItem> }) => ReactNode` | empty states |
| `renderLoading` | `() => ReactNode` | loading state |
| `renderError` | `(ctx: { error: unknown; retry?: () => void }) => ReactNode` | error state |
| `renderHeader` | §5.5 | header slot |

Overflow cells use `OverflowColumn.renderCell`.

### 5.13 Customization

| Prop | Type | Default |
|---|---|---|
| `preset` | `PresetName` | `'default'` (`'classic'` = pixel parity) |
| `colorScheme` | `ColorScheme` | `'light'` |
| `density` | `Density` | `'standard'` |
| `tokens` | `Partial<Record<TokenName, string>>` | — (inline CSS variables on the root) |
| `unstyled` | `boolean` | `false` |
| `className` / `style` | root | — |
| `classNames` | `Partial<Record<SchedulerPart, string>>` | — |
| `styles` | `Partial<Record<SchedulerPart, React.CSSProperties>>` | — |
| `slots` | `Partial<SchedulerSlots<TItem>>` | — |
| `slotProps` | `Partial<SchedulerSlotProps<TItem>>` | — |

`TokenName`, `SchedulerPart`, `SchedulerSlots` and `SchedulerSlotProps` are defined in
`06-customization-theming.md` and exported as types.

### 5.14 Localization and accessibility

| Prop | Type | Default |
|---|---|---|
| `localization` | `DeepPartial<SchedulerLocalization>` | `enUS` |
| `locale` | `string` (BCP 47) | `localization.locale` |
| `formatters` | `Partial<SchedulerFormatters>` | built on `Intl` with `locale` |
| `dir` | `'ltr' \| 'rtl' \| 'auto'` | `'auto'` (from `localization.dir`, then the document) |
| `aria-label` | `string` | — (root `region` name) |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | `3` (shift headers) |
| `id` | `string` | generated; prefix for element ids |

```ts
export interface SchedulerFormatters {
  clockTime(date: Date): string;                     // "10:30 AM"
  hourLabel(date: Date): string;                     // "8AM"
  shiftRange(start: Date, end: Date): string;        // "Mar 12, 8 AM - Mar 12, 8 PM"
  timeRange(start: Date, end: Date): string;         // "9:00 AM – 10:30 AM"
  sinceTimestamp(date: Date): string;                // "03/12/2031 07:45 AM" in en-US
  dateTime(date: Date): string;                      // overflow time column
}
```

---

## 6. Imperative handle

```ts
export interface SchedulerHandle<TItem> {
  scrollToShift(target: number | ShiftRole, options?: { smooth?: boolean; align?: 'start' | 'nearBottom' }): void;
  scrollToTime(time: DateInput, options?: { smooth?: boolean; align?: 'start' | 'center' | 'nearBottom' }): void;
  scrollToItem(id: string, options?: { smooth?: boolean }): void;
  openItem(id: string): void;
  closeItem(): void;
  openOverflow(groupId: string): void;
  closeOverflow(): void;
  refreshPinning(): void;
  getPinnedIds(): readonly string[];
  getActiveShift(): ShiftWindow | null;
  getLayout(): TimelineLayout<TItem> | null;
  getScrollElement(): HTMLElement | null;
  focusItem(id: string): void;
}
```

---

## 7. Hooks (headless)

```ts
/** Everything <Scheduler> uses, without any markup. */
export function useScheduler<TItem>(props: SchedulerProps<TItem>): SchedulerState<TItem>;

export interface SchedulerState<TItem> {
  view: ViewKind;
  compact: boolean;
  shifts: readonly ShiftWindow[];
  segments: readonly ShiftSegment<TItem>[];
  activeShift: ShiftWindow | null;
  pinned: readonly TItem[];
  carriedOverCount: number;
  headerExpanded: boolean;
  layout: TimelineLayout<TItem> | null;       // timeline only
  now: number;
  nowVisible: boolean;
  openItem: TItem | null;
  openOverflow: OverflowGroup<TItem> | null;
  navigation: { top: NavState; bottom: NavState };
  localization: SchedulerLocalization;
  formatters: SchedulerFormatters;
  actions: SchedulerHandle<TItem>;
  getRootProps(): HTMLAttributes;
  getScrollerProps(): HTMLAttributes & { ref: Ref<HTMLElement> };
  getStickyTopProps(): HTMLAttributes & { ref: Ref<HTMLElement> };
  getNavButtonProps(position: 'top' | 'bottom'): ButtonHTMLAttributes;
  getSectionProps(segment: ShiftSegment<TItem>): HTMLAttributes & { ref: Ref<HTMLElement> };
  getItemProps(item: TItem, view: ViewKind): HTMLAttributes & { ref: Ref<HTMLElement> };
  getPinSentinelProps(item: TItem): HTMLAttributes & { ref: Ref<HTMLElement> };
  getPinnedChipProps(item: TItem): ButtonHTMLAttributes;
  getMoreChipProps(group: OverflowGroup<TItem>): ButtonHTMLAttributes & { ref: Ref<HTMLElement> };
  getScrollTopButtonProps(): ButtonHTMLAttributes;
}

export interface NavState {
  visible: boolean;
  disabled: boolean;
  target: ShiftWindow | null;
  label: string;             // visible label
  hint: string;              // tooltip / accessible description
  carriedOverCount: number;  // top only
}

export function useShiftModel<TItem>(input: {
  items?: readonly TItem[];
  segments?: readonly SegmentInput<TItem>[];
  date: DateInput;
  shifts?: ShiftOptions;
  levels?: readonly LevelDefinition[];
  compareItems?: (a: TItem, b: TItem) => number;
  defaultDuration?: number;
}): { shifts: readonly ShiftWindow[]; segments: readonly ShiftSegment<TItem>[]; current: ShiftWindow };

export function useTimelineLayout<TItem>(items: readonly TItem[], options: TimelineLayoutOptions<TItem>): TimelineLayout<TItem>;

export function usePinOnPass(options: {
  scrollRef: RefObject<HTMLElement>;
  /** Returns the pin line in viewport coordinates. */
  getLine: () => number;
  edge: 'top' | 'bottom';
  epsilon: number;
  hysteresis: number;
  resetKey?: unknown;
  enabled?: boolean;
}): {
  pinnedKeys: readonly string[];
  register(key: string, ids: readonly string[]): (node: HTMLElement | null) => void;
  refresh(options?: { force?: boolean }): void;
  pause(): void;
  resume(): void;
};

export function useShiftNavigation(/* scroller, anchors, options */): {
  scrollTo(target: number, options?: { smooth?: boolean; extraOffset?: number; align?: 'start' | 'nearBottom'; time?: number }): void;
};

export function useNow(input?: { now?: DateInput; interval?: number }): number;
export function useCompact(ref: RefObject<HTMLElement>, options?: { compact?: boolean | 'auto'; breakpoint?: number }): boolean;
```

---

## 8. Core (`react-scheduler/core`)

```ts
export function toMs(input: DateInput): number;                     // NaN when invalid
export function resolveEnd(start: number, end: DateInput | undefined, defaultDuration: number): number;
export function resolveShift(date: DateInput, options?: ShiftOptions): ShiftWindow;                         // offset 0
export function getShiftWindows(date: DateInput, options?: ShiftOptions): readonly ShiftWindow[];           // before..after
export function bucketItems<TItem extends SchedulerItem>(items: readonly TItem[], windows: readonly ShiftWindow[], options?: { compareItems?; levels?; defaultDuration? }): readonly ShiftSegment<TItem>[];
export function resolveLevels(levels: readonly LevelDefinition[]): ReadonlyMap<string, Required<Pick<LevelDefinition, 'key' | 'rank' | 'variant' | 'pinOnPass'>> & LevelDefinition>;
export function compareByPlacement(levels: ReadonlyMap<string, { rank: number }>): (a: SchedulerItem, b: SchedulerItem) => number;
export function computeTimelineLayout<TItem extends SchedulerItem>(items: readonly TItem[], options: TimelineLayoutOptions<TItem>): TimelineLayout<TItem>;
export function resolveTimeLabel(item: SchedulerItem, localization: SchedulerLocalization, formatters: SchedulerFormatters, defaultDuration: number): string;
export function createFormatters(locale: string, options?: { hourLabelFormat?: 'compact' | 'locale' }): SchedulerFormatters;
export function sortOverflowItems<TItem>(items: readonly TItem[], sort: { column: string; direction: SortDirection }, columns: readonly OverflowColumn<TItem>[], compare: (a: TItem, b: TItem) => number): TItem[];
export function pageList(currentPage: number, totalPages: number): readonly (number | 'ellipsis')[];
export function interpolate(template: string | PluralForms, values: Record<string, string | number>, locale: string): string;

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
```

`react-scheduler/dom` exports `createPinEngine`, `createNavigator`, `observeCompact` and `prefersReducedMotion` — the DOM engines behind the hooks, with the same options.

---

## 9. Presets, tokens and locales

```ts
export const presets: Record<PresetName, Record<'light' | 'dark', Record<TokenName, string>>>;
export { enUS, esES, roRO, huHU, frFR, deDE, ptPT } from 'react-scheduler/locales';
export interface SchedulerLocalization { /* full key list in 06 §6 */ }
export type PluralForms = { other: string } & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>;
```

- **Presets on the DOM:** the root carries `data-rs-preset`, `data-rs-scheme` and `data-rs-density`.
- **Colour scheme:** `colorScheme="system"` follows `prefers-color-scheme`.

---

## 10. Parity mapping (the source consumer)

| Source usage | New API |
|---|---|
| Compact page (< 600 px) mounting only the list view | `<Scheduler listOnlyBreakpoint={600} …>` (the view is forced to `list` below 600 px) |
| Desktop page mounting both views, toggled by the header | `<Scheduler view={view} onViewChange={setView}>` (only the active view is mounted, B-14) |
| Data hook output: segmented shifts, selected date, now, loading | `items` (raw) or `segments`, `date`, `now`, `loading` |
| Per-view header visibility in a store | `onHeaderExpandedChange(expanded, { view })` → store per view; pass `headerExpanded` of the active view |
| Critical / standard detail dialogs | `renderItemDetail={({ item, close }) => item.data.kind === 'critical' ? <A/> : <B/>}` |
| Theme mode | `colorScheme={mode}` with `preset="classic"` |
| Language | `localization={esES}` etc. The reference label and overflow domain column are localized or dropped by the consumer. |

Mapping a source item: `level` = severity (snake case → camel case); `tags` renamed as in the naming map;
`suggestion`; `reference` = the source reference number; `observedLabel` for critical-kind items;
`since` for standard items with a ready timestamp; `data` = the original detail payload.
