import { describe, expect, it } from 'vitest';
import { classicLevels, resolveLevels } from '../../src/core/levels';
import { bottomNavState, carriedOverCount, type NavInput, shiftTitle, topNavState } from '../../src/core/navigation';
import { getShiftWindows } from '../../src/core/shifts';
import type { SchedulerItem, ShiftSegment } from '../../src/core/types';
import { enUS } from '../../src/locales/en';

const shifts = getShiftWindows('2031-03-12T10:30:00');
const fiveShifts = getShiftWindows('2031-03-12T10:30:00', { before: 2, after: 2 });
const base: NavInput = {
  view: 'timeline',
  shifts,
  activeIndex: 1,
  atStart: () => false,
  navigationAllowed: true,
  carriedOverCount: 2,
  localization: enUS,
};
const summary = (state: ReturnType<typeof topNavState>): [boolean, boolean, number | null, string, string, number] => [
  state.visible,
  state.disabled,
  state.target?.offset ?? null,
  state.label,
  state.hint,
  state.carriedOverCount,
];

describe('topNavState', () => {
  it('targets the current shift from a later shift or from inside the current one', () => {
    expect(summary(topNavState({ ...base, activeIndex: 2 }))).toEqual([
      true,
      false,
      0,
      'View current shift',
      'Scroll to current shift start',
      0,
    ]);
    expect(summary(topNavState(base))).toEqual([
      true,
      false,
      0,
      'View current shift',
      'Scroll to current shift start',
      0,
    ]);
  });

  it('targets the previous shift, with the carried-over count, from the start of the current one', () => {
    expect(summary(topNavState({ ...base, atStart: () => true }))).toEqual([
      true,
      false,
      -1,
      'View previous shift',
      'Scroll to previous shift start',
      2,
    ]);
  });

  it('targets the start of the active earlier shift when inside it', () => {
    expect(summary(topNavState({ ...base, activeIndex: 0 }))).toEqual([
      true,
      false,
      -1,
      'View previous shift',
      'Scroll to previous shift start',
      2,
    ]);
  });

  it('is disabled at the very top in the timeline and hidden in the list', () => {
    const top = { ...base, activeIndex: 0, atStart: () => true };
    expect(summary(topNavState(top))).toEqual([true, true, null, 'Previous shift', 'No previous shift available.', 0]);
    expect(topNavState({ ...top, view: 'list' }).visible).toBe(false);
  });

  it('walks earlier shifts with before > 1', () => {
    const input = { ...base, shifts: fiveShifts, activeIndex: 1, atStart: (index: number) => index === 1 };
    expect(summary(topNavState(input))).toEqual([
      true,
      false,
      -2,
      'View earlier shift',
      'Scroll to earlier shift start',
      2,
    ]);
  });

  it('[B-06] shows the carried-over count only when the target is an earlier shift', () => {
    expect(topNavState({ ...base, activeIndex: 2 }).carriedOverCount).toBe(0);
    expect(topNavState({ ...base, atStart: () => true }).carriedOverCount).toBe(2);
  });

  it('is hidden in the list below the navigation threshold, and without an active shift', () => {
    expect(topNavState({ ...base, view: 'list', navigationAllowed: false, atStart: () => true }).visible).toBe(false);
    expect(topNavState({ ...base, activeIndex: 9 }).visible).toBe(false);
  });
});

describe('bottomNavState', () => {
  it('targets the next shift', () => {
    expect(summary(bottomNavState(base))).toEqual([true, false, 1, 'View next shift', 'Scroll to next shift start', 0]);
    expect(summary(bottomNavState({ ...base, activeIndex: 0 }))).toEqual([
      true,
      false,
      0,
      'View current shift',
      'Scroll to current shift start',
      0,
    ]);
  });

  it('is disabled at the last shift in the timeline and hidden in the list', () => {
    expect(summary(bottomNavState({ ...base, activeIndex: 2 }))).toEqual([
      true,
      true,
      null,
      'Next shift',
      'No next shift available.',
      0,
    ]);
    expect(bottomNavState({ ...base, activeIndex: 2, view: 'list' }).visible).toBe(false);
    expect(bottomNavState({ ...base, activeIndex: 9 }).visible).toBe(false);
  });

  it('in the list, skips to the next shift when it is already visible from an earlier shift', () => {
    const list = { ...base, view: 'list' as const, activeIndex: 0 };
    expect(bottomNavState(list).target?.offset).toBe(0);
    expect(bottomNavState({ ...list, nextOffsetVisible: true }).target?.offset).toBe(1);
  });

  it('labels later shifts with after > 1', () => {
    expect(bottomNavState({ ...base, shifts: fiveShifts, activeIndex: 3 }).label).toBe('View later shift');
  });
});

describe('shiftTitle and carriedOverCount', () => {
  it('titles shifts by offset', () => {
    expect([-3, -1, 0, 1, 2].map((offset) => shiftTitle(offset, enUS))).toEqual([
      '3 shifts earlier',
      'Previous shift',
      'Current shift',
      'Next shift',
      '2 shifts later',
    ]);
  });

  it('counts pinnable items of every earlier shift', () => {
    const item = (id: string, level: string, extra: Partial<SchedulerItem> = {}): SchedulerItem => ({
      id,
      level,
      title: id,
      start: 0,
      ...extra,
    });
    const segments: ShiftSegment<SchedulerItem>[] = [
      { shift: fiveShifts[0]!, items: [item('a', 'critical'), item('b', 'watch', { pinnable: true })] },
      {
        shift: fiveShifts[1]!,
        items: [item('c', 'critical', { pinnable: false }), item('d', 'routine', { pinned: true })],
      },
      { shift: fiveShifts[2]!, items: [item('e', 'critical')] },
    ];
    expect(carriedOverCount(segments, resolveLevels(classicLevels))).toBe(3);
  });
});
