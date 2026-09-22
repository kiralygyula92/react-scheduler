// SPDX-License-Identifier: MIT
// Localization (Feature Dossier 06 §6, 05 F-12): every user-visible and assistive-technology string
// is a key of SchedulerLocalization; placeholders are `{{name}}`; plurals use Intl.PluralRules.

export type PluralForms = { other: string } & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>;

export interface SchedulerLocalization {
  /** BCP 47, used for Intl. */
  locale: string;
  dir?: 'ltr' | 'rtl';
  emptyAll: string;
  emptyShift: string;
  loading: string;
  errorTitle: string;
  retry: string;
  shiftHeader: { previous: string; current: string; next: string; earlier: PluralForms; later: PluralForms };
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
  scrollTop: string;
  timeLabel: { observed: string; since: string };
  referenceLabel: string;
  more: { label: string; ariaLabel: PluralForms };
  overflow: {
    title: PluralForms;
    empty: string;
    tableLabel: string;
    close: string;
    closeIcon: string;
    viewDetails: string;
    column: { time: string; level: string; title: string; description: string; actions: string };
  };
  pagination: { label: string; previous: string; next: string; page: string };
  levels: Record<string, string>;
  tags: Record<string, string>;
  pinnedStrip: { label: string; announcement: PluralForms };
  now: { label: string };
  views: { list: string; timeline: string };
  detail: { close: string };
  card: { description: string };
}

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
