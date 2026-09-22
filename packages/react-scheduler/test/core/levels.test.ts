import { describe, expect, it } from 'vitest';
import {
  CARRIED_OVER_TAG,
  classicLevels,
  classicTags,
  compareByPlacement,
  rankOf,
  resolveLevels,
} from '../../src/core/levels';
import type { SchedulerItem } from '../../src/core/types';

const item = (id: string, level: string, start = '2031-03-12T09:00:00'): SchedulerItem => ({
  id,
  level,
  start,
  title: id,
});

describe('classic definitions', () => {
  it('lists the 9 parity levels strongest first with their variants', () => {
    expect(classicLevels.map((level) => [level.key, level.rank, level.variant, level.pinOnPass])).toEqual([
      ['critical', 0, 'alert', true],
      ['watch', 1, 'default', false],
      ['monitoring', 2, 'default', false],
      ['capacityWatch', 3, 'default', false],
      ['ready', 4, 'default', false],
      ['normal', 5, 'default', false],
      ['onTarget', 6, 'default', false],
      ['routine', 7, 'default', false],
      ['resolved', 8, 'muted', false],
    ]);
  });

  it('defines the two classic tags and the carried-over tag key', () => {
    expect(classicTags.map((tag) => tag.key)).toEqual(['impactsNextShift', 'carriedOver']);
    expect(CARRIED_OVER_TAG).toBe('carriedOver');
  });
});

describe('resolveLevels', () => {
  it('defaults rank to the array index, variant to "default" and pinOnPass to false', () => {
    const levels = resolveLevels([
      { key: 'high', color: 'red' },
      { key: 'low', rank: 10, pinOnPass: true },
    ]);
    expect(levels.get('high')).toEqual({ key: 'high', color: 'red', rank: 0, variant: 'default', pinOnPass: false });
    expect(levels.get('low')).toEqual({ key: 'low', rank: 10, variant: 'default', pinOnPass: true });
  });

  it('ranks unknown keys after every known level', () => {
    expect(rankOf(resolveLevels(classicLevels), 'unknown')).toBeGreaterThan(8);
  });
});

describe('compareByPlacement', () => {
  const compare = compareByPlacement(resolveLevels(classicLevels));

  it('orders by start, then rank, then id', () => {
    const items = [
      item('b', 'watch'),
      item('a', 'watch'),
      item('z', 'critical'),
      item('early', 'resolved', '2031-03-12T08:00:00'),
    ];
    expect(items.sort(compare).map((x) => x.id)).toEqual(['early', 'z', 'a', 'b']);
  });

  it('compares mixed date inputs by their instant', () => {
    expect(
      compare(item('a', 'watch', '2031-03-12T09:00:00'), { ...item('b', 'watch'), start: new Date(2031, 2, 12, 8) }),
    ).toBeGreaterThan(0);
  });
});
