import { describe, expect, it } from 'vitest';
import {
  type ListOptions,
  listDefaults,
  resolveListOptions,
  resolvePinRule,
  resolveTimelineOptions,
  timelineDefaults,
} from '../../src/core/options';

describe('behaviour options', () => {
  it('resolves to the parity defaults', () => {
    expect(resolveListOptions()).toEqual(listDefaults);
    expect(resolveTimelineOptions()).toEqual(timelineDefaults);
    expect(timelineDefaults).toMatchObject({ hourHeight: 172, leadMinutes: 30, overflowMergeWindow: 7_200_000 });
    expect(listDefaults.landing).toEqual({ initial: 'shiftStart', onDateChange: 'shiftStart', onViewEnter: 'none' });
  });

  it('merges partial options, including landing, and ignores undefined values', () => {
    // JavaScript callers may pass undefined explicitly.
    const list = resolveListOptions({
      navigationThreshold: 3,
      alignOffset: undefined,
      landing: { onViewEnter: 'date' },
    } as unknown as ListOptions);
    expect(list).toMatchObject({ navigationThreshold: 3, alignOffset: 8 });
    expect(list.landing).toEqual({ initial: 'shiftStart', onDateChange: 'shiftStart', onViewEnter: 'date' });
    expect(resolveTimelineOptions({ hourHeight: 120 }).landing.onDateChange).toBe('dateNearBottom');
  });

  it('resolves per-view pin rules', () => {
    expect(resolvePinRule('list')).toEqual({ edge: 'top', epsilon: 2, hysteresis: 24 });
    expect(resolvePinRule('timeline', { hysteresis: 10 })).toEqual({ edge: 'bottom', epsilon: 0, hysteresis: 10 });
  });
});
