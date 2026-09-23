// SPDX-License-Identifier: MIT
// Shift model (Feature Dossier 05 F-01). Boundaries are wall-clock times repeated every day, so a
// window's duration is the real elapsed time between two boundaries (11 h or 13 h on DST days).
// The source added 12 h in milliseconds instead, which drifted on DST days (B-07).
import type { BundlerProcess } from './env';
import { localWallClock, parseWallClock, toMs } from './time';
import type { DateInput, ShiftOptions, ShiftPatternEntry, ShiftRole, ShiftWindow } from './types';

// Development-only branches read the bundler-replaced NODE_ENV behind a typeof guard (env.ts).
declare const process: BundlerProcess;

interface DailyBoundary {
  /** Minutes after local midnight. */
  minutes: number;
  key: string;
  label?: string;
}

interface Boundary {
  ms: number;
  key: string;
  label?: string;
}

const DAY_MINUTES = 1440;
const DEFAULT_DURATION_HOURS = 12;
const DEFAULT_ANCHOR_MINUTES = 8 * 60;
const DEFAULT_KEYS: readonly string[] = ['day', 'night'];

/**
 * Invalid shift options throw in development builds. Every call site is guarded inline, so a
 * production build drops the call with its message and falls back instead (F-01).
 */
function invalid(message: string): never {
  throw new RangeError(`[react-scheduler] ${message}`);
}

function regularBoundaries(options: ShiftOptions): DailyBoundary[] {
  let durationMinutes = (options.durationHours ?? DEFAULT_DURATION_HOURS) * 60;
  if (!(durationMinutes > 0 && Number.isInteger(durationMinutes) && DAY_MINUTES % durationMinutes === 0)) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production')
      invalid(`shifts.durationHours must divide 24; received ${String(options.durationHours)}.`);
    durationMinutes = DEFAULT_DURATION_HOURS * 60;
  }
  let anchor = parseWallClock(options.anchor ?? '08:00');
  if (Number.isNaN(anchor)) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production')
      invalid(`shifts.anchor must be "HH:mm"; received ${String(options.anchor)}.`);
    anchor = DEFAULT_ANCHOR_MINUTES;
  }
  const keys = options.keys && options.keys.length > 0 ? options.keys : DEFAULT_KEYS;
  const boundaries: DailyBoundary[] = [];
  for (let index = 0; index < DAY_MINUTES / durationMinutes; index++) {
    boundaries.push({
      minutes: (anchor + index * durationMinutes) % DAY_MINUTES,
      key: keys[index % keys.length] ?? '',
    });
  }
  return boundaries.sort((a, b) => a.minutes - b.minutes);
}

function patternBoundaries(pattern: readonly ShiftPatternEntry[]): DailyBoundary[] {
  const boundaries: DailyBoundary[] = [];
  for (const entry of pattern) {
    const minutes = parseWallClock(entry.start);
    const previous = boundaries[boundaries.length - 1];
    if (Number.isNaN(minutes) || (previous && minutes <= previous.minutes)) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production')
        invalid('shifts.pattern needs "HH:mm" starts in strictly increasing order.');
      continue;
    }
    boundaries.push(
      entry.label === undefined ? { minutes, key: entry.key } : { minutes, key: entry.key, label: entry.label },
    );
  }
  if (boundaries.length === 0) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production')
      invalid('shifts.pattern needs at least one entry.');
    return regularBoundaries({});
  }
  return boundaries;
}

function dailyBoundaries(options: ShiftOptions): DailyBoundary[] {
  return options.pattern ? patternBoundaries(options.pattern) : regularBoundaries(options);
}

function roleOf(offset: number): ShiftRole {
  return offset < 0 ? 'previous' : offset > 0 ? 'next' : 'current';
}

function count(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isFinite(value) ? fallback : Math.max(0, Math.floor(value));
}

/**
 * The rendered shift windows around `date`, offsets `-before … +after`. The current window is
 * `[latest boundary ≤ date, next boundary)`; offsets walk boundaries across days.
 *
 * @param date The moment being read; the shift containing it is the current one.
 * @param options The shift pattern and how many shifts to render around the current one.
 */
export function getShiftWindows(date: DateInput, options: ShiftOptions = {}): readonly ShiftWindow[] {
  const time = toMs(date);
  if (Number.isNaN(time)) throw new RangeError('[react-scheduler] getShiftWindows: invalid date.');
  const before = count(options.before, 1);
  const after = count(options.after, 1);
  const daily = dailyBoundaries(options);

  // Every day has at least one boundary, so these days always contain the walked range.
  const day = new Date(time);
  const boundaries: Boundary[] = [];
  for (let dayOffset = -(before + 2); dayOffset <= after + 2; dayOffset++) {
    for (const entry of daily) {
      const ms = localWallClock(day.getFullYear(), day.getMonth(), day.getDate() + dayOffset, entry.minutes);
      const previous = boundaries[boundaries.length - 1];
      // Two boundaries can collapse into one instant inside a DST gap; keep the first.
      if (previous && ms <= previous.ms) continue;
      boundaries.push(entry.label === undefined ? { ms, key: entry.key } : { ms, key: entry.key, label: entry.label });
    }
  }

  let current = 0;
  for (let index = 0; index < boundaries.length; index++) {
    if ((boundaries[index]?.ms ?? Infinity) <= time) current = index;
  }
  const windows: ShiftWindow[] = [];
  for (let offset = 0 - before; offset <= after; offset++) {
    const start = boundaries[current + offset];
    const end = boundaries[current + offset + 1];
    if (!start || !end) continue;
    const window: ShiftWindow = { offset, role: roleOf(offset), key: start.key, start: start.ms, end: end.ms };
    if (start.label !== undefined) window.label = start.label;
    windows.push(window);
  }
  return windows;
}

/**
 * The current shift window (offset 0) for `date`.
 *
 * @param date The moment to place.
 * @param options The shift pattern the day is cut with.
 */
export function resolveShift(date: DateInput, options: ShiftOptions = {}): ShiftWindow {
  const [current] = getShiftWindows(date, { ...options, before: 0, after: 0 });
  // getShiftWindows always yields offset 0: the boundary list spans two days on each side.
  return current as ShiftWindow;
}
