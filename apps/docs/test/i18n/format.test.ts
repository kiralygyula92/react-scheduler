// SPDX-License-Identifier: MIT
// The message format (docs pack 11 §9): plurals in all seven locales, variables, and what happens
// to a message that names a variable nobody passed.
import { describe, expect, it } from 'vitest';
import { format } from '~/i18n/format';
import { LOCALES } from '~/i18n/paths';

const PAGES = '{count, plural, one {# page} few {# pages} other {# pages}}';

describe('variables', () => {
  it('substitutes by name', () => {
    expect(format('Search {name}', { name: 'React Scheduler' }, 'en')).toBe('Search React Scheduler');
  });

  it('formats numbers for the message locale', () => {
    expect(format('{count} results', { count: 12345 }, 'en')).toBe('12,345 results');
    expect(format('{count} results', { count: 12345 }, 'de')).toBe('12.345 results');
    expect(format('{count} results', { count: 12345 }, 'fr')).toBe('12 345 results');
  });

  it('leaves a message without placeholders alone', () => {
    expect(format('On this page', {}, 'en')).toBe('On this page');
  });

  it('throws on a variable the caller did not pass', () => {
    // Development behaviour; the production build leaves "{name}" in place instead.
    expect(() => format('Search {name}', {}, 'en')).toThrow(/Unknown variable "name"/);
  });
});

describe('plurals', () => {
  it('selects the category and replaces #', () => {
    expect(format(PAGES, { count: 1 }, 'en')).toBe('1 page');
    expect(format(PAGES, { count: 7 }, 'en')).toBe('7 pages');
  });

  it('uses the locale’s own categories', () => {
    // Romanian has a "few" category for 2..19 and for hundreds ending in 01..19.
    expect(format(PAGES, { count: 3 }, 'ro')).toBe('3 pages');
    expect(format(PAGES, { count: 21 }, 'ro')).toBe('21 pages');
    // French counts 0 and 1 as singular.
    expect(format(PAGES, { count: 0 }, 'fr')).toBe('0 page');
    expect(format(PAGES, { count: 1 }, 'fr')).toBe('1 page');
  });

  it('resolves in every locale the site ships', () => {
    for (const locale of LOCALES) {
      for (const count of [0, 1, 2, 5, 11, 21, 101]) {
        // French groups thousands with a narrow no-break space (U+202F).
        expect(format(PAGES, { count }, locale)).toMatch(/^[\d.,\s]+ pages?$/u);
      }
    }
  });

  it('falls back to "other" when the locale needs a category the message lacks', () => {
    expect(format('{count, plural, other {# items}}', { count: 1 }, 'en')).toBe('1 items');
  });

  it('formats a variable inside a branch', () => {
    const message = '{count, plural, one {{name} has # shift} other {{name} has # shifts}}';
    expect(format(message, { count: 2, name: 'Ana' }, 'en')).toBe('Ana has 2 shifts');
  });

  it('throws when the plural variable is missing or not a number', () => {
    expect(() => format(PAGES, {}, 'en')).toThrow(/Plural variable "count"/);
    expect(() => format(PAGES, { count: 'two' }, 'en')).toThrow(/Plural variable "count"/);
  });

  it('throws when neither the category nor "other" is present', () => {
    expect(() => format('{count, plural, one {# page}}', { count: 4 }, 'en')).toThrow(/no "other" branch/);
  });
});

describe('malformed messages', () => {
  it('reports an unbalanced brace instead of rendering it', () => {
    expect(() => format('Search {name', { name: 'x' }, 'en')).toThrow(/Unbalanced/);
  });
});
