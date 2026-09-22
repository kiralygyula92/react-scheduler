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

export type SchedulerSlots<TItem> = { [P in SchedulerPart]: ComponentType<SlotProps<P, TItem>> };

export type SchedulerSlotProps<TItem> = {
  [P in SchedulerPart]:
    | Partial<Omit<SlotProps<P, TItem>, 'ownerState' | 'Default'>>
    | ((ownerState: OwnerState<TItem>) => Partial<Omit<SlotProps<P, TItem>, 'ownerState' | 'Default'>>);
};

// ---------------------------------------------------------------------------- render props

export interface HeaderContext<TItem> {
  expanded: boolean;
  view: ViewKind;
  activeShift: ShiftWindow | null;
  segments: readonly ShiftSegment<TItem>[];
}

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

export interface CardContentContext<TItem> {
  view: ViewKind;
  variant: CardVariant;
  compact: boolean;
  level: LevelDefinition | undefined;
  timeLabel: string;
  defaultRender: () => ReactNode;
  item: TItem;
}

export interface NavLabelContext {
  position: NavPosition;
  target: ShiftWindow | null;
  disabled: boolean;
  carriedOverCount: number;
}

export interface EmptyContext<TItem> {
  scope: 'all' | 'shift';
  segment?: ShiftSegment<TItem> | undefined;
}

export interface ItemDetailContext<TItem> {
  item: TItem;
  close: () => void;
  source: ActivationSource;
}

// ---------------------------------------------------------------------------- overflow columns

export interface OverflowCellContext {
  openItem: () => void;
  localization: SchedulerLocalization;
}

export interface OverflowColumn<TItem> {
  id: string;
  header: ReactNode | ((localization: SchedulerLocalization) => ReactNode);
  align?: 'start' | 'center' | 'end' | undefined;
  minWidth?: number | undefined;
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

export interface SchedulerProps<TItem extends SchedulerItem = SchedulerItem> extends ReactOptions<TItem> {
  /** Interaction middleware (04 §5.11). */
  handlers?: SchedulerHandlers<TItem> | undefined;
  overflowColumns?: readonly OverflowColumn<TItem>[] | undefined;
  /** `<Scheduler>` only: the inactive view stays mounted but paused (04 §5.3). */
  keepInactiveViewMounted?: boolean | undefined;
  /** Shows the retry action in the error state. */
  onRetry?: (() => void) | undefined;

  renderItem?: ((item: TItem, ctx: RenderItemContext<TItem>) => ReactNode) | undefined;
  renderCardContent?: ((item: TItem, ctx: CardContentContext<TItem>) => ReactNode) | undefined;
  renderTimeLabel?: ((item: TItem, ctx: { defaultLabel: string }) => ReactNode) | undefined;
  renderShiftHeader?:
    ((segment: ShiftSegment<TItem>, ctx: { defaultTitle: string; rangeLabel: string }) => ReactNode) | undefined;
  renderItemDetail?: ((ctx: ItemDetailContext<TItem>) => ReactNode) | undefined;
  renderPinnedChip?:
    ((item: TItem, ctx: { carriedOver: boolean; defaultRender: () => ReactNode }) => ReactNode) | undefined;
  renderNavLabel?: ((ctx: NavLabelContext) => ReactNode) | undefined;
  renderMoreLabel?: ((group: OverflowGroup<TItem>) => ReactNode) | undefined;
  renderEmpty?: ((ctx: EmptyContext<TItem>) => ReactNode) | undefined;
  renderLoading?: (() => ReactNode) | undefined;
  renderError?: ((ctx: { error: unknown; retry?: (() => void) | undefined }) => ReactNode) | undefined;
  renderHeader?: ((ctx: HeaderContext<TItem>) => ReactNode) | undefined;

  preset?: PresetName | undefined;
  colorScheme?: ColorScheme | undefined;
  tokens?: Partial<Record<TokenName, string>> | undefined;
  unstyled?: boolean | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  classNames?: Partial<Record<SchedulerPart, string>> | undefined;
  styles?: Partial<Record<SchedulerPart, CSSProperties>> | undefined;
  slots?: Partial<SchedulerSlots<TItem>> | undefined;
  slotProps?: Partial<SchedulerSlotProps<TItem>> | undefined;

  'aria-label'?: string | undefined;
  /** Shift headers. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** Prefix for element ids. Default: generated. */
  id?: string | undefined;
}

type ViewSelectionProps = 'view' | 'defaultView' | 'onViewChange' | 'listOnlyBreakpoint' | 'keepInactiveViewMounted';

export type ListViewProps<TItem extends SchedulerItem = SchedulerItem> = Omit<
  SchedulerProps<TItem>,
  ViewSelectionProps
>;
export type TimelineViewProps<TItem extends SchedulerItem = SchedulerItem> = Omit<
  SchedulerProps<TItem>,
  ViewSelectionProps
>;

// ---------------------------------------------------------------------------- handle and hook state

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

export type ElementProps<E extends HTMLElement = HTMLElement> = HTMLAttributes<E> & {
  ref: Ref<E>;
  'data-rs-part': string;
};

export type ItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref: Ref<HTMLButtonElement>;
  'data-rs-part': string;
};

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
