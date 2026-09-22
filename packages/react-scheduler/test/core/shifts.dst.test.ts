import { describe, expect, it } from 'vitest';
import { getShiftWindows, resolveShift } from '../../src/core/shifts';

// Runs in three projects: TZ=UTC, Europe/Helsinki (spring-forward 2031-03-30 03:00 → 04:00)
// and Australia/Sydney (spring-forward 2031-10-05 02:00 → 03:00). See the root vitest.config.ts.
const zone = process.env['TZ'] ?? 'UTC';
const HOUR = 3_600_000;
const local = (y: number, mo: number, d: number, h: number, mi = 0): number => new Date(y, mo, d, h, mi).getTime();
const wallClock = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

describe(`shift boundaries in ${zone}`, () => {
  it('runs in the zone the project declares', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(zone);
  });

  it('[B-07] night windows end at 08:00 wall clock on a spring-forward day', () => {
    // The spring-forward night of each zone; in UTC the same dates have no transition.
    const [y, mo, d] = zone === 'Australia/Sydney' ? [2031, 9, 5] : [2031, 2, 30];
    const night = resolveShift(local(y, mo, d, 2, 30));
    expect(wallClock(night.start)).toBe(wallClock(local(y, mo, d - 1, 20)));
    expect(wallClock(night.end)).toBe(wallClock(local(y, mo, d, 8)));
    expect((night.end - night.start) / HOUR).toBe(zone === 'UTC' ? 12 : 11);

    const [, , next] = getShiftWindows(local(y, mo, d, 2, 30));
    expect(wallClock(next?.start ?? 0)).toBe(wallClock(local(y, mo, d, 8)));
  });

  it('keeps day windows at 08:00–20:00 on the days around the transition', () => {
    for (const day of [28, 29, 31]) {
      const window = resolveShift(local(2031, 2, day, 12));
      expect([new Date(window.start).getHours(), new Date(window.end).getHours()]).toEqual([8, 20]);
    }
  });

  it('moves a boundary inside the spring-forward gap forward by the gap', () => {
    const [y, mo, d, gapHour] = zone === 'Australia/Sydney' ? [2031, 9, 5, 2] : [2031, 2, 30, 3];
    const window = resolveShift(local(y, mo, d, 12), {
      durationHours: 24,
      anchor: `${String(gapHour).padStart(2, '0')}:30` as `${number}:${number}`,
    });
    const expectedHour = zone === 'UTC' ? gapHour : gapHour + 1;
    expect(new Date(window.start).getHours()).toBe(expectedHour);
    expect(new Date(window.start).getMinutes()).toBe(30);
  });
});
