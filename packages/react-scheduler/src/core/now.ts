// SPDX-License-Identifier: MIT
// Now indicator (Feature Dossier 01 §T.12, 05 F-11). The list gains a marker (B-01); the
// conditions are shared by both views.
import { startOfLocalDay, toMs } from './time';
import type { DateInput, SchedulerItem, ShiftWindow } from './types';

export interface NowInput {
  enabled: boolean;
  now: number;
  /** The selected date-time. */
  date: number;
  current: ShiftWindow;
  rangeStart: number;
  rangeEnd: number;
}

/**
 * Shown when enabled, the selected day is today (so not in the past), now is inside the current
 * window (half-open) and inside the rendered range.
 */
export function nowVisible(input: NowInput): boolean {
  const { enabled, now, date, current, rangeStart, rangeEnd } = input;
  if (!enabled || !Number.isFinite(now) || !Number.isFinite(date)) return false;
  // The selected day equals today, which also means it is not in the past.
  return (
    startOfLocalDay(date) === startOfLocalDay(now) &&
    now >= current.start &&
    now < current.end &&
    now >= rangeStart &&
    now <= rangeEnd
  );
}

/** Index in the current section's cards before which the list's now marker sits. */
export function nowMarkerIndex(items: readonly Pick<SchedulerItem, 'start'>[], now: DateInput): number {
  const time = toMs(now);
  const index = items.findIndex((item) => toMs(item.start) > time);
  return index < 0 ? items.length : index;
}
