/**
 * Headless controller entry (`@react-schedulerkit/react-scheduler/headless`): `createScheduler`, the
 * framework-agnostic controller behind the components (docs pack 09 §4.3 level 6), with its types.
 * No React and no DOM access at import time; the pure functions stay in `/core`.
 *
 * @packageDocumentation
 */
export { createScheduler } from './core/controller';
export type {
  NavPosition,
  OverflowSort,
  ResolvedFlags,
  SchedulerController,
  SchedulerEvents,
  SchedulerFlags,
  SchedulerModel,
  SchedulerOptions,
  SchedulerStoreState,
  SchedulerViewModel,
  ScrollFacts,
} from './core/controller';
