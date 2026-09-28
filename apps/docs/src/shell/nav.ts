// SPDX-License-Identifier: MIT
// One source for the sidebar, breadcrumbs, prev/next, routes, sitemap, search index and llms.txt
// (docs pack 01 §4): `content/nav.json`, validated against `nav.schema.json` by the conformance
// check. Everything here is derived from that file, so nothing can drift apart from it.
import { useLocation } from 'react-router';
import { buildPath, type Locale, parsePath } from '~/i18n/paths';
import navigation from '~/content/nav.json';

export type Template =
  'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11' | 'T12' | 'T13' | 'T14' | 'T15' | 'T16';
export type Badge = 'new' | 'preview' | 'beta' | 'deprecated';
export type Layout = 'default' | 'wide';

export interface NavItem {
  readonly id: string;
  readonly labelKey: string;
  /** Path inside the locale, with both slashes: `/timeline-view/`. */
  readonly path: string;
  /** `content/pages/{page}.tsx` and `locales/{lng}/pages/{page}.json`. */
  readonly page: string;
  readonly template?: Template;
  readonly layout?: Layout;
  readonly badge?: Badge;
  readonly symbols?: readonly string[];
}

export interface NavGroup {
  readonly type: 'group';
  readonly labelKey: string;
  readonly items: readonly NavItem[];
}

export interface NavSection {
  readonly id: string;
  readonly labelKey: string;
  readonly items: readonly (NavItem | NavGroup)[];
}

/** A page with the place it occupies, which breadcrumbs and prev/next need. */
export interface FlatItem extends NavItem {
  readonly sectionId: string;
  readonly sectionLabelKey: string;
  readonly groupLabelKey?: string;
}

export const sections: readonly NavSection[] = navigation.sections as readonly NavSection[];

export const site = {
  pluginId: navigation.pluginId,
  displayName: navigation.displayName,
  packageName: navigation.packageName,
  repoUrl: navigation.repoUrl,
  /** The deployment's own origin when the build knows it, else the one in `nav.json`. */
  origin: (import.meta.env.VITE_SITE_URL as string | undefined) ?? navigation.siteUrl,
  /** The documented package's version; the navbar shows it as `v{major}.{minor}` (O14). */
  version: (import.meta.env.VITE_PACKAGE_VERSION as string | undefined) ?? '0.0.0',
  basePath: `/${navigation.pluginId}/`,
  playground: navigation.playground,
} as const;

export function isGroup(entry: NavItem | NavGroup): entry is NavGroup {
  return 'type' in entry && entry.type === 'group';
}

/** Every page, in sidebar order: the order prev/next, the sitemap and `llms.txt` follow. */
export const flatItems: readonly FlatItem[] = sections.flatMap((section) =>
  section.items.flatMap((entry) =>
    isGroup(entry)
      ? entry.items.map((item) => ({
          ...item,
          sectionId: section.id,
          sectionLabelKey: section.labelKey,
          groupLabelKey: entry.labelKey,
        }))
      : [{ ...entry, sectionId: section.id, sectionLabelKey: section.labelKey }],
  ),
);

export function itemByPath(rest: string): FlatItem | undefined {
  return flatItems.find((item) => item.path === rest);
}

/** The section label, then the group label when there is one, then the page itself. */
/**
 * The crumbs after the plugin name (docs pack 02 §6.5): the section, and the group on a capability
 * page. The page itself is the `h1` right below, so it is not repeated as a crumb. The section links
 * to its first page; a group is not a page and has no link.
 */
export function breadcrumbsFor(rest: string): readonly { labelKey: string; path?: string }[] {
  const item = itemByPath(rest);
  if (item === undefined) return [];
  const first = flatItems.find((candidate) => candidate.sectionId === item.sectionId);
  const crumbs: { labelKey: string; path?: string }[] = [
    { labelKey: item.sectionLabelKey, ...(first && { path: first.path }) },
  ];
  if (item.groupLabelKey !== undefined) crumbs.push({ labelKey: item.groupLabelKey });
  return crumbs;
}

export function siblings(rest: string): { previous?: FlatItem; next?: FlatItem } {
  const index = flatItems.findIndex((item) => item.path === rest);
  if (index === -1) return {};
  const previous = index > 0 ? flatItems[index - 1] : undefined;
  const next = index < flatItems.length - 1 ? flatItems[index + 1] : undefined;
  return { ...(previous && { previous }), ...(next && { next }) };
}

export interface NavState {
  readonly locale: Locale;
  /** Path inside the locale, without the plugin prefix. */
  readonly rest: string;
  readonly sections: readonly NavSection[];
  readonly current?: FlatItem;
  readonly activeSectionId?: string;
  readonly isActive: (item: NavItem) => boolean;
  /** Turns a locale-relative path into a full URL path for the current locale. */
  readonly localePath: (rest: string) => string;
}

export function useNav(): NavState {
  const { pathname } = useLocation();
  const { locale, rest } = parsePath(pathname, site.pluginId);
  const current = itemByPath(rest);
  return {
    locale,
    rest,
    sections,
    ...(current && { current, activeSectionId: current.sectionId }),
    isActive: (item: NavItem) => item.path === rest,
    localePath: (target: string) => buildPath(locale, target, site.pluginId),
  };
}
