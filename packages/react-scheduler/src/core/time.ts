// SPDX-License-Identifier: MIT
import type { DateInput } from './types';

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WALL_CLOCK = /^(\d{1,2}):(\d{2})$/;

export const MINUTE = 60_000;
export const HOUR = 3_600_000;

/**
 * Epoch milliseconds of a date input; `NaN` when invalid. A string without an offset is local
 * wall-clock time, including date-only strings (which `Date` alone would read as UTC).
 */
export function toMs(input: DateInput): number {
  if (input instanceof Date) return input.getTime();
  if (typeof input === 'number') return Number.isFinite(input) ? input : Number.NaN;
  const dateOnly = DATE_ONLY.exec(input);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])).getTime();
  return new Date(input).getTime();
}

/**
 * The resolved end of an item: `start + defaultDuration` when `end` is missing or invalid; an end
 * before the start counts as zero duration.
 */
export function resolveEnd(start: number, end: DateInput | undefined, defaultDuration: number): number {
  if (end === undefined) return start + defaultDuration;
  const endMs = toMs(end);
  if (Number.isNaN(endMs)) return start + defaultDuration;
  return endMs < start ? start : endMs;
}

/** Minutes after midnight of an "HH:mm" wall-clock time, or `NaN` when malformed. */
export function parseWallClock(value: string): number {
  const match = WALL_CLOCK.exec(value);
  if (!match) return Number.NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : Number.NaN;
}

/**
 * Epoch ms of a local wall-clock time on a local calendar day. `day` may overflow the month;
 * a time inside a spring-forward gap moves forward by the gap, and a repeated autumn time uses
 * its first occurrence (both are the `Date` constructor's rules).
 */
export function localWallClock(year: number, month: number, day: number, minutes: number): number {
  return new Date(year, month, day, Math.floor(minutes / 60), minutes % 60).getTime();
}

/** Local midnight of the calendar day containing `ms`. */
export function startOfLocalDay(ms: number): number {
  const date = new Date(ms);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Start of the local clock hour containing `ms`. */
export function startOfLocalHour(ms: number): number {
  const date = new Date(ms);
  date.setMinutes(0, 0, 0);
  return date.getTime();
}
