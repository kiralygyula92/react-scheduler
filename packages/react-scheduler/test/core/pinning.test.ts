import { describe, expect, it } from 'vitest';
import { classicLevels, compareByPlacement, resolveLevels } from '../../src/core/levels';
import { pinDefaults } from '../../src/core/options';
import { diffPinned, isPinnable, nextPinned, pinnedEntries, withCarriedOverTag } from '../../src/core/pinning';
import { getShiftWindows } from '../../src/core/shifts';
import type { SchedulerItem, ShiftSegment } from '../../src/core/types';

const levels = resolveLevels(classicLevels);
const item = (id: string, level: string, start: string, extra: Partial<SchedulerItem> = {}): SchedulerItem => ({
  id,
  level,
  start,
  title: id,
  ...extra,
});

describe('isPinnable', () => {
  it('pins pinned items always, then follows pinnable, then the level', () => {
    expect(isPinnable(item('a', 'routine', '', { pinned: true, pinnable: false }), levels.get('routine'))).toBe(true);
    expect(isPinnable(item('b', 'critical', '', { pinnable: false }), levels.get('critical'))).toBe(false);
    expect(isPinnable(item('c', 'routine', '', { pinnable: true }), levels.get('routine'))).toBe(true);
    expect(isPinnable(item('d', 'critical', ''), levels.get('critical'))).toBe(true);
    expect(isPinnable(item('e', 'custom', ''), undefined)).toBe(false);
  });
});

describe('nextPinned', () => {
  it('pins with epsilon and releases with hysteresis (list rule)', () => {
    const rule = pinDefaults.list;
    let pinned = false;
    const states = [5, -1, -3, 20, 23].map((top) => (pinned = nextPinned(pinned, top, 0, rule)));
    expect(states).toEqual([false, false, true, true, false]);
  });

  it('pins at the line itself with the timeline rule', () => {
    const rule = pinDefaults.timeline;
    expect([nextPinned(false, 1, 0, rule), nextPinned(false, 0, 0, rule), nextPinned(true, 1, 0, rule)]).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe('pinned strip content', () => {
  const [previous, current] = getShiftWindows('2031-03-12T10:30:00') as [
    ShiftSegment<SchedulerItem>['shift'],
    ShiftSegment<SchedulerItem>['shift'],
  ];
  const segments: ShiftSegment<SchedulerItem>[] = [
    {
      shift: previous,
      items: [
        item('p2', 'critical', '2031-03-12T02:00:00', { tags: ['impactsNextShift'] }),
        item('p1', 'critical', '2031-03-12T01:00:00'),
        item('p3', 'critical', '2031-03-12T03:00:00', { tags: ['carriedOver'] }),
      ],
    },
    {
      shift: current,
      items: [
        item('c1', 'critical', '2031-03-12T09:00:00'),
        item('c2', 'routine', '2031-03-12T10:00:00', { pinned: true }),
      ],
    },
  ];

  it('[B-25] appends the carried-over tag to earlier-shift chips and keeps their other tags', () => {
    expect(withCarriedOverTag(['impactsNextShift'])).toEqual(['impactsNextShift', 'carriedOver']);
    expect(withCarriedOverTag(['carriedOver'])).toEqual(['carriedOver']);
    expect(withCarriedOverTag(undefined)).toEqual(['carriedOver']);
  });

  it('lists pinned and always-pinned items in the strip order with their chip tags', () => {
    const entries = pinnedEntries(segments, new Set(['p2', 'p1', 'p3', 'c1']), compareByPlacement(levels));
    expect(entries.map((e) => [e.item.id, e.carriedOver, e.tags.join('|')])).toEqual([
      ['p1', true, 'carriedOver'],
      ['p2', true, 'impactsNextShift|carriedOver'],
      ['p3', true, 'carriedOver'],
      ['c1', false, ''],
      ['c2', false, ''],
    ]);
  });
});

describe('diffPinned', () => {
  it('reports added and removed ids', () => {
    expect(diffPinned(['a', 'b'], ['b', 'c'])).toEqual({ added: ['c'], removed: ['a'] });
  });
});
