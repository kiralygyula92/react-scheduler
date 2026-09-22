import { describe, expect, it } from 'vitest';
import { getShiftWindows } from '../../src/core/shifts';
import {
  boundaryTimes,
  GRID_PAD_TOP,
  hourMarks,
  offShiftRows,
  shiftAnchor,
  timelineActiveIndex,
  timelineAtStart,
  timelineGeometry,
  timelineHeaderExpanded,
  timelineLandingTarget,
  timelineNavTarget,
  timeToPx,
} from '../../src/core/timeline';

// Parity geometry: 172 px per hour, 30-minute lead (86 px), baseline day selected at 10:30.
const shifts = getShiftWindows('2031-03-12T10:30:00');
const geometry = timelineGeometry(shifts, 172, 30);
const [previous, current, next] = shifts as [(typeof shifts)[0], (typeof shifts)[0], (typeof shifts)[0]];
const at = (h: number, m = 0): number => new Date(2031, 2, 12, h, m).getTime();

describe('timeline geometry', () => {
  it('spans the rendered shifts and converts the 30-minute lead to px', () => {
    expect(geometry).toEqual({ rangeStart: previous.start, rangeEnd: next.end, hourHeight: 172, lead: 86 });
  });

  it('anchors each shift at its grid position plus the grid top padding', () => {
    expect(shifts.map((shift) => shiftAnchor(shift, geometry))).toEqual([8, 2072, 4136]);
    expect(GRID_PAD_TOP).toBe(8);
    expect(timeToPx(at(10, 30), geometry)).toBe(2494);
  });

  it('marks every real hour of the range, both ends included', () => {
    const marks = hourMarks(geometry);
    expect(marks).toHaveLength(37);
    expect([marks[0], marks[12], marks[36]]).toEqual([previous.start, current.start, next.end]);
  });

  it('draws boundary lines at the inner shift boundaries', () => {
    expect(boundaryTimes(shifts)).toEqual([current.start, next.start]);
  });

  it('shades the hour rows outside the current window', () => {
    const rows = offShiftRows(geometry, current);
    expect(rows).toHaveLength(24);
    expect(rows.includes(11) && rows.includes(24) && !rows.includes(12) && !rows.includes(23)).toBe(true);
  });
});

describe('timeline scroll rules', () => {
  it('finds the active shift from [anchor − lead, next anchor − lead)', () => {
    expect([-200, 1985, 1986, 4049, 4050, 9000].map((top) => timelineActiveIndex(top, shifts, geometry))).toEqual([
      0, 0, 1, 1, 2, 2,
    ]);
  });

  it('is at the start of the first shift only at 0, and of later shifts until anchor − lead + 2', () => {
    expect([timelineAtStart(0, 0, shifts, geometry), timelineAtStart(0, 1, shifts, geometry)]).toEqual([true, false]);
    expect([timelineAtStart(1, 1988, shifts, geometry), timelineAtStart(1, 1989, shifts, geometry)]).toEqual([
      true,
      false,
    ]);
    expect(timelineAtStart(5, 0, shifts, geometry)).toBe(false);
  });

  it('keeps the header expanded until the current landing line + 2 px', () => {
    expect([1988, 1989].map((top) => timelineHeaderExpanded(top, current, geometry))).toEqual([true, false]);
  });

  it('targets anchor − lead when navigating', () => {
    expect(shifts.map((shift) => timelineNavTarget(shift, geometry))).toEqual([-78, 1986, 4050]);
  });
});

describe('timelineLandingTarget', () => {
  const input = { current, geometry, date: at(14), clientHeight: 800, nearBottomGutter: 86 };

  it('lands on the shift start, the date, or the date near the bottom', () => {
    expect(timelineLandingTarget('shiftStart', input)).toBe(1986);
    expect(timelineLandingTarget('date', input)).toBe(2072 + 6 * 172 - 86);
    expect(timelineLandingTarget('dateNearBottom', input)).toBe(2390);
    expect(timelineLandingTarget('none', input)).toBeNull();
  });

  it('clamps the near-bottom date into the current shift', () => {
    expect(timelineLandingTarget('dateNearBottom', { ...input, date: at(6) })).toBe(2072 - (800 - 86));
    const late = timelineLandingTarget('dateNearBottom', { ...input, date: at(23) }) ?? 0;
    expect(late).toBeLessThan(2072 + 12 * 172 - 714);
    expect(late).toBeGreaterThan(2072 + 12 * 172 - 715);
  });
});
