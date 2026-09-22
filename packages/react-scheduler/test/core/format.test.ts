import { describe, expect, it } from 'vitest';
import { createFormatters } from '../../src/core/format';

const at = (day: number, h: number, m = 0): Date => new Date(2031, 2, day, h, m);
const en = createFormatters('en-US');

describe('createFormatters (en-US)', () => {
  it('formats clock times, time ranges and shift ranges', () => {
    expect(en.clockTime(at(12, 10, 30))).toBe('10:30 AM');
    expect(en.timeRange(at(12, 9), at(12, 10, 30))).toBe('9:00 AM – 10:30 AM');
    expect(en.shiftRange(at(11, 20), at(12, 8))).toBe('Mar 11, 8 PM - Mar 12, 8 AM');
  });

  it('writes compact hour labels', () => {
    expect([0, 8, 12, 13, 20].map((h) => en.hourLabel(at(12, h)))).toEqual(['12AM', '8AM', '12PM', '1PM', '8PM']);
  });

  it('keeps the Intl hour label with hourLabelFormat "locale"', () => {
    expect(createFormatters('en-US', { hourLabelFormat: 'locale' }).hourLabel(at(12, 8))).toBe('8 AM');
  });

  it('formats "since" timestamps and date-times without the comma', () => {
    expect(en.sinceTimestamp(at(12, 7, 45))).toBe('03/12/2031 07:45 AM');
    expect(en.dateTime(at(12, 21, 5))).toBe('03/12/2031 09:05 PM');
  });

  it('returns an empty string for invalid dates', () => {
    const invalid = new Date(Number.NaN);
    expect([
      en.clockTime(invalid),
      en.hourLabel(invalid),
      en.shiftRange(invalid, at(12, 8)),
      en.timeRange(at(12, 8), invalid),
      en.sinceTimestamp(invalid),
    ]).toEqual(['', '', '', '', '']);
  });
});

describe('[B-15] formats follow the requested locale', () => {
  it('uses the locale’s own clock and hour labels', () => {
    const de = createFormatters('de-DE');
    expect(de.clockTime(at(12, 10, 30))).toBe('10:30');
    expect(de.hourLabel(at(12, 8))).toBe('08 Uhr');
    expect(de.sinceTimestamp(at(12, 7, 45))).toBe('12.03.2031 07:45');
    expect(createFormatters('fr-FR').shiftRange(at(11, 20), at(12, 8))).toBe('11 mars, 20 h - 12 mars, 08 h');
  });

  it('keeps day-period hour labels compact in 12-hour locales', () => {
    expect(createFormatters('es-ES-u-hc-h12').hourLabel(at(12, 20))).toBe('8p. m.');
  });

  it('falls back to en-US only when Intl does not support the locale', () => {
    expect(createFormatters('xx-invalid-!!').clockTime(at(12, 10, 30))).toBe('10:30 AM');
  });
});
