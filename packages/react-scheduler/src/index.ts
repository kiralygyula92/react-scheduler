/**
 * Main entry of `@react-schedulerkit/react-scheduler`: the classic level/tag definitions, the default
 * English strings and the public types. React components and hooks join at M2
 * (Feature Dossier 04 §1).
 *
 * @packageDocumentation
 */
export { CARRIED_OVER_TAG, classicLevels, classicTags } from './core/levels';
export { enUS } from './locales/en';
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
