import { describe, expect, it } from 'vitest';
import { createFormatters } from '../../src/core/format';
import { resolveTimeLabel } from '../../src/core/time-label';
import type { SchedulerItem } from '../../src/core/types';
import { enUS } from '../../src/locales/en';

const formatters = createFormatters('en-US');
const TWO_HOURS = 2 * 3_600_000;
const label = (overrides: Partial<SchedulerItem>): string =>
  resolveTimeLabel(
    { id: 'x', level: 'routine', title: 'X', start: '2031-03-12T09:00:00', ...overrides },
    enUS,
    formatters,
    TWO_HOURS,
  );

describe('resolveTimeLabel', () => {
  it('uses an explicit timeLabel as is', () => {
    expect(label({ timeLabel: 'All day', observedLabel: '8:12 AM – Present' })).toBe('All day');
  });

  it('prefers the observed label over since', () => {
    expect(label({ observedLabel: '8:12 AM – Present', since: '2031-03-12T07:45:00' })).toBe(
      'Observed at: 8:12 AM – Present',
    );
  });

  it('[B-24] ignores a missing or empty observed label instead of printing "undefined"', () => {
    expect(label({ observedLabel: '' })).toBe('9:00 AM – 11:00 AM');
    expect(label({})).not.toContain('undefined');
  });

  it('formats a valid since, and shows the bare prefix for an invalid one', () => {
    expect(label({ since: '2031-03-12T07:45:00' })).toBe('Ready since: 03/12/2031 07:45 AM');
    expect(label({ since: 'yesterday' })).toBe('Ready since:');
  });

  it('otherwise shows start – end, with a missing end at start + defaultDuration', () => {
    expect(label({ end: '2031-03-12T10:30:00' })).toBe('9:00 AM – 10:30 AM');
    expect(label({})).toBe('9:00 AM – 11:00 AM');
  });

  it('is empty for an invalid start', () => {
    expect(label({ start: 'soon' })).toBe('');
  });
});
