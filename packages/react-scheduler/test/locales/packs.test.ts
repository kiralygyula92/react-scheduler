import { describe, expect, it } from 'vitest';
import { createFormatters } from '../../src/core/format';
import { interpolate, type PluralForms, type SchedulerLocalization } from '../../src/core/localization';
import * as packs from '../../src/locales';
import { deDE } from '../../src/locales/de';
import { enUS } from '../../src/locales/en';
import { esES } from '../../src/locales/es';
import { frFR } from '../../src/locales/fr';
import { huHU } from '../../src/locales/hu';
import { ptPT } from '../../src/locales/pt';
import { roRO } from '../../src/locales/ro';

// The seven locale packs (Feature Dossier 04 §1, 06 §6, F-12): complete, with the English
// placeholders, plural forms for every category the locale uses, and a snapshot of what each pack
// renders through its formatters.
const PACKS: Record<string, SchedulerLocalization> = { enUS, esES, roRO, huHU, frFR, deDE, ptPT };

type Leaf = { path: string; value: string | PluralForms };

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, value }];
  const object = value as Record<string, unknown>;
  if ('other' in object) return [{ path, value: object as PluralForms }];
  return Object.entries(object).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
}

const placeholders = (text: string): string[] => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1] ?? '');

describe('locale packs', () => {
  it('exports each pack from its own entry and from the aggregate entry', () => {
    expect(Object.keys(packs).sort()).toEqual(Object.keys(PACKS).sort());
    for (const [name, pack] of Object.entries(PACKS)) {
      expect(packs[name as keyof typeof packs]).toBe(pack);
    }
  });

  it.each(Object.entries(PACKS))('%s: its locale tag matches its name', (name, pack) => {
    expect(pack.locale).toBe(`${name.slice(0, 2)}-${name.slice(2)}`);
    expect(Intl.PluralRules.supportedLocalesOf(pack.locale)).toEqual([pack.locale]);
  });

  it.each(Object.entries(PACKS))(
    '%s: has every English key, non-empty, with the English placeholders',
    (_name, pack) => {
      const english = new Map(leaves(enUS).map((leaf) => [leaf.path, leaf.value]));
      const own = leaves(pack);
      expect(own.map((leaf) => leaf.path).sort()).toEqual([...english.keys()].sort());
      for (const { path, value } of own) {
        const reference = english.get(path) as string | PluralForms;
        const expected = placeholders(typeof reference === 'string' ? reference : reference.other).sort();
        const forms = typeof value === 'string' ? { other: value } : value;
        for (const [form, text] of Object.entries(forms)) {
          expect(text.trim(), `${path}.${form}`).not.toBe('');
          // A singular form may spell the number out; every other form keeps the placeholders.
          const found = placeholders(text).sort();
          if (form === 'one') expect(expected, `${path}.${form}`).toEqual(expect.arrayContaining(found));
          else expect(found, `${path}.${form}`).toEqual(expected);
        }
      }
    },
  );

  it.each(Object.entries(PACKS))('%s: has a plural form for every category of counts 0 to 1000', (_name, pack) => {
    const rules = new Intl.PluralRules(pack.locale);
    const categories = rules.resolvedOptions().pluralCategories as readonly string[];
    const used = new Set(Array.from({ length: 1001 }, (_, count) => rules.select(count)));
    for (const { path, value } of leaves(pack)) {
      if (typeof value === 'string') continue;
      for (const form of Object.keys(value)) expect(categories, `${path}.${form}`).toContain(form);
      // Other categories (Spanish "many" for millions) fall back to "other", which reads correctly.
      for (const category of used) expect(Object.keys(value), `${path}: ${category}`).toContain(category);
    }
  });

  it.each(Object.entries(PACKS))('%s: renders its samples (snapshot)', (_name, pack) => {
    const format = createFormatters(pack.locale);
    const start = new Date(2031, 2, 12, 8, 0);
    const end = new Date(2031, 2, 12, 20, 0);
    const at = new Date(2031, 2, 12, 10, 30);
    const plural = (forms: PluralForms, extra: Record<string, string> = {}): string[] =>
      [0, 1, 2, 5, 21, 101, 1000].map((count) => interpolate(forms, { count, ...extra }, pack.locale));
    expect({
      clockTime: format.clockTime(at),
      hourLabel: format.hourLabel(start),
      shiftRange: format.shiftRange(start, end),
      timeRange: format.timeRange(at, end),
      sinceTimestamp: format.sinceTimestamp(at),
      dateTime: format.dateTime(at),
      earlier: plural(pack.shiftHeader.earlier),
      carriedOverCount: plural(pack.nav.carriedOverCount),
      more: plural(pack.more.ariaLabel, { time: format.clockTime(at) }),
      overflowTitle: plural(pack.overflow.title),
      announcement: plural(pack.pinnedStrip.announcement),
      now: interpolate(pack.now.label, { time: format.clockTime(at) }, pack.locale),
      page: interpolate(pack.pagination.page, { page: 12 }, pack.locale),
    }).toMatchSnapshot();
  });
});
