// SPDX-License-Identifier: MIT
// Locale list and URL shape (docs pack 11 §8). Every path carries the plugin prefix and a trailing
// slash, because the host is configured with `trailingSlash: true` (10 §2); the default locale has
// no segment of its own.

export const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** `/{pluginId}/ro/zoom/` → `{ locale: 'ro', rest: '/zoom/' }`; an unprefixed path stays `en`. */
export function parsePath(pathname: string, pluginId: string): { locale: Locale; rest: string } {
  const segments = pathname.split('/').filter((segment) => segment !== '');
  if (segments[0] === pluginId) segments.shift();
  const first = segments[0];
  const prefixed = first !== undefined && isLocale(first);
  if (prefixed) segments.shift();
  return {
    locale: prefixed ? first : DEFAULT_LOCALE,
    rest: segments.length === 0 ? '/' : `/${segments.join('/')}/`,
  };
}

/** `('ro', '/zoom/')` → `/{pluginId}/ro/zoom/`; `('en', '/zoom/')` → `/{pluginId}/zoom/`. */
export function buildPath(locale: Locale, rest: string, pluginId: string): string {
  const inner = rest.split('/').filter((segment) => segment !== '');
  const segments = [pluginId, ...(locale === DEFAULT_LOCALE ? [] : [locale]), ...inner];
  return `/${segments.join('/')}/`;
}
