/**
 * Headless entry (`@react-schedulerkit/react-scheduler/core`): framework-agnostic pure functions and
 * types, with no React and no DOM access (Feature Dossier 04 §8).
 *
 * @packageDocumentation
 */
export { bucketItems } from './core/bucketing';
export { createFormatters } from './core/format';
export type { FormatterOptions, SchedulerFormatters } from './core/format';
export { computeTimelineLayout } from './core/layout';
export { compareByPlacement, resolveLevels } from './core/levels';
export type { ResolvedLevel } from './core/levels';
export { interpolate } from './core/localization';
export type { DeepPartial, PluralForms, SchedulerLocalization } from './core/localization';
export { pageList, sortOverflowItems } from './core/overflow';
export type { SortableColumn } from './core/overflow';
export { getShiftWindows, resolveShift } from './core/shifts';
export { resolveEnd, toMs } from './core/time';
export { resolveTimeLabel } from './core/time-label';
export type {
  CardVariant,
  DateInput,
  ItemOf,
  LevelDefinition,
  OverflowGroup,
  PlacedCard,
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
  TimelineLayoutOptions,
  WallClock,
} from './core/types';
