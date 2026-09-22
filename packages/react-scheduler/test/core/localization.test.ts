import { describe, expect, it } from 'vitest';
import { interpolate, mergeLocalization, supportedLocale } from '../../src/core/localization';
import { enUS } from '../../src/locales/en';

describe('interpolate', () => {
  it('fills {{name}} placeholders and formats numbers with the locale', () => {
    expect(interpolate('Now: {{time}}', { time: '10:41 AM' }, 'en-US')).toBe('Now: 10:41 AM');
    expect(interpolate('{{count}} items', { count: 1234 }, 'de-DE')).toBe('1.234 items');
  });

  it('picks plural forms with Intl.PluralRules, falling back to "other"', () => {
    const forms = { one: '{{count}} shift', few: '{{count}} shifts (few)', other: '{{count}} shifts' };
    expect(interpolate(forms, { count: 1 }, 'en-US')).toBe('1 shift');
    expect(interpolate(forms, { count: 3 }, 'en-US')).toBe('3 shifts');
    // Romanian needs "few" (docs pack 06 §5.3).
    expect(interpolate(forms, { count: 3 }, 'ro-RO')).toBe('3 shifts (few)');
    expect(interpolate(forms, { count: 20 }, 'ro-RO')).toBe('20 shifts');
    expect(interpolate({ other: 'x {{count}}' }, { count: 1 }, 'en-US')).toBe('x 1');
  });

  it('uses "other" without a numeric count and leaves unknown placeholders', () => {
    expect(interpolate({ one: 'one', other: 'other {{missing}}' }, {}, 'en-US')).toBe('other {{missing}}');
  });

  it('works with unsupported locales', () => {
    expect(supportedLocale('en-US')).toBe('en-US');
    expect(supportedLocale('not a locale')).toBe('en-US');
    expect(interpolate('{{count}}', { count: 1000 }, 'not a locale')).toBe('1,000');
  });
});

describe('mergeLocalization', () => {
  it('returns the base when there is nothing to merge', () => {
    expect(mergeLocalization(enUS)).toBe(enUS);
  });

  it('merges nested keys and adds labels for custom levels', () => {
    const merged = mergeLocalization(enUS, { nav: { viewNext: 'Next' }, levels: { urgent: 'Urgent' } });
    expect(merged.nav.viewNext).toBe('Next');
    expect(merged.nav.viewPrevious).toBe('View previous shift');
    expect(merged.levels).toMatchObject({ urgent: 'Urgent', critical: 'Critical' });
  });

  it('replaces plural templates as a whole so forms of two languages never mix', () => {
    const base = mergeLocalization(enUS, { nav: { carriedOverCount: { one: 'a', few: 'b', other: 'c' } } });
    const merged = mergeLocalization(base, { nav: { carriedOverCount: { other: 'only' } } });
    expect(merged.nav.carriedOverCount).toEqual({ other: 'only' });
  });

  it('ignores undefined overrides', () => {
    expect(mergeLocalization(enUS, { emptyAll: undefined }).emptyAll).toBe(enUS.emptyAll);
  });
});
