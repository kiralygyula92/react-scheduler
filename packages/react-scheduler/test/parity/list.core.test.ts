import { describe, expect, it } from 'vitest';
import { bucketItems, segmentsFromInput } from '../../src/core/bucketing';
import { reconcileOpenItem } from '../../src/core/detail';
import { createFormatters } from '../../src/core/format';
import { classicLevels, resolveLevels } from '../../src/core/levels';
import { interpolate } from '../../src/core/localization';
import { listActiveIndex, listHeaderExpanded, type ListMetrics, scrollTopButtonVisible } from '../../src/core/list';
import {
  bottomNavState,
  carriedOverCount,
  navigationAllowed,
  type NavInput,
  shiftTitle,
  topNavState,
} from '../../src/core/navigation';
import { nowMarkerIndex, nowVisible } from '../../src/core/now';
import { listDefaults } from '../../src/core/options';
import { isPinnable } from '../../src/core/pinning';
import { getShiftWindows } from '../../src/core/shifts';
import { resolveTimeLabel } from '../../src/core/time-label';
import type { SchedulerItem } from '../../src/core/types';
import { enUS } from '../../src/locales/en';
import { fixture, HOUR } from './adapter';

// Core-level rules of the list DOM scenarios (LV-*). Titles use "[ID/core]": these tests do not count
// as scenario coverage; the rendered assertions land with the React components (M2).
const levels = resolveLevels(classicLevels);
const formatters = createFormatters('en-US');
const baseline = fixture('baseline-day');
const windows = getShiftWindows(baseline.date);
const segments = bucketItems(baseline.items, windows);
const byId = new Map(baseline.items.map((i) => [i.id, i]));
const navInput = (overrides: Partial<NavInput>): NavInput => ({
  view: 'list',
  shifts: windows,
  activeIndex: 1,
  atStart: () => false,
  navigationAllowed: navigationAllowed(segments, listDefaults.navigationThreshold),
  carriedOverCount: carriedOverCount(segments, levels),
  localization: enUS,
  ...overrides,
});

describe('list scenarios (core rules)', () => {
  it('[LV-01/core] section titles and range labels', () => {
    expect(windows.map((w) => shiftTitle(w.offset, enUS))).toEqual(['Previous shift', 'Current shift', 'Next shift']);
    expect(windows.map((w) => formatters.shiftRange(new Date(w.start), new Date(w.end)))).toEqual([
      'Mar 11, 8 PM - Mar 12, 8 AM',
      'Mar 12, 8 AM - Mar 12, 8 PM',
      'Mar 12, 8 PM - Mar 13, 8 AM',
    ]);
  });

  it('[LV-02/core] card order within sections', () => {
    expect(segments.flatMap((s) => s.items.map((i) => i.id))).toEqual([
      'p01',
      'p02',
      'p03',
      'p04',
      ...['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10'],
      'n01',
      'n02',
      'n03',
    ]);
  });

  it('[LV-03/core] an empty shift', () => {
    const withoutNext = bucketItems(
      baseline.items.filter((i) => !i.id.startsWith('n')),
      windows,
    );
    expect(withoutNext[2]?.items).toEqual([]);
    expect(enUS.emptyShift).toBe('No items in this shift.');
  });

  it('[LV-04/core] no items at all: no navigation', () => {
    const empty = bucketItems(fixture('empty').items, windows);
    expect(empty.every((s) => s.items.length === 0)).toBe(true);
    const input = navInput({ navigationAllowed: navigationAllowed(empty, listDefaults.navigationThreshold) });
    expect([topNavState(input).visible, bottomNavState(input).visible]).toEqual([false, false]);
    expect(enUS.emptyAll).toBe('No agenda data available.');
  });

  it('[LV-05/core] navigation threshold', () => {
    const withCounts = (counts: number[]) =>
      counts.map((count, index) => ({ shift: windows[index]!, items: Array.from({ length: count }) }));
    expect(navigationAllowed(bucketItems(fixture('sparse').items, windows), 5)).toBe(false);
    expect(navigationAllowed(withCounts([4, 4, 4]), 5)).toBe(false);
    expect(navigationAllowed(withCounts([1, 5, 0]), 5)).toBe(true);
  });

  it('[LV-06/core] carried-over count (fixed: B-06)', () => {
    expect(carriedOverCount(segments, levels)).toBe(2);
    // Shown with the top button when it targets the previous shift…
    const top = topNavState(navInput({ atStart: () => true }));
    expect([top.label, top.carriedOverCount]).toEqual(['View previous shift', 2]);
    expect(`${top.label}${interpolate(enUS.nav.carriedOverCount, { count: top.carriedOverCount }, 'en-US')}`).toBe(
      'View previous shift(2 inherited)',
    );
    // …but no longer when it says "View current shift".
    expect(topNavState(navInput({ activeIndex: 2 })).carriedOverCount).toBe(0);
  });

  it('[LV-07/core] list card content', () => {
    const label = (id: string): string => resolveTimeLabel(byId.get(id)!, enUS, formatters, 2 * HOUR);
    const c02 = byId.get('c02')!;
    expect([label('c02'), enUS.levels[c02.level], `${enUS.referenceLabel} ${c02.reference ?? ''}`]).toEqual([
      '9:00 AM – 10:30 AM',
      'Watch',
      'Ref: 1042',
    ]);
    const c01 = byId.get('c01')!;
    expect([label('c01'), enUS.levels[c01.level], enUS.tags[c01.tags![0]!]]).toEqual([
      'Observed at: 8:12 AM – Present',
      'Critical',
      'Impacts Next Shift',
    ]);
    expect(label('c04')).toBe('Ready since: 03/12/2031 07:45 AM');
    // Only pinned-level cards get a pin sentinel.
    const pinnable = baseline.items.filter((i) => isPinnable(i, levels.get(i.level))).map((i) => i.id);
    expect(pinnable).toEqual(['p02', 'p03', 'c01', 'c06', 'n03']);
  });

  it('[LV-08/core] now marker in the list (fixed: B-01)', () => {
    const now = new Date('2031-03-12T10:41:00').getTime();
    const current = windows[1]!;
    expect(
      nowVisible({
        enabled: true,
        now,
        date: new Date(baseline.date).getTime(),
        current,
        rangeStart: windows[0]!.start,
        rangeEnd: windows[2]!.end,
      }),
    ).toBe(true);
    // The marker sits before the first card starting after now (c06, 11:30).
    expect(nowMarkerIndex(segments[1]!.items, now)).toBe(5);
    expect(formatters.clockTime(new Date(now))).toBe('10:41 AM');
  });

  it('[LV-10/core] no current shift', () => {
    const inputs = segmentsFromInput<SchedulerItem>([
      { role: 'previous', start: windows[0]!.start, end: windows[0]!.end, items: [] },
      { role: 'next', start: windows[2]!.start, end: windows[2]!.end, items: [] },
    ]);
    expect(inputs.some((s) => s.shift.offset === 0)).toBe(false);
  });

  it('[LV-12/core] a detail view whose item disappears does not reopen by itself (fixed: B-03)', () => {
    const closed = reconcileOpenItem(
      'c01',
      baseline.items.filter((i) => i.id !== 'c01'),
    );
    expect(closed).toMatchObject({ openItemId: null, closeReason: 'itemRemoved' });
    expect(reconcileOpenItem(closed.openItemId, baseline.items).item).toBeNull();
  });

  it('[LV-14/core] header expanded signal with the injected layout (fixed: B-08)', () => {
    const metricsAt = (scrollTop: number): ListMetrics => ({
      scrollTop,
      clientHeight: 600,
      scrollHeight: 3000,
      stickyHeight: 64,
      sections: [
        { top: 0, headerHeight: 60 },
        { top: 600, headerHeight: 60 },
        { top: 2200, headerHeight: 60 },
      ],
    });
    const cards = [0, 1, 2, 3, 4].map((i) => ({ top: 660 + i * 110, height: 100 }));
    const expanded = (scrollTop: number): boolean => {
      const metrics = metricsAt(scrollTop);
      return listHeaderExpanded({
        metrics,
        currentIndex: 1,
        activeIndex: listActiveIndex(metrics, 8),
        currentItemCount: 10,
        currentCards: cards,
        options: listDefaults,
      });
    };
    expect([100, 536, 1100].map(expanded)).toEqual([true, true, false]);
    // Source: 878 → true, 879 → false (the 3rd element was a pin sentinel). Fixed: the 3rd card counts.
    expect([878, 879, 988, 989].map(expanded)).toEqual([true, true, true, false]);
  });

  it('[LV-15/core] scroll-to-top button threshold', () => {
    expect([96, 97].map((top) => scrollTopButtonVisible(top, listDefaults.scrollTopThreshold))).toEqual([false, true]);
    expect(enUS.scrollTop).toBe('Scroll to top');
  });
});
