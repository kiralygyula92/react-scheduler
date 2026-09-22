import { describe, expect, it } from 'vitest';
import {
  localWallClock,
  parseWallClock,
  resolveEnd,
  startOfLocalDay,
  startOfLocalHour,
  toMs,
} from '../../src/core/time';

const at = (h: number, m = 0): number => new Date(2031, 2, 12, h, m).getTime();

describe('toMs', () => {
  it('accepts dates, epoch numbers and ISO strings without offset as local time', () => {
    expect(toMs(new Date(2031, 2, 12, 10, 30))).toBe(at(10, 30));
    expect(toMs(at(9))).toBe(at(9));
    expect(toMs('2031-03-12T10:30:00')).toBe(at(10, 30));
  });

  it('reads date-only strings as local midnight', () => {
    expect(toMs('2031-03-12')).toBe(at(0));
  });

  it('respects explicit offsets', () => {
    expect(toMs('2031-03-12T10:30:00Z')).toBe(Date.UTC(2031, 2, 12, 10, 30));
  });

  it('returns NaN for invalid input', () => {
    expect(toMs('not a date')).toBeNaN();
    expect(toMs(Number.POSITIVE_INFINITY)).toBeNaN();
    expect(toMs(new Date(Number.NaN))).toBeNaN();
  });
});

describe('resolveEnd', () => {
  const twoHours = 2 * 3_600_000;

  it('uses start + defaultDuration when the end is missing or invalid', () => {
    expect(resolveEnd(at(9), undefined, twoHours)).toBe(at(11));
    expect(resolveEnd(at(9), 'soon', twoHours)).toBe(at(11));
  });

  it('counts an end before the start as zero duration', () => {
    expect(resolveEnd(at(9), at(8), twoHours)).toBe(at(9));
  });

  it('keeps a valid end', () => {
    expect(resolveEnd(at(9), '2031-03-12T10:15:00', twoHours)).toBe(at(10, 15));
  });
});

describe('parseWallClock', () => {
  it.each([
    ['08:00', 480],
    ['8:05', 485],
    ['23:59', 1439],
    ['00:00', 0],
  ])('%s → %i minutes', (value, minutes) => {
    expect(parseWallClock(value)).toBe(minutes);
  });

  it.each(['24:00', '12:60', '8', 'ab:cd', ''])('rejects %j', (value) => {
    expect(parseWallClock(value)).toBeNaN();
  });
});

describe('local calendar helpers', () => {
  it('builds wall-clock instants, overflowing days into the next month', () => {
    expect(localWallClock(2031, 2, 12, 20 * 60 + 15)).toBe(at(20, 15));
    expect(localWallClock(2031, 2, 32, 0)).toBe(new Date(2031, 3, 1).getTime());
  });

  it('finds the start of the local day and hour', () => {
    expect(startOfLocalDay(at(10, 30))).toBe(at(0));
    expect(startOfLocalHour(at(10, 30))).toBe(at(10));
  });
});
