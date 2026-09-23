// SPDX-License-Identifier: MIT
// Locale-aware formatters (Feature Dossier 05 F-12). The source hard-coded en-US hour labels and a
// US "since" pattern, and recognized only en/es for dates (B-15); every format now follows `locale`
// and falls back to en-US only when Intl does not support it.
import { supportedLocale } from './localization';

/**
 * The functions that turn times, ranges and counts into text. Replace one to override a single format.
 *
 * @category Localization
 * @since 1.0.0
 */
export interface SchedulerFormatters {
  /** "10:30 AM" */
  clockTime(date: Date): string;
  /** "8AM" */
  hourLabel(date: Date): string;
  /** "Mar 12, 8 AM - Mar 12, 8 PM" */
  shiftRange(start: Date, end: Date): string;
  /** "9:00 AM – 10:30 AM" */
  timeRange(start: Date, end: Date): string;
  /** "03/12/2031 07:45 AM" in en-US */
  sinceTimestamp(date: Date): string;
  /** Overflow table time column. */
  dateTime(date: Date): string;
}

/**
 * What the formatters need to know: the locale and the strings around the values.
 *
 * @category Localization
 * @since 1.0.0
 */
export interface FormatterOptions {
  /** 'compact' removes the space between the hour and a day period ("8AM"); 'locale' keeps Intl output. */
  hourLabelFormat?: 'compact' | 'locale';
}

const valid = (date: Date): boolean => Number.isFinite(date.getTime());
const WHITESPACE = /^\s+$/u;
// Engines differ on printing U+202F (narrow no-break space) before day periods; every output uses an
// ordinary space, as the characterization goldens do.
const NARROW_NO_BREAK_SPACE = new RegExp(String.fromCharCode(0x202f), 'g');
const plain = (text: string): string => text.replace(NARROW_NO_BREAK_SPACE, ' ');
const joinParts = (values: readonly string[]): string => plain(values.join(''));

/** Joins parts, dropping whitespace between an hour and a day period ("8 AM" → "8AM"; "8 Uhr" stays). */
function compactHour(parts: readonly Intl.DateTimeFormatPart[]): string {
  const kept = parts
    .filter((part, index) => {
      if (part.type !== 'literal' || !WHITESPACE.test(part.value)) return true;
      const kinds = [parts[index - 1]?.type, parts[index + 1]?.type];
      return !(kinds.includes('hour') && kinds.includes('dayPeriod'));
    })
    .map((part) => part.value);
  return joinParts(kept);
}

/** Replaces a comma between the date and the time with a space ("03/12/2031, 07:45 AM" → "03/12/2031 07:45 AM"). */
function withoutDateTimeComma(parts: readonly Intl.DateTimeFormatPart[]): string {
  const firstTime = parts.findIndex((part) => part.type === 'hour' || part.type === 'dayPeriod');
  return joinParts(
    parts.map((part, index) =>
      index === firstTime - 1 && part.type === 'literal' && part.value.includes(',')
        ? part.value.replace(/\s*,\s*/, ' ')
        : part.value,
    ),
  );
}

/**
 * Builds the default formatters for a locale, which `formatters` can then override one by one.
 *
 * @category Localization
 * @since 1.0.0
 * @param locale The BCP 47 tag every format is produced with.
 * @param options Overrides for individual formats, such as the hour label.
 */
export function createFormatters(locale: string, options: FormatterOptions = {}): SchedulerFormatters {
  const resolved = supportedLocale(locale);
  // Engines disagree about whether a `numeric` hour is padded in a 24-hour locale: Node prints
  // `0:15` for Romanian and Firefox `00:15`, which makes a server-rendered schedule and its hydrated
  // copy differ. Asking for the padding the locale's own convention uses is the same text in both.
  const hourDigits = new Intl.DateTimeFormat(resolved, { hour: 'numeric' }).resolvedOptions().hourCycle;
  const hourStyle = hourDigits === 'h23' || hourDigits === 'h24' ? '2-digit' : 'numeric';
  const clock = new Intl.DateTimeFormat(resolved, { hour: hourStyle, minute: '2-digit' });
  const hour = new Intl.DateTimeFormat(resolved, { hour: hourStyle });
  const boundary = new Intl.DateTimeFormat(resolved, { month: 'short', day: 'numeric', hour: hourStyle });
  const timestamp = new Intl.DateTimeFormat(resolved, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const compact = (options.hourLabelFormat ?? 'compact') === 'compact';

  const clockTime = (date: Date): string => (valid(date) ? plain(clock.format(date)) : '');
  const stamp = (date: Date): string => (valid(date) ? withoutDateTimeComma(timestamp.formatToParts(date)) : '');
  return {
    clockTime,
    hourLabel: (date) =>
      !valid(date) ? '' : compact ? compactHour(hour.formatToParts(date)) : plain(hour.format(date)),
    shiftRange: (start, end) =>
      valid(start) && valid(end) ? plain(`${boundary.format(start)} - ${boundary.format(end)}`) : '',
    timeRange: (start, end) => (valid(start) && valid(end) ? `${clockTime(start)} – ${clockTime(end)}` : ''),
    sinceTimestamp: stamp,
    dateTime: stamp,
  };
}
