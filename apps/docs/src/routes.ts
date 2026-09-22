// SPDX-License-Identifier: MIT
// Every route of the site, generated from `content/nav.json` × the seven locales, plus the 404
// (docs pack 01 §6). Paths carry the plugin prefix themselves; there is no router basename and Vite
// `base` stays `/` (10 §2). One module serves every page and resolves which one from the URL, so
// adding a page means adding it to nav.json and nothing else.
import { type RouteConfig, route } from '@react-router/dev/routes';
import navigation from './content/nav.json';
import { buildPath, LOCALES } from './i18n/paths';

const pluginId = navigation.pluginId;

function paths(): string[] {
  const inner: string[] = [];
  for (const section of navigation.sections) {
    for (const entry of section.items) {
      if ('type' in entry && entry.type === 'group') for (const item of entry.items) inner.push(item.path);
      else if ('path' in entry) inner.push(entry.path);
    }
  }
  return inner;
}

/** Locale-prefixed URL paths for every page, and the 404 of each locale. */
export function routePaths(): string[] {
  const all: string[] = [];
  for (const locale of LOCALES) {
    for (const path of paths()) all.push(buildPath(locale, path, pluginId));
    all.push(buildPath(locale, '/404/', pluginId));
  }
  return all;
}

export default routePaths().map((path) =>
  route(path.slice(1), './routes/page.tsx', { id: `page${path.replaceAll('/', '.')}` }),
) satisfies RouteConfig;
