// SPDX-License-Identifier: MIT
// URL shape (docs pack 01 §1 R1–R3, 11 §8): the plugin prefix, the locale segment for the six
// non-default locales, English without one, and a trailing slash on everything.
import { describe, expect, it } from 'vitest';
import { buildPath, DEFAULT_LOCALE, isLocale, LOCALES, parsePath } from '~/i18n/paths';

const PLUGIN = 'react-scheduler';

describe('parsePath', () => {
  it('reads the locale segment', () => {
    expect(parsePath('/react-scheduler/ro/timeline-view/', PLUGIN)).toEqual({ locale: 'ro', rest: '/timeline-view/' });
  });

  it('treats a path without a locale segment as English', () => {
    expect(parsePath('/react-scheduler/timeline-view/', PLUGIN)).toEqual({ locale: 'en', rest: '/timeline-view/' });
  });

  it('reads the overview of each locale', () => {
    expect(parsePath('/react-scheduler/', PLUGIN)).toEqual({ locale: 'en', rest: '/' });
    expect(parsePath('/react-scheduler/hu/', PLUGIN)).toEqual({ locale: 'hu', rest: '/' });
  });

  it('keeps nested paths whole', () => {
    expect(parsePath('/react-scheduler/de/getting-started/installation/', PLUGIN)).toEqual({
      locale: 'de',
      rest: '/getting-started/installation/',
    });
  });

  it('does not mistake a page slug for a locale', () => {
    expect(parsePath('/react-scheduler/pinning/', PLUGIN)).toEqual({ locale: 'en', rest: '/pinning/' });
  });
});

describe('buildPath', () => {
  it('omits the segment for the default locale', () => {
    expect(buildPath('en', '/pinning/', PLUGIN)).toBe('/react-scheduler/pinning/');
    expect(buildPath(DEFAULT_LOCALE, '/', PLUGIN)).toBe('/react-scheduler/');
  });

  it('adds the segment for the others', () => {
    expect(buildPath('ro', '/pinning/', PLUGIN)).toBe('/react-scheduler/ro/pinning/');
    expect(buildPath('pt', '/', PLUGIN)).toBe('/react-scheduler/pt/');
  });

  it('round-trips every locale, which is what the language menu relies on', () => {
    for (const locale of LOCALES) {
      for (const rest of ['/', '/pinning/', '/getting-started/installation/']) {
        expect(parsePath(buildPath(locale, rest, PLUGIN), PLUGIN)).toEqual({ locale, rest });
      }
    }
  });
});

describe('isLocale', () => {
  it('accepts the seven locales and nothing else', () => {
    expect(LOCALES.every((locale) => isLocale(locale))).toBe(true);
    expect(isLocale('en-US')).toBe(false);
    expect(isLocale('pinning')).toBe(false);
  });
});
