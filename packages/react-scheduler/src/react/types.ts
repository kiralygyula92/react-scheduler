// SPDX-License-Identifier: MIT
// Public types of the React layer (Feature Dossier 04 §4–§7, 06 §1.1). Names follow 04 exactly;
// additions are recorded in docs/adr/0003-react-adapter.md.
import type {
  ButtonHTMLAttributes,
  ComponentType,
  CSSProperties,
  ElementType,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  Ref,
  SyntheticEvent,
} from 'react';
import type {
  NavPosition,
  OverflowSort,
  SchedulerHandlers as CoreHandlers,
  SchedulerOptions,
} from '../core/controller';
import type { SchedulerFormatters } from '../core/format';
import type { SchedulerLocalization } from '../core/localization';
import type { NavState } from '../core/navigation';
import type {
  ActivationSource,
  CardVariant,
  ColorScheme,
  DateInput,
  Density,
  LevelDefinition,
  OverflowGroup,
  PresetName,
  SchedulerItem,
  ShiftRole,
  ShiftSegment,
  ShiftWindow,
  TimelineLayout,
  ViewKind,
} from '../core/types';
import type { TokenName } from './tokens';

export type { NavPosition, OverflowSort };

/** Interaction middleware with React events (Feature Dossier 04 §5.11). */
export type SchedulerHandlers<TItem> = CoreHandlers<TItem, SyntheticEvent, KeyboardEvent>;

// ---------------------------------------------------------------------------- parts and slots

/** Every visible part (Feature Dossier 06 §1). */
export type SchedulerPart =
  | 'root'
  | 'header'
  | 'stickyTop'
  | 'stickyBottom'
  | 'scroller'
  | 'body'
  | 'pinnedStrip'
  | 'pinnedStripTrack'
  | 'pinnedChip'
  | 'edgeFade'
  | 'liveRegion'
  | 'navButton'
  | 'carriedOverCount'
  | 'shiftSection'
  | 'shiftHeader'
  | 'shiftHeaderTitle'
  | 'shiftHeaderRange'
  | 'shiftEmpty'
  | 'itemList'
  | 'listCard'
  | 'timelineCard'
  | 'cardActivator'
  | 'cardRail'
  | 'cardTitle'
  | 'cardDescription'
  | 'cardTimeLabel'
  | 'cardSuggestion'
  | 'cardPills'
  | 'levelPill'
  | 'tagPill'
  | 'referencePill'
  | 'pillIcon'
  | 'pinSentinel'
  | 'nowMarker'
  | 'timeGrid'
  | 'timeGutter'
  | 'hourLabel'
  | 'gridBox'
  | 'offShiftBand'
  | 'hourLine'
  | 'nowLine'
  | 'nowLabel'
  | 'laneStartPad'
  | 'laneEndPad'
  | 'lane'
  | 'moreChip'
  | 'overflowDialog'
  | 'overflowTable'
  | 'pagination'
  | 'detailDialog'
  | 'emptyState'
  | 'loadingState'
  | 'errorState'
  | 'scrollTopButton'
  | 'tooltip';

/** What a part is rendering for (Feature Dossier 06 §1.1). */
export interface OwnerState<TItem> {
  view: ViewKind;
  compact: boolean;
  preset: PresetName;
  colorScheme: 'light' | 'dark';
  density: Density;
  dir: 'ltr' | 'rtl';
  item?: TItem | undefined;
  level?: LevelDefinition | undefined;
  variant?: CardVariant | undefined;
  shift?: ShiftWindow | undefined;
  position?: NavPosition | undefined;
  disabled?: boolean | undefined;
  pinned?: boolean | undefined;
  carriedOver?: boolean | undefined;
  active?: boolean | undefined;
}

/**
 * What every slot receives: the part’s own props, its owner state and the default component.
 *
 * @category Slots
 * @since 1.0.0
 */
export interface BaseSlotProps<TItem> {
  ownerState: OwnerState<TItem>;
  /** `rs-<part>` + library classes + `slotProps` className + `classNames[part]`. */
  className: string;
  /** Structural inline styles + `slotProps` style + `styles[part]`. */
  style?: CSSProperties | undefined;
  'data-rs-part': string;
  /** MUST be attached: pinning, measuring and focus depend on it. */
  ref?: Ref<never> | undefined;
  children?: ReactNode;
  /** The default element or component of the part, to wrap or render (docs pack 09 §4.3). */
  Default: ElementType;
}

/** Part-specific extras beyond the element attributes. */
export interface PartExtraProps {
  navButton: { navState: NavState };
}

/** Props a slot component receives: the element's attributes plus the base slot props. */
export type SlotProps<P extends SchedulerPart, TItem> = BaseSlotProps<TItem> &
  Omit<HTMLAttributes<HTMLElement> & ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style' | 'children'> &
  (P extends keyof PartExtraProps ? PartExtraProps[P] : unknown) & { [attribute: `data-${string}`]: unknown };

/**
 * The component for each part, replacing the library’s own.
 *
 * @category Slots
 * @since 1.0.0
 */
export type SchedulerSlots<TItem> = { [P in SchedulerPart]: ComponentType<SlotProps<P, TItem>> };

/** What `slotProps` may set on a part: its attributes, and a ref that is composed with the library's. */
type PartOverrides<P extends SchedulerPart, TItem> = Partial<
  Omit<SlotProps<P, TItem>, 'ownerState' | 'Default' | 'ref'> & { ref: Ref<HTMLElement> }
>;

/**
 * Extra props for each part, fixed or computed from the state around it.
 *
 * @category Slots
 * @since 1.0.0
 */
export type SchedulerSlotProps<TItem> = {
  [P in SchedulerPart]: PartOverrides<P, TItem> | ((ownerState: OwnerState<TItem>) => PartOverrides<P, TItem>);
};

// ---------------------------------------------------------------------------- render props

/**
 * What `renderHeader` receives: the signal, the view and the rendered shifts.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface HeaderContext<TItem> {
  expanded: boolean;
  view: ViewKind;
  activeShift: ShiftWindow | null;
  segments: readonly ShiftSegment<TItem>[];
}

/**
 * What `renderItem` receives, including the props a custom card has to spread.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface RenderItemContext<TItem> {
  item: TItem;
  view: ViewKind;
  variant: CardVariant;
  compact: boolean;
  /** The built-in card. */
  defaultRender: () => ReactNode;
  /** Props for the activator; spreading them is required (F-23). */
  getItemProps: () => ItemProps;
  /** Props for the pin sentinel of a pinnable item (pinning needs it). */
  getPinSentinelProps: () => PinSentinelProps | null;
  /** Timeline: the card's structural geometry (absolute position and size). */
  style: CSSProperties | undefined;
}

/**
 * What `renderCardContent` receives: the item, its level and the computed time label.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface CardContentContext<TItem> {
  view: ViewKind;
  variant: CardVariant;
  compact: boolean;
  level: LevelDefinition | undefined;
  timeLabel: string;
  defaultRender: () => ReactNode;
  item: TItem;
}

/**
 * What `renderNavLabel` receives: the target shift and the carried-over count.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface NavLabelContext {
  position: NavPosition;
  target: ShiftWindow | null;
  disabled: boolean;
  carriedOverCount: number;
}

/**
 * What `renderEmpty` receives: whether the whole day or one shift is empty.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface EmptyContext<TItem> {
  scope: 'all' | 'shift';
  segment?: ShiftSegment<TItem> | undefined;
}

/**
 * What `renderItemDetail` receives: the item, how it was opened and a way to close it.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface ItemDetailContext<TItem> {
  item: TItem;
  close: () => void;
  source: ActivationSource;
}

// ---------------------------------------------------------------------------- overflow columns

/**
 * What an overflow cell receives: the strings and a way to open the item.
 *
 * @category Overflow
 * @since 1.0.0
 */
export interface OverflowCellContext {
  openItem: () => void;
  localization: SchedulerLocalization;
}

/**
 * One column of the overflow table: its header, its cell and how it sorts.
 *
 * @category Overflow
 * @since 1.0.0
 */
export interface OverflowColumn<TItem> {
  id: string;
  header: ReactNode | ((localization: SchedulerLocalization) => ReactNode);
  align?: 'start' | 'center' | 'end' | undefined;
  minWidth?: number | undefined;
  /** Equal to `minWidth`, the column has that fixed width and takes no share of the spare width. */
  maxWidth?: number | undefined;
  /** Omit to make the column unsortable. */
  sortValue?: ((item: TItem) => string | number) | undefined;
  renderCell: (item: TItem, ctx: OverflowCellContext) => ReactNode;
}

// ---------------------------------------------------------------------------- props

type ReactOptions<TItem extends SchedulerItem> = Omit<
  SchedulerOptions<TItem, SyntheticEvent, KeyboardEvent>,
  'handlers' | 'overflowColumns'
>;

/**
 * Everything `<Scheduler>` accepts: the controller’s options plus rendering, slots and styling.
 *
 * @category Props
 * @since 1.0.0
 */
export interface SchedulerProps<TItem extends SchedulerItem = SchedulerItem> extends ReactOptions<TItem> {
  /**
   * Middleware that runs before each interaction and can change or cancel it.
   *
   * @category Handlers
   * @since 1.0.0
   */
  handlers?: SchedulerHandlers<TItem> | undefined;
  /**
   * The columns of the overflow dialog's table, in order.
   *
   * @defaultValue defaultOverflowColumns
   * @category Overflow
   * @since 1.0.0
   */
  overflowColumns?: readonly OverflowColumn<TItem>[] | undefined;
  /**
   * `<Scheduler>` only: the view that is not showing stays mounted but paused, so switching back is
   * instant and its scroll position survives.
   *
   * @defaultValue false
   * @category View
   * @since 1.0.0
   */
  keepInactiveViewMounted?: boolean | undefined;
  /**
   * Shows the retry action in the error state and is called when it is used.
   *
   * @category States
   * @since 1.0.0
   */
  onRetry?: (() => void) | undefined;

  /**
   * Replaces the whole card. `ctx.defaultRender()` gives the built-in one back.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderItem?: ((item: TItem, ctx: RenderItemContext<TItem>) => ReactNode) | undefined;
  /**
   * Replaces the inside of a card while keeping its frame, activation and pinning.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderCardContent?: ((item: TItem, ctx: CardContentContext<TItem>) => ReactNode) | undefined;
  /**
   * Replaces the time label of a card.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderTimeLabel?: ((item: TItem, ctx: { defaultLabel: string }) => ReactNode) | undefined;
  /**
   * Replaces a shift's header row.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderShiftHeader?:
    ((segment: ShiftSegment<TItem>, ctx: { defaultTitle: string; rangeLabel: string }) => ReactNode) | undefined;
  /**
   * Replaces the detail view of an open item.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderItemDetail?: ((ctx: ItemDetailContext<TItem>) => ReactNode) | undefined;
  /**
   * Replaces a chip in the pinned strip.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderPinnedChip?:
    ((item: TItem, ctx: { carriedOver: boolean; defaultRender: () => ReactNode }) => ReactNode) | undefined;
  /**
   * Replaces the label of a navigation button.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderNavLabel?: ((ctx: NavLabelContext) => ReactNode) | undefined;
  /**
   * Replaces the label of a "+more" chip.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderMoreLabel?: ((group: OverflowGroup<TItem>) => ReactNode) | undefined;
  /**
   * Replaces the empty state. `ctx.scope` says whether the whole day or one shift is empty.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderEmpty?: ((ctx: EmptyContext<TItem>) => ReactNode) | undefined;
  /**
   * Replaces the loading state.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderLoading?: (() => ReactNode) | undefined;
  /**
   * Replaces the error state.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderError?: ((ctx: { error: unknown; retry?: (() => void) | undefined }) => ReactNode) | undefined;
  /**
   * Replaces the sticky area above the items, which holds the pinned strip and the navigation.
   *
   * @category Rendering
   * @since 1.0.0
   */
  renderHeader?: ((ctx: HeaderContext<TItem>) => ReactNode) | undefined;

  /**
   * Which bundled look to render: the library's own, or the classic one it reproduces.
   *
   * @defaultValue 'default'
   * @category Appearance
   * @since 1.0.0
   */
  preset?: PresetName | undefined;
  /**
   * Light or dark; `'system'` follows the reader's setting.
   *
   * @defaultValue 'system'
   * @category Appearance
   * @since 1.0.0
   */
  colorScheme?: ColorScheme | undefined;
  /**
   * Overrides single design tokens on the root element.
   *
   * @category Appearance
   * @since 1.0.0
   */
  tokens?: Partial<Record<TokenName, string>> | undefined;
  /**
   * Renders the structure without the stylesheet's looks, for a design of your own built on
   * `classNames`.
   *
   * @defaultValue false
   * @category Appearance
   * @since 1.0.0
   */
  unstyled?: boolean | undefined;
  /**
   * Class for the root element.
   *
   * @category Appearance
   * @since 1.0.0
   */
  className?: string | undefined;
  /**
   * Inline style for the root element.
   *
   * @category Appearance
   * @since 1.0.0
   */
  style?: CSSProperties | undefined;
  /**
   * A class per part, added to the library's own.
   *
   * @category Appearance
   * @since 1.0.0
   */
  classNames?: Partial<Record<SchedulerPart, string>> | undefined;
  /**
   * An inline style per part.
   *
   * @category Appearance
   * @since 1.0.0
   */
  styles?: Partial<Record<SchedulerPart, CSSProperties>> | undefined;
  /**
   * Replaces the component that renders a part, keeping its place and its props.
   *
   * @category Slots
   * @since 1.0.0
   */
  slots?: Partial<SchedulerSlots<TItem>> | undefined;
  /**
   * Extra props for a part, either fixed or computed from the state around it.
   *
   * @category Slots
   * @since 1.0.0
   */
  slotProps?: Partial<SchedulerSlotProps<TItem>> | undefined;

  /**
   * The accessible name of the scheduler region.
   *
   * @defaultValue `localization.regionLabel`
   * @category Accessibility
   * @since 1.0.0
   */
  'aria-label'?: string | undefined;
  /**
   * The heading level shift headers use, so they fit the page's outline.
   *
   * @defaultValue 3
   * @min 2
   * @max 6
   * @step 1
   * @category Accessibility
   * @since 1.0.0
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /**
   * Prefix for the ids of the rendered elements.
   *
   * @defaultValue a generated id
   * @category Accessibility
   * @since 1.0.0
   */
  id?: string | undefined;
}

type ViewSelectionProps = 'view' | 'defaultView' | 'onViewChange' | 'listOnlyBreakpoint' | 'keepInactiveViewMounted';

/**
 * What `<ListView>` accepts: the scheduler props without the view selection.
 *
 * @category Props
 * @since 1.0.0
 */
export type ListViewProps<TItem extends SchedulerItem = SchedulerItem> = Omit<
  SchedulerProps<TItem>,
  ViewSelectionProps
>;
/**
 * What `<TimelineView>` accepts: the scheduler props without the view selection.
 *
 * @category Props
 * @since 1.0.0
 */
export type TimelineViewProps<TItem extends SchedulerItem = SchedulerItem> = Omit<
  SchedulerProps<TItem>,
  ViewSelectionProps
>;

// ---------------------------------------------------------------------------- handle and hook state

/**
 * The imperative handle: scrolling, opening and closing, and reading the current state.
 *
 * @category Imperative
 * @since 1.0.0
 */
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

/**
 * Props a headless host spreads onto one of the library’s elements.
 *
 * @category Headless
 * @since 1.0.0
 */
export type ElementProps<E extends HTMLElement = HTMLElement> = HTMLAttributes<E> & {
  /** A callback ref, so the props spread onto any element. */
  ref: (node: HTMLElement | null) => void;
  'data-rs-part': string;
};

/**
 * Props a custom card spreads onto its activator, so activation and keyboard work.
 *
 * @category Headless
 * @since 1.0.0
 */
export type ItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref: Ref<HTMLButtonElement>;
  'data-rs-part': string;
};

/**
 * Props a custom card spreads onto its pin sentinel, so pinning can observe it.
 *
 * @category Headless
 * @since 1.0.0
 */
export type PinSentinelProps = HTMLAttributes<HTMLSpanElement> & {
  ref: Ref<HTMLSpanElement>;
  'data-rs-part': string;
  'data-rs-edge': 'top' | 'bottom';
};

/** Everything `<Scheduler>` uses, without markup (Feature Dossier 04 §7). */
export interface SchedulerState<TItem extends SchedulerItem> {
  view: ViewKind;
  compact: boolean;
  shifts: readonly ShiftWindow[];
  segments: readonly ShiftSegment<TItem>[];
  activeShift: ShiftWindow | null;
  pinned: readonly TItem[];
  carriedOverCount: number;
  headerExpanded: boolean;
  /** Timeline only. */
  layout: TimelineLayout<TItem> | null;
  now: number;
  nowVisible: boolean;
  openItem: TItem | null;
  openOverflow: OverflowGroup<TItem> | null;
  navigation: { top: NavState; bottom: NavState };
  localization: SchedulerLocalization;
  formatters: SchedulerFormatters;
  actions: SchedulerHandle<TItem>;
  getRootProps(): HTMLAttributes<HTMLDivElement> & { ref: Ref<HTMLDivElement> };
  getScrollerProps(): ElementProps;
  getStickyTopProps(): ElementProps;
  getNavButtonProps(position: NavPosition): ButtonHTMLAttributes<HTMLButtonElement>;
  getSectionProps(segment: ShiftSegment<TItem>): ElementProps;
  getItemProps(item: TItem, view?: ViewKind): ItemProps;
  getPinSentinelProps(item: TItem): PinSentinelProps;
  getPinnedChipProps(item: TItem): ButtonHTMLAttributes<HTMLButtonElement>;
  getMoreChipProps(group: OverflowGroup<TItem>): ButtonHTMLAttributes<HTMLButtonElement> & {
    ref: Ref<HTMLButtonElement>;
  };
  getScrollTopButtonProps(): ButtonHTMLAttributes<HTMLButtonElement>;
}
