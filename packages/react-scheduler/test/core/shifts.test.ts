import { afterEach, describe, expect, it } from 'vitest';
import { getShiftWindows, resolveShift } from '../../src/core/shifts';
import type { ShiftWindow } from '../../src/core/types';

// Runs with TZ=UTC; DST behavior is in shifts.dst.test.ts.
const at = (day: number, h: number, m = 0): number => new Date(2031, 2, day, h, m).getTime();
const span = (w: ShiftWindow): [number, number, string, number] => [w.start, w.end, w.key, w.offset];

const originalEnv = process.env['NODE_ENV'];
afterEach(() => {
  process.env['NODE_ENV'] = originalEnv;
});

describe('regular shifts (defaults: 12 h from 08:00, keys day/night)', () => {
  it('resolves the current window with half-open boundaries', () => {
    expect(span(resolveShift(at(12, 10, 30)))).toEqual([at(12, 8), at(12, 20), 'day', 0]);
    expect(span(resolveShift(at(12, 8)))).toEqual([at(12, 8), at(12, 20), 'day', 0]);
    expect(span(resolveShift(new Date(2031, 2, 12, 7, 59, 59)))).toEqual([at(11, 20), at(12, 8), 'night', 0]);
    expect(span(resolveShift(at(12, 2)))).toEqual([at(11, 20), at(12, 8), 'night', 0]);
    expect(span(resolveShift(at(12, 20)))).toEqual([at(12, 20), at(13, 8), 'night', 0]);
  });

  it('renders previous, current and next windows with roles from the offset sign', () => {
    const windows = getShiftWindows(at(12, 10, 30));
    expect(windows.map((w) => [w.offset, w.role, w.key])).toEqual([
      [-1, 'previous', 'night'],
      [0, 'current', 'day'],
      [1, 'next', 'night'],
    ]);
    expect(windows[0]?.start).toBe(at(11, 20));
    expect(windows[2]?.end).toBe(at(13, 8));
  });

  it('walks any number of boundaries with before/after', () => {
    const windows = getShiftWindows(at(12, 10, 30), { before: 2, after: 3 });
    expect(windows.map((w) => w.offset)).toEqual([-2, -1, 0, 1, 2, 3]);
    expect(windows.map((w) => w.key)).toEqual(['day', 'night', 'day', 'night', 'day', 'night']);
    windows.slice(1).forEach((w, i) => expect(w.start).toBe(windows[i]?.end));
    expect(windows[0]?.start).toBe(at(11, 8));
  });

  it('treats negative or non-finite before/after as 0 or the default', () => {
    expect(getShiftWindows(at(12, 10), { before: -3, after: Number.NaN }).map((w) => w.offset)).toEqual([0, 1]);
  });

  it('assigns keys cyclically from the anchor for shorter shifts', () => {
    const windows = getShiftWindows(at(12, 10), { durationHours: 8, anchor: '06:00', before: 1, after: 1 });
    expect(windows.map((w) => [new Date(w.start).getHours(), w.key])).toEqual([
      [22, 'day'],
      [6, 'day'],
      [14, 'night'],
    ]);
  });
});

describe('pattern shifts', () => {
  const pattern = [
    { key: 'early', start: '06:00', label: 'Early' },
    { key: 'late', start: '14:00' },
    { key: 'night', start: '22:00' },
  ] as const;

  it('yields windows between consecutive entry starts, with labels', () => {
    const windows = getShiftWindows(at(12, 10), { pattern });
    expect(windows.map(span)).toEqual([
      [at(11, 22), at(12, 6), 'night', -1],
      [at(12, 6), at(12, 14), 'early', 0],
      [at(12, 14), at(12, 22), 'late', 1],
    ]);
    expect(windows[1]?.label).toBe('Early');
    expect(windows[0]).not.toHaveProperty('label');
  });
});

describe('invalid options', () => {
  it('throws in development for a duration that does not divide 24', () => {
    expect(() => getShiftWindows(at(12, 10), { durationHours: 5 })).toThrow(/durationHours must divide 24/);
  });

  it('falls back to 12 h in production', () => {
    process.env['NODE_ENV'] = 'production';
    expect(span(resolveShift(at(12, 10), { durationHours: 5 }))).toEqual([at(12, 8), at(12, 20), 'day', 0]);
  });

  it('rejects a malformed anchor', () => {
    expect(() => resolveShift(at(12, 10), { anchor: '8am' as never })).toThrow(/anchor/);
    process.env['NODE_ENV'] = 'production';
    expect(resolveShift(at(12, 10), { anchor: '8am' as never }).start).toBe(at(12, 8));
  });

  it('rejects pattern entries that are not strictly increasing', () => {
    const pattern = [
      { key: 'a', start: '10:00' },
      { key: 'b', start: '09:00' },
    ] as const;
    expect(() => resolveShift(at(12, 11), { pattern })).toThrow(/strictly increasing/);
    process.env['NODE_ENV'] = 'production';
    expect(span(resolveShift(at(12, 11), { pattern }))).toEqual([at(12, 10), at(13, 10), 'a', 0]);
  });

  it('rejects an empty pattern and falls back to the regular defaults in production', () => {
    expect(() => resolveShift(at(12, 11), { pattern: [] })).toThrow(/at least one entry/);
    process.env['NODE_ENV'] = 'production';
    expect(resolveShift(at(12, 11), { pattern: [] }).key).toBe('day');
  });

  it('throws on an invalid date', () => {
    expect(() => getShiftWindows('not a date')).toThrow(/invalid date/);
  });
});
