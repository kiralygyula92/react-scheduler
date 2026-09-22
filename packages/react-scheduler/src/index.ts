/**
 * Main entry of `@react-schedulerkit/react-scheduler`: the React components, parts and hooks, the
 * classic level/tag definitions, the default English strings and the public types (Feature Dossier
 * 04 §1).
 *
 * @packageDocumentation
 */
export { CARRIED_OVER_TAG, classicLevels, classicTags } from './core/levels';
export { enUS } from './locales/en';

export { ListView, Scheduler, TimelineView } from './react/scheduler';
export { ListCard, TimelineCard } from './react/components/card';
export { DiamondIcon } from './react/components/icons';
export { ShiftHeader } from './react/components/list-view';
export { ShiftNavButton } from './react/components/nav-button';
export { defaultOverflowColumns } from './react/components/overflow-columns';
export { PinnedChip, PinnedStrip } from './react/components/pinned-strip';
export { LevelPill, ReferencePill, TagPill } from './react/components/pills';
export { EmptyState, ErrorState, LoadingState, NowIndicator, ScrollTopButton } from './react/components/states';
export { MoreChip, TimeGrid } from './react/components/time-grid';
export { Tooltip } from './react/components/tooltip';
export { DefaultItemDetail, OverflowDialog, OverflowTable, Pagination } from './react/lazy-parts';
export {
  useCompact,
  useControllableState,
  useNow,
  usePinOnPass,
  useScheduler,
  useShiftModel,
  useShiftNavigation,
  useTimelineLayout,
} from './react/hooks';

export type { SchedulerFormatters } from './core/format';
export type { DeepPartial, PluralForms, SchedulerLocalization } from './core/localization';
export type { Middleware } from './core/middleware';
export type { NavState } from './core/navigation';
export type { ListOptions, PinningOptions, TimelineOptions } from './core/options';
export type {
  ActivationSource,
  CardVariant,
  ClassicLevelKey,
  ClassicTagKey,
  CloseReason,
  ColorScheme,
  DateInput,
  Density,
  HeaderReason,
  ItemOf,
  LandingTarget,
  LevelDefinition,
  OverflowGroup,
  PlacedCard,
  PresetName,
  SchedulerItem,
  SegmentInput,
  ShiftOptions,
  ShiftPatternEntry,
  ShiftRole,
  ShiftSegment,
  ShiftWindow,
  SortDirection,
  TagDefinition,
  TimelineLayout,
  ViewKind,
  WallClock,
} from './core/types';
export type { TokenName } from './react/tokens';
export type {
  BaseSlotProps,
  CardContentContext,
  EmptyContext,
  HeaderContext,
  ItemDetailContext,
  ItemProps,
  ListViewProps,
  NavLabelContext,
  NavPosition,
  OverflowCellContext,
  OverflowColumn,
  OverflowSort,
  OwnerState,
  PinSentinelProps,
  RenderItemContext,
  SchedulerHandle,
  SchedulerHandlers,
  SchedulerPart,
  SchedulerProps,
  SchedulerSlotProps,
  SchedulerSlots,
  SchedulerState,
  SlotProps,
  TimelineViewProps,
} from './react/types';
