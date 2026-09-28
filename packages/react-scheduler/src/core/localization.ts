// SPDX-License-Identifier: MIT
// Localization (Feature Dossier 06 §6, 05 F-12): every user-visible and assistive-technology string
// is a key of SchedulerLocalization; placeholders are `{{name}}`; plurals use Intl.PluralRules.

/**
 * The plural forms of one message, selected with `Intl.PluralRules` for the active locale.
 *
 * @category Localization
 * @since 1.0.0
 */
export type PluralForms = {
  /** The form used when no other plural category matches; every pack has it. */
  other: string;
} & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>;

/**
 * Every string the component can show. A locale pack is one of these.
 *
 * @category Localization
 * @since 1.0.0
 */
export interface SchedulerLocalization {
  /** BCP 47, used for Intl. */
  locale: string;
  /** The writing direction of this language; `rtl` flips the whole layout. */
  dir?: 'ltr' | 'rtl';
  /** Shown when no rendered shift holds an item. */
  emptyAll: string;
  /** Shown in a shift that holds no item. */
  emptyShift: string;
  /** Announced while the schedule waits for data. */
  loading: string;
  /** The heading of the error state. */
  errorTitle: string;
  /** The label of the retry button of the error state. */
  retry: string;
  /** The words a shift heading uses for its place relative to the current shift. */
  shiftHeader: { previous: string; current: string; next: string; earlier: PluralForms; later: PluralForms };
  /** Every label and hint of the two navigation buttons. */
  nav: {
    viewPrevious: string;
    viewCurrent: string;
    viewNext: string;
    viewEarlier: string;
    viewLater: string;
    toPreviousHint: string;
    toCurrentHint: string;
    toNextHint: string;
    toEarlierHint: string;
    toLaterHint: string;
    noPrevious: string;
    noNext: string;
    carriedOverCount: PluralForms;
  };
  /** The label of the button that scrolls back to the top. */
  scrollTop: string;
  /** How an open-ended time is written on a card. */
  timeLabel: { observed: string; since: string };
  /** The label read before a reference number. */
  referenceLabel: string;
  /** The "More" chip: what it shows and what it is called. */
  more: { label: string; ariaLabel: PluralForms };
  /** The overflow dialog: its title, its columns and its close labels. */
  overflow: {
    title: PluralForms;
    empty: string;
    tableLabel: string;
    close: string;
    closeIcon: string;
    viewDetails: string;
    column: { time: string; level: string; title: string; description: string; actions: string };
  };
  /** The pagination of the overflow table. */
  pagination: { label: string; previous: string; next: string; page: string };
  /** A label per level key; a key without one falls back to the key itself. */
  levels: Record<string, string>;
  /** A label per tag key; a key without one falls back to the key itself. */
  tags: Record<string, string>;
  /** The pinned strip: its label and what it announces when the set changes. */
  pinnedStrip: { label: string; announcement: PluralForms };
  /** The label of the now marker, with its time. */
  now: { label: string };
  /** The names of the two views, for a switch of your own. */
  views: { list: string; timeline: string };
  /** The close label of the item detail. */
  detail: { close: string };
  /** The pattern of a card's accessible description: its level and its time. */
  card: { description: string };
}

/**
 * The same shape with every member optional, at every depth.
 *
 * @category Localization
 * @since 1.0.0
 */
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> | undefined } : T;

const pluralRules = new Map<string, Intl.PluralRules>();
const numberFormats = new Map<string, Intl.NumberFormat>();

/** The locale itself when `Intl` supports it, otherwise `en-US`. */
export function supportedLocale(locale: string): string {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(locale).length > 0 ? locale : 'en-US';
  } catch {
    return 'en-US';
  }
}

function cached<T>(cache: Map<string, T>, locale: string, create: (locale: string) => T): T {
  let value = cache.get(locale);
  if (!value) {
    value = create(supportedLocale(locale));
    cache.set(locale, value);
  }
  return value;
}

/**
 * Fills `{{name}}` placeholders. A plural template picks its form for `values.count` with
 * `Intl.PluralRules(locale)`, falling back to `other`. Numbers are formatted with `Intl.NumberFormat`.
 * An unknown placeholder is left as written.
 *
 * @param template A message with `{{name}}` placeholders.
 * @param values What to put in place of each placeholder.
 * @param locale The locale the numbers are formatted with.
 */
export function interpolate(
  template: string | PluralForms,
  values: Record<string, string | number>,
  locale: string,
): string {
  let text: string;
  if (typeof template === 'string') {
    text = template;
  } else {
    const count = values['count'];
    const form =
      typeof count === 'number' ? cached(pluralRules, locale, (l) => new Intl.PluralRules(l)).select(count) : 'other';
    text = template[form] ?? template.other;
  }
  return text.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => {
    const value = values[name];
    if (value === undefined) return placeholder;
    return typeof value === 'number'
      ? cached(numberFormats, locale, (l) => new Intl.NumberFormat(l)).format(value)
      : value;
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Plural templates are replaced as a whole, so forms of two languages never mix. */
const isPluralForms = (value: unknown): value is PluralForms => isRecord(value) && typeof value['other'] === 'string';

function mergeDeep(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const current = result[key];
    result[key] = isRecord(value) && isRecord(current) && !isPluralForms(value) ? mergeDeep(current, value) : value;
  }
  return result;
}

/** A complete localization: `base` with the partial `override` applied on top. */
export function mergeLocalization(
  base: SchedulerLocalization,
  override?: DeepPartial<SchedulerLocalization>,
): SchedulerLocalization {
  if (!override) return base;
  return mergeDeep(base as unknown as Record<string, unknown>, override) as unknown as SchedulerLocalization;
}
