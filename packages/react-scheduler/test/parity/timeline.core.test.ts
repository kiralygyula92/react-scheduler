import { describe, expect, it } from 'vitest';
import { bucketItems } from '../../src/core/bucketing';
import { createFormatters } from '../../src/core/format';
import { computeTimelineLayout } from '../../src/core/layout';
import { classicLevels, compareByPlacement, rankOf, resolveLevels } from '../../src/core/levels';
import { interpolate } from '../../src/core/localization';
import { bottomNavState, carriedOverCount, type NavInput, topNavState } from '../../src/core/navigation';
import { nowVisible } from '../../src/core/now';
import { timelineDefaults } from '../../src/core/options';
import { overflowSortValues, pageList, type SortableColumn, sortOverflowItems } from '../../src/core/overflow';
import { isPinnable, pinnedEntries } from '../../src/core/pinning';
import { getShiftWindows } from '../../src/core/shifts';
import {
  hourMarks,
  timelineActiveIndex,
  timelineAtStart,
  timelineGeometry,
  timelineHeaderExpanded,
  timelineLandingTarget,
  timelineNavTarget,
} from '../../src/core/timeline';
import { resolveTimeLabel } from '../../src/core/time-label';
import type { SchedulerItem } from '../../src/core/types';
import { enUS } from '../../src/locales/en';
import { fixture, HOUR, parityLayoutOptions } from './adapter';

// Core-level rules of the timeline DOM scenarios (TL-*), titled "[ID/core]"; see list.core.test.ts.
const levels = resolveLevels(classicLevels);
const formatters = createFormatters('en-US');
const baseline = fixture('baseline-day');
const shifts = getShiftWindows(baseline.date);
const segments = bucketItems(baseline.items, shifts);
const geometry = timelineGeometry(shifts, timelineDefaults.hourHeight, timelineDefaults.leadMinutes);
const date = new Date(baseline.date).getTime();
const gutter = (timelineDefaults.nearBottomGutterMinutes * timelineDefaults.hourHeight) / 60;

/** Navigation state of the timeline at a scroll position. */
function navAt(scrollTop: number): {
  top: ReturnType<typeof topNavState>;
  bottom: ReturnType<typeof bottomNavState>;
  active: number;
} {
  const activeIndex = timelineActiveIndex(scrollTop, shifts, geometry);
  const input: NavInput = {
    view: 'timeline',
    shifts,
    activeIndex,
    atStart: (index) => timelineAtStart(index, scrollTop, shifts, geometry),
    navigationAllowed: true,
    carriedOverCount: carriedOverCount(segments, levels),
    localization: enUS,
  };
  return { top: topNavState(input), bottom: bottomNavState(input), active: shifts[activeIndex]!.offset };
}

describe('timeline scenarios (core rules)', () => {
  it('[TL-02/core] 37 hour labels from the previous shift start', () => {
    const labels = hourMarks(geometry).map((time) => formatters.hourLabel(new Date(time)));
    expect(labels).toHaveLength(37);
    expect([labels[0], labels[12], labels[24], labels[36]]).toEqual(['8PM', '8AM', '8PM', '8AM']);
  });

  it('[TL-03/core] timeline card content', () => {
    const c02 = baseline.items.find((i) => i.id === 'c02')!;
    expect([
      c02.title,
      c02.description,
      resolveTimeLabel(c02, enUS, formatters, 2 * HOUR),
      enUS.levels[c02.level],
      `${enUS.referenceLabel} ${c02.reference ?? ''}`,
      c02.suggestion,
    ]).toEqual([
      'Delivery delay',
      'Short description for delivery delay.',
      '9:00 AM – 10:30 AM',
      'Watch',
      'Ref: 1042',
      'Suggested next step.',
    ]);
    expect(
      isPinnable(
        baseline.items.find((i) => i.id === 'c01')!,
        levels.get('critical'),
      ),
    ).toBe(true);
  });

  it('[TL-04/core] now indicator conditions', () => {
    const input = { enabled: true, current: shifts[1]!, rangeStart: geometry.rangeStart, rangeEnd: geometry.rangeEnd };
    const now = new Date('2031-03-12T10:41:00').getTime();
    expect(nowVisible({ ...input, now, date })).toBe(true);
    expect(formatters.clockTime(new Date(now))).toBe('10:41 AM');
    expect(nowVisible({ ...input, now, date: new Date(fixture('past-date').date).getTime() })).toBe(false);
    expect(nowVisible({ ...input, now: new Date('2031-03-12T21:05:00').getTime(), date })).toBe(false);
  });

  it('[TL-05/core] empty pinned strip without layout', () => {
    expect(pinnedEntries(segments, new Set(), compareByPlacement(levels))).toEqual([]);
    expect(navAt(0).top.carriedOverCount).toBe(0);
  });

  it('[TL-06/core] "+more" group at 09:00 and its sortable table', () => {
    const layout = computeTimelineLayout(baseline.items, parityLayoutOptions(baseline.date, false));
    const group = layout.overflow[0]!;
    expect(new Date(group.anchor).getHours()).toBe(9);
    expect(interpolate(enUS.overflow.title, { count: group.items.length }, 'en-US')).toBe('More overlapping items (2)');
    const columns: SortableColumn<SchedulerItem>[] = Object.entries(overflowSortValues(levels)).map(
      ([id, sortValue]) => ({
        id,
        sortValue,
      }),
    );
    const tieBreak = (a: SchedulerItem, b: SchedulerItem): number =>
      rankOf(levels, a.level) - rankOf(levels, b.level) || compareByPlacement(levels)(a, b);
    const titles = (column: string, direction: 'asc' | 'desc'): string[] =>
      sortOverflowItems(group.items, { column, direction }, columns, tieBreak).map((i) => i.title);
    expect(titles('time', 'asc')).toEqual(['Inventory count', 'Equipment check']);
    expect(titles('title', 'asc')).toEqual(['Equipment check', 'Inventory count']);
    expect(titles('title', 'desc')).toEqual(['Inventory count', 'Equipment check']);
    expect(enUS.more.label).toBe('More');
  });

  it('[TL-07/core] overflow pagination', () => {
    const items: SchedulerItem[] = Array.from({ length: 16 }, (_, index) => ({
      id: `k${String(index).padStart(2, '0')}`,
      level: 'routine',
      title: `Item ${index}`,
      start: '2031-03-12T09:00:00',
      end: '2031-03-12T10:30:00',
    }));
    const group = computeTimelineLayout(items, parityLayoutOptions(baseline.date, false)).overflow[0]!;
    expect(interpolate(enUS.overflow.title, { count: group.items.length }, 'en-US')).toBe(
      'More overlapping items (13)',
    );
    expect(group.items.slice(0, 10)).toHaveLength(10);
    expect(pageList(0, Math.ceil(group.items.length / 10))).toEqual([0, 1]);
  });

  it('[TL-08/core] first landing is the same for every user role (fixed: B-09)', () => {
    const input = { current: shifts[1]!, geometry, date, clientHeight: 900, nearBottomGutter: gutter };
    expect(timelineLandingTarget(timelineDefaults.landing.initial, input)).toBe(1986);
  });

  it('[TL-09/core] landing after a date change', () => {
    const input = {
      current: shifts[1]!,
      geometry,
      date: new Date('2031-03-12T14:00:00').getTime(),
      clientHeight: 800,
      nearBottomGutter: gutter,
    };
    expect(timelineLandingTarget(timelineDefaults.landing.onDateChange, input)).toBe(2390);
  });

  it('[TL-10/core] list → timeline switch lands near the bottom and realigns 280 ms later', () => {
    const input = { current: shifts[1]!, geometry, date, clientHeight: 800, nearBottomGutter: gutter };
    expect(timelineLandingTarget(timelineDefaults.landing.onViewEnter, input)).toBe(1788);
    expect(timelineDefaults.viewEnterRealignDelay).toBe(280);
  });

  it('[TL-11/core] scroll thresholds (fixed: B-26: the visible label is the name, the hint the description)', () => {
    const at1985 = navAt(1985);
    expect([at1985.active, at1985.top.label, at1985.bottom.label, at1985.bottom.hint]).toEqual([
      -1,
      'View previous shift',
      'View current shift',
      'Scroll to current shift start',
    ]);
    expect([1985, 1988, 1989].map((top) => timelineHeaderExpanded(top, shifts[1]!, geometry))).toEqual([
      true,
      true,
      false,
    ]);
    expect(navAt(1988).bottom.label).toBe('View next shift');

    const at4050 = navAt(4050);
    expect([at4050.active, at4050.top.label, at4050.bottom.disabled, at4050.bottom.label, at4050.bottom.hint]).toEqual([
      1,
      'View current shift',
      true,
      'Next shift',
      'No next shift available.',
    ]);
    expect(formatters.shiftRange(new Date(shifts[2]!.start), new Date(shifts[2]!.end))).toBe(
      'Mar 12, 8 PM - Mar 13, 8 AM',
    );

    const at0 = navAt(0);
    expect([at0.top.disabled, at0.top.label, at0.top.hint]).toEqual([
      true,
      'Previous shift',
      'No previous shift available.',
    ]);
    expect(formatters.shiftRange(new Date(shifts[0]!.start), new Date(shifts[0]!.end))).toBe(
      'Mar 11, 8 PM - Mar 12, 8 AM',
    );
  });

  it('[TL-12/core] the top button depends on the scroll position only (fixed: B-22)', () => {
    const { top } = navAt(2500);
    expect([top.label, top.hint]).toEqual(['View current shift', 'Scroll to current shift start']);
  });

  it('[TL-13/core] navigation targets (fixed: B-22)', () => {
    // From 2500 the top button targets the current shift start; the source jumped to the previous
    // shift (−78) because its header was expanded (B-22).
    expect(timelineNavTarget(navAt(2500).top.target!, geometry)).toBe(1986);
    expect(timelineNavTarget(navAt(2500).bottom.target!, geometry)).toBe(4050);
    expect(timelineNavTarget(navAt(1000).bottom.target!, geometry)).toBe(1986);
    expect(timelineNavTarget(shifts[0]!, geometry)).toBe(-78);
  });
});
