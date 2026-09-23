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
  /** The view the part is being rendered in. */
  view: ViewKind;
  /** Whether the schedule is in compact mode. */
  compact: boolean;
  /** The preset in force. */
  preset: PresetName;
  /** The resolved color scheme; `system` has already been resolved to one of the two. */
  colorScheme: 'light' | 'dark';
  /** The spacing scale in force. */
  density: Density;
  /** The writing direction the schedule renders in. */
  dir: 'ltr' | 'rtl';
  /** The item the part belongs to, on the parts of a card. */
  item?: TItem | undefined;
  /** The item's level, resolved from the scale. */
  level?: LevelDefinition | undefined;
  /** The card treatment the level asks for. */
  variant?: CardVariant | undefined;
  /** The shift the part belongs to, on the parts of a section. */
  shift?: ShiftWindow | undefined;
  /** Which navigation button, on the navigation parts. */
  position?: NavPosition | undefined;
  /** Whether the part is disabled. */
  disabled?: boolean | undefined;
  /** Whether the item is currently pinned. */
  pinned?: boolean | undefined;
  /** Whether the item comes from a shift that has already passed. */
  carriedOver?: boolean | undefined;
  /** Whether this is the active one of its kind, such as the shift being read. */
  active?: boolean | undefined;
}

/**
 * What every slot receives: the part’s own props, its owner state and the default component.
 *
 * @category Slots
 * @since 1.0.0
 */
export interface BaseSlotProps<TItem> {
  /** What the part is rendering for: the view, the scheme, the item, the shift. */
  ownerState: OwnerState<TItem>;
  /** `rs-<part>` + library classes + `slotProps` className + `classNames[part]`. */
  className: string;
  /** Structural inline styles + `slotProps` style + `styles[part]`. */
  style?: CSSProperties | undefined;
  /** The name of the part, which the stylesheet and the tests select on. */
  'data-rs-part': string;
  /** MUST be attached: pinning, measuring and focus depend on it. */
  ref?: Ref<never> | undefined;
  /** The part's own content, to render inside whatever replaces it. */
  children?: ReactNode;
  /** The default element or component of the part, to wrap or render (docs pack 09 §4.3). */
  Default: ElementType;
}

/** Part-specific extras beyond the element attributes. */
export interface PartExtraProps {
  /** The navigation button also receives its state: where it points and whether it is disabled. */
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
  /** The current value of the header signal. */
  expanded: boolean;
  /** The view being rendered. */
  view: ViewKind;
  /** The shift being read, or `null` before the first measurement. */
  activeShift: ShiftWindow | null;
  /** Every rendered shift with its items, in order. */
  segments: readonly ShiftSegment<TItem>[];
}

/**
 * What `renderItem` receives, including the props a custom card has to spread.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface RenderItemContext<TItem> {
  /** The item to render. */
  item: TItem;
  /** The view the card is being rendered in. */
  view: ViewKind;
  /** The card treatment the level asks for. */
  variant: CardVariant;
  /** Whether the schedule is in compact mode. */
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
  /** The view the card is being rendered in. */
  view: ViewKind;
  /** The card treatment the level asks for. */
  variant: CardVariant;
  /** Whether the schedule is in compact mode. */
  compact: boolean;
  /** The item's level, resolved from the scale. */
  level: LevelDefinition | undefined;
  /** The time as the card shows it, from the formatters and the item's own labels. */
  timeLabel: string;
  /** The built-in content, to wrap or to place beside your own. */
  defaultRender: () => ReactNode;
  /** The item being rendered. */
  item: TItem;
}

/**
 * What `renderNavLabel` receives: the target shift and the carried-over count.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface NavLabelContext {
  /** Which of the two buttons is being labelled. */
  position: NavPosition;
  /** The shift the button would go to, or `null` when there is none. */
  target: ShiftWindow | null;
  /** Whether the button is disabled. */
  disabled: boolean;
  /** How many items of the shifts already passed can still pin. */
  carriedOverCount: number;
}

/**
 * What `renderEmpty` receives: whether the whole day or one shift is empty.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface EmptyContext<TItem> {
  /** Whether the whole schedule is empty or only one shift. */
  scope: 'all' | 'shift';
  /** The empty shift, when the scope is one shift. */
  segment?: ShiftSegment<TItem> | undefined;
}

/**
 * What `renderItemDetail` receives: the item, how it was opened and a way to close it.
 *
 * @category Rendering
 * @since 1.0.0
 */
export interface ItemDetailContext<TItem> {
  /** The item whose detail is open. */
  item: TItem;
  /** Closes the detail and returns focus to whatever opened it. */
  close: () => void;
  /** What opened it: a card, a pinned chip, an overflow row or the imperative handle. */
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
  /** Opens the row's item, as the built-in action column does. */
  openItem: () => void;
  /** The locale pack in force, for a cell that has words of its own. */
  localization: SchedulerLocalization;
}

/**
 * One column of the overflow table: its header, its cell and how it sorts.
 *
 * @category Overflow
 * @since 1.0.0
 */
export interface OverflowColumn<TItem> {
  /** Identifies the column in `overflowSort`, and is its React key. */
  id: string;
  /** The header cell, or a function of the locale pack that returns it. */
  header: ReactNode | ((localization: SchedulerLocalization) => ReactNode);
  /** How the column's content is aligned in its cells. */
  align?: 'start' | 'center' | 'end' | undefined;
  /** The width, in pixels, the column asks for before the spare width is shared. */
  minWidth?: number | undefined;
  /** Equal to `minWidth`, the column has that fixed width and takes no share of the spare width. */
  maxWidth?: number | undefined;
  /** Omit to make the column unsortable. */
  sortValue?: ((item: TItem) => string | number) | undefined;
  /** Renders the cell of one item. */
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
  /** Scrolls to a shift, by offset from the current one or by role. */
  scrollToShift(target: number | ShiftRole, options?: { smooth?: boolean; align?: 'start' | 'nearBottom' }): void;
  /** Scrolls to a moment inside the rendered range. */
  scrollToTime(time: DateInput, options?: { smooth?: boolean; align?: 'start' | 'center' | 'nearBottom' }): void;
  /** Scrolls to an item, if it is in the rendered range. */
  scrollToItem(id: string, options?: { smooth?: boolean }): void;
  /** Opens an item's detail, as activating its card would. */
  openItem(id: string): void;
  /** Closes the open detail, if there is one. */
  closeItem(): void;
  /** Opens the overflow dialog of a group. */
  openOverflow(groupId: string): void;
  /** Closes the overflow dialog, if it is open. */
  closeOverflow(): void;
  /** Measures the pinning sentinels again, after a layout change the component cannot see. */
  refreshPinning(): void;
  /** The ids of the items pinned right now, in strip order. */
  getPinnedIds(): readonly string[];
  /** The shift being read, or `null` before the first measurement. */
  getActiveShift(): ShiftWindow | null;
  /** The computed timeline layout, or `null` in the list view. */
  getLayout(): TimelineLayout<TItem> | null;
  /** The scrolling element, for a measurement of your own. */
  getScrollElement(): HTMLElement | null;
  /** Moves focus to an item's card. */
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
  /** The name of the part, which the stylesheet and the tests select on. */
  'data-rs-part': string;
};

/**
 * Props a custom card spreads onto its activator, so activation and keyboard work.
 *
 * @category Headless
 * @since 1.0.0
 */
export type ItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** MUST be attached: focus and scrolling to an item depend on it. */
  ref: Ref<HTMLButtonElement>;
  /** The name of the part, which the stylesheet and the tests select on. */
  'data-rs-part': string;
};

/**
 * Props a custom card spreads onto its pin sentinel, so pinning can observe it.
 *
 * @category Headless
 * @since 1.0.0
 */
export type PinSentinelProps = HTMLAttributes<HTMLSpanElement> & {
  /** MUST be attached: the pin observer watches this element. */
  ref: Ref<HTMLSpanElement>;
  /** The name of the part, which the stylesheet and the tests select on. */
  'data-rs-part': string;
  /** Which edge of the card the sentinel sits at, from the view's pin rule. */
  'data-rs-edge': 'top' | 'bottom';
};

/** Everything `<Scheduler>` uses, without markup (Feature Dossier 04 §7). */
export interface SchedulerState<TItem extends SchedulerItem> {
  /** The view the state describes. */
  view: ViewKind;
  /** Whether the schedule is in compact mode. */
  compact: boolean;
  /** The rendered shifts, in order. */
  shifts: readonly ShiftWindow[];
  /** The rendered shifts with their items, in order. */
  segments: readonly ShiftSegment<TItem>[];
  /** The shift being read, or `null` before the first measurement. */
  activeShift: ShiftWindow | null;
  /** The pinned items, in strip order. */
  pinned: readonly TItem[];
  /** How many items of the shifts already passed can still pin. */
  carriedOverCount: number;
  /** The current value of the header signal. */
  headerExpanded: boolean;
  /** Timeline only. */
  layout: TimelineLayout<TItem> | null;
  /** The current moment, as the internal clock or the `now` prop gives it. */
  now: number;
  /** Whether the now indicator may be shown at all. */
  nowVisible: boolean;
  /** The item whose detail is open, or `null`. */
  openItem: TItem | null;
  /** The overflow group whose dialog is open, or `null`. */
  openOverflow: OverflowGroup<TItem> | null;
  /** What the two navigation buttons point at right now. */
  navigation: { top: NavState; bottom: NavState };
  /** The locale pack in force. */
  localization: SchedulerLocalization;
  /** The formatters in force, already bound to the locale. */
  formatters: SchedulerFormatters;
  /** The same imperative actions the component exposes through its ref. */
  actions: SchedulerHandle<TItem>;
  /** Props for the outermost element of your own rendering. */
  getRootProps(): HTMLAttributes<HTMLDivElement> & { ref: Ref<HTMLDivElement> };
  /** Props for the scrolling element; pinning and navigation measure it. */
  getScrollerProps(): ElementProps;
  /** Props for the element that sticks to the top of the scroller. */
  getStickyTopProps(): ElementProps;
  /** Props for one of the two navigation buttons, including its label and its state. */
  getNavButtonProps(position: NavPosition): ButtonHTMLAttributes<HTMLButtonElement>;
  /** Props for a shift's section element. */
  getSectionProps(segment: ShiftSegment<TItem>): ElementProps;
  /** Props for an item's activator, so activation and the keyboard work. */
  getItemProps(item: TItem, view?: ViewKind): ItemProps;
  /** Props for the pin sentinel of a pinnable item. */
  getPinSentinelProps(item: TItem): PinSentinelProps;
  /** Props for the chip of a pinned item. */
  getPinnedChipProps(item: TItem): ButtonHTMLAttributes<HTMLButtonElement>;
  /** Props for the chip that opens an overflow group. */
  getMoreChipProps(group: OverflowGroup<TItem>): ButtonHTMLAttributes<HTMLButtonElement> & {
    ref: Ref<HTMLButtonElement>;
  };
  /** Props for the button that scrolls back to the top. */
  getScrollTopButtonProps(): ButtonHTMLAttributes<HTMLButtonElement>;
}
