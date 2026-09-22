import { describe, expect, it } from 'vitest';
import { bucketItems } from '../../src/core/bucketing';
import { createFormatters } from '../../src/core/format';
import { computeTimelineLayout } from '../../src/core/layout';
import { classicLevels, compareByPlacement, resolveLevels } from '../../src/core/levels';
import { interpolate } from '../../src/core/localization';
import { listSectionTarget } from '../../src/core/list';
import { bottomNavState, carriedOverCount, type NavInput, topNavState } from '../../src/core/navigation';
import { listDefaults, pinDefaults, timelineDefaults } from '../../src/core/options';
import { isPinnable, nextPinned, pinnedEntries } from '../../src/core/pinning';
import { getShiftWindows } from '../../src/core/shifts';
import {
  timelineActiveIndex,
  timelineAtStart,
  timelineGeometry,
  timelineLandingTarget,
  timelineNavTarget,
  timeToPx,
} from '../../src/core/timeline';
import { resolveTimeLabel } from '../../src/core/time-label';
import { enUS } from '../../src/locales/en';
import { fixture, HOUR, parityLayoutOptions } from './adapter';

// Core-level rules of the browser scenarios (BR-*), titled "[ID/core]". Measured positions from the
// scenarios are injected; the real-browser runs of these scenarios come with M2.
const levels = resolveLevels(classicLevels);
const formatters = createFormatters('en-US');
const baseline = fixture('baseline-day');
const shifts = getShiftWindows(baseline.date);
const segments = bucketItems(baseline.items, shifts);
const geometry = timelineGeometry(shifts, timelineDefaults.hourHeight, timelineDefaults.leadMinutes);
const count = carriedOverCount(segments, levels);
const withCount = (label: string, n: number): string =>
  n > 0 ? `${label}${interpolate(enUS.nav.carriedOverCount, { count: n }, 'en-US')}` : label;

describe('browser scenarios (core rules)', () => {
  it('[BR-L01/core] list landing and pinned chips', () => {
    expect(listSectionTarget(612, 152, listDefaults.alignOffset)).toBe(452);
    const chips = pinnedEntries(segments, new Set(['p02', 'p03']), compareByPlacement(levels));
    expect(
      chips.map((chip) => [
        chip.item.title,
        chip.tags.map((tag) => enUS.tags[tag]).join(','),
        resolveTimeLabel(chip.item, enUS, formatters, 2 * HOUR),
      ]),
    ).toEqual([
      ['Backup verification', 'Inherited', 'Observed at: 1:48 AM – Present'],
      ['Network follow-up', 'Inherited', 'Observed at: 4:40 AM – Present'],
    ]);
  });

  it('[BR-L02/core] list navigation labels by position (fixed: B-06)', () => {
    const input = (activeIndex: number, atStart: boolean): NavInput => ({
      view: 'list',
      shifts,
      activeIndex,
      atStart: () => atStart,
      navigationAllowed: true,
      carriedOverCount: count,
      localization: enUS,
    });
    // Top of the list: no top button; bottom "View current shift".
    expect([topNavState(input(0, true)).visible, bottomNavState(input(0, true)).label]).toEqual([
      false,
      'View current shift',
    ]);
    // Inside the previous shift.
    const inside = topNavState(input(0, false));
    expect(withCount(inside.label, inside.carriedOverCount)).toBe('View previous shift(2 inherited)');
    // End of the list: the source still showed "(2 inherited)" next to "View current shift" (B-06).
    const end = topNavState(input(2, false));
    expect(withCount(end.label, end.carriedOverCount)).toBe('View current shift');
    expect(bottomNavState(input(2, false)).visible).toBe(false);
  });

  it('[BR-L03/core] list: next shift target', () => {
    expect(listSectionTarget(2000, 152, listDefaults.alignOffset)).toBe(2000 - 152 - 8);
  });

  it('[BR-L04/core] list: previous shift target uses the extra offset', () => {
    expect(listSectionTarget(0, 152, listDefaults.alignOffset, listDefaults.previousJumpExtraOffset)).toBeLessThan(0);
  });

  it('[BR-L05/core] list pin hysteresis', () => {
    let pinned = false;
    const states = [5, -1, -3, 20, 23].map((offset) => (pinned = nextPinned(pinned, offset, 0, pinDefaults.list)));
    expect(states).toEqual([false, false, true, true, false]);
  });

  it('[BR-L09/core] pinned strip with many chips', () => {
    const many = fixture('pinned-many');
    const manySegments = bucketItems(many.items, getShiftWindows(many.date));
    const pinnable = manySegments.flatMap((s) => s.items).filter((i) => isPinnable(i, levels.get(i.level)));
    expect(pinnable).toHaveLength(6);
    expect(pinnedEntries(manySegments, new Set(pinnable.map((i) => i.id)), compareByPlacement(levels))).toHaveLength(6);
  });

  it('[BR-T01/core] timeline landing, pinned chips and the top button', () => {
    const landing = timelineLandingTarget('shiftStart', {
      current: shifts[1]!,
      geometry,
      date: new Date(baseline.date).getTime(),
      clientHeight: 900,
      nearBottomGutter: 86,
    });
    expect(landing).toBe(1986);
    const index = timelineActiveIndex(1986, shifts, geometry);
    const top = topNavState({
      view: 'timeline',
      shifts,
      activeIndex: index,
      atStart: (i) => timelineAtStart(i, 1986, shifts, geometry),
      navigationAllowed: true,
      carriedOverCount: count,
      localization: enUS,
    });
    expect(withCount(top.label, top.carriedOverCount)).toBe('View previous shift(2 inherited)');
  });

  it('[BR-T02/core] timeline pin line (fixed: B-05: the line is the scroller top)', () => {
    const line = 0;
    expect(nextPinned(false, line + 2, line, pinDefaults.timeline)).toBe(false);
    expect(nextPinned(false, line - 2, line, pinDefaults.timeline)).toBe(true);
  });

  it('[BR-T03/core] timeline geometry', () => {
    const layout = computeTimelineLayout(baseline.items, parityLayoutOptions(baseline.date, false));
    expect(layout.height).toBe(36 * 172);
    expect(layout.cards.find((c) => c.item.id === 'c01')).toMatchObject({
      top: 2150,
      height: 254,
      column: 0,
      columns: 3,
    });
  });

  it('[BR-T04/core] timeline: next shift', () => {
    expect(timelineNavTarget(shifts[2]!, geometry)).toBe(4050);
    const bottom = bottomNavState({
      view: 'timeline',
      shifts,
      activeIndex: timelineActiveIndex(4050, shifts, geometry),
      atStart: () => false,
      navigationAllowed: true,
      carriedOverCount: count,
      localization: enUS,
    });
    expect([bottom.disabled, bottom.hint]).toEqual([true, 'No next shift available.']);
  });

  it('[BR-T05/core] landing after the view switch', () => {
    const input = {
      current: shifts[1]!,
      geometry,
      date: new Date(baseline.date).getTime(),
      clientHeight: 712,
      nearBottomGutter: 86,
    };
    expect(timelineLandingTarget('dateNearBottom', input)).toBe(1876);
  });

  it('[BR-T06/core] now line position', () => {
    expect(timeToPx(new Date(baseline.now).getTime(), geometry)).toBe(14.5 * 172);
  });

  it('[BR-T08/core] navigation tooltip text', () => {
    const bottom = bottomNavState({
      view: 'timeline',
      shifts,
      activeIndex: 1,
      atStart: () => true,
      navigationAllowed: true,
      carriedOverCount: count,
      localization: enUS,
    });
    expect(bottom.hint).toBe('Scroll to next shift start');
  });

  it('[BR-T09/core] "+more" chip position', () => {
    const group = computeTimelineLayout(baseline.items, parityLayoutOptions(baseline.date, false)).overflow[0]!;
    expect(timeToPx(group.anchor, geometry)).toBe(13 * 172);
  });
});
