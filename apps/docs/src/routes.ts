// SPDX-License-Identifier: MIT
// Every route of the site, generated from `content/nav.json` × the seven locales, plus the 404 of
// each locale (docs pack 01 §6). Paths carry the plugin prefix themselves; there is no router
// basename and Vite `base` stays `/` (10 §2).
//
// The page components are the route modules, under one layout route that loads the locale bundles
// and draws the shell. That gives each page its own chunk and puts its whole content in the
// prerendered HTML. Adding a page means adding it to nav.json and nothing else.
import { type RouteConfig, index, route } from '@react-router/dev/routes';
import navigation from './content/nav.json';
import { LOCALES } from './i18n/paths';

const pluginId = navigation.pluginId;

interface Page {
  readonly path: string;
  readonly page: string;
}

/** `nav.json` mixes groups and pages in one array, so it is read through these shapes. */
interface Entry {
  readonly type?: string;
  readonly path?: string;
  readonly page?: string;
  readonly items?: readonly Entry[];
}

function pages(): Page[] {
  const flat: Page[] = [];
  for (const section of navigation.sections as readonly { items: readonly Entry[] }[]) {
    for (const entry of section.items) {
      for (const item of entry.type === 'group' ? (entry.items ?? []) : [entry]) {
        if (item.path !== undefined && item.page !== undefined) flat.push({ path: item.path, page: item.page });
      }
    }
  }
  return flat;
}

/** `/pinning/` in `ro` → `ro/pinning`, relative to the `react-scheduler` layout route. */
function relative(locale: string, path: string): string {
  const inner = path.split('/').filter((segment) => segment !== '');
  return [...(locale === 'en' ? [] : [locale]), ...inner].join('/');
}

/** Every URL the site prerenders, in the shape `react-router.config.ts` wants. */
export function routePaths(): string[] {
  const all: string[] = [];
  for (const locale of LOCALES) {
    for (const page of pages()) all.push(`/${[pluginId, relative(locale, page.path)].join('/').replace(/\/$/, '')}/`);
    all.push(`/${[pluginId, relative(locale, '/404/')].join('/')}/`);
  }
  return all;
}

const children = LOCALES.flatMap((locale) => [
  ...pages().map((page) => {
    const path = relative(locale, page.path);
    const file = `./content/pages/${page.page}.tsx`;
    const id = `page.${locale}.${page.page}`;
    return path === '' ? index(file, { id }) : route(path, file, { id });
  }),
  route(relative(locale, '/404/'), './routes/not-found.tsx', { id: `not-found.${locale}` }),
]);

export default [route(pluginId, './routes/layout.tsx', children)] satisfies RouteConfig;
