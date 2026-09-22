// SPDX-License-Identifier: MIT
// A typed view of `content/nav.json` for the build scripts, with the URL shape the site uses. The
// JSON's own inferred type mixes groups and items, so it is read through these interfaces once,
// here, instead of being narrowed in every script.
import navigation from '../../src/content/nav.json' with { type: 'json' };

export const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export interface NavItem {
  readonly id: string;
  readonly labelKey: string;
  readonly path: string;
  readonly page: string;
  readonly template?: string;
  readonly layout?: 'default' | 'wide';
  readonly badge?: string;
  readonly symbols?: readonly string[];
}

interface NavGroup {
  readonly type: 'group';
  readonly labelKey: string;
  readonly items: readonly NavItem[];
}

interface NavSection {
  readonly id: string;
  readonly labelKey: string;
  readonly items: readonly (NavItem | NavGroup)[];
}

export interface Navigation {
  readonly pluginId: string;
  readonly displayName: string;
  readonly packageName: string;
  readonly repoUrl: string;
  readonly siteUrl: string;
  readonly sections: readonly NavSection[];
}

export const nav: Navigation = navigation as unknown as Navigation;

function isGroup(entry: NavItem | NavGroup): entry is NavGroup {
  return 'type' in entry && entry.type === 'group';
}

/** Every page, in sidebar order, with the section it belongs to. */
export function pages(): readonly (NavItem & { readonly sectionId: string })[] {
  return nav.sections.flatMap((section) =>
    section.items.flatMap((entry) =>
      isGroup(entry)
        ? entry.items.map((item) => ({ ...item, sectionId: section.id }))
        : [{ ...entry, sectionId: section.id }],
    ),
  );
}

/** `/pinning/` in `ro` → `/react-scheduler/ro/pinning/`. */
export function urlOf(locale: Locale, path: string): string {
  const inner = path.split('/').filter((segment) => segment !== '');
  return `/${[nav.pluginId, ...(locale === DEFAULT_LOCALE ? [] : [locale]), ...inner].join('/')}/`;
}
