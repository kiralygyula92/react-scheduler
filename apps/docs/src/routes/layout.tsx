// SPDX-License-Identifier: MIT
// The layout route every page sits in (see `routes.ts`): it resolves which page the URL asks for,
// loads that locale's bundles at build time, fills the document head from the same two keys the
// page shows (docs pack 01 §9), and renders the shell around the page module.
//
// The page components are the route modules themselves, so React Router has each one in hand before
// it renders: the prerendered HTML contains the whole page, with no suspended placeholder.
import { Outlet, useLoaderData } from 'react-router';
import { I18nProvider } from '~/i18n/I18nProvider';
import { type Bundle, hasBundle, loadBundles, lookup } from '~/i18n/locales';
import { buildPath, DEFAULT_LOCALE, type Locale, LOCALES, parsePath } from '~/i18n/paths';
import { AppShell } from '~/shell/AppShell';
import { itemByPath, site } from '~/shell/nav';
import NotFound from './not-found';

export interface PageData {
  readonly locale: Locale;
  readonly rest: string;
  readonly bundles: Record<string, Bundle>;
  readonly page: string | null;
  readonly layout: 'default' | 'wide';
}

/** Locale files hold strings; anything else at that key is a mistake the i18n check reports. */
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Single fetch asks for a route's data at `…/_.data`; the page behind it is the same one. Without
 * stripping that suffix the loader would look up a path no nav item has and serve the 404 body as
 * the page's own data.
 */
function pageUrl(url: string): string {
  return new URL(url).pathname.replace(/_?\.data$/, '');
}

export async function loader({ request }: { request: Request }): Promise<PageData> {
  const { locale, rest } = parsePath(pageUrl(request.url), site.pluginId);
  const item = itemByPath(rest);
  // `demos` carries the sample data every demo shows; `api` the generated reference strings. Both
  // are read by components a page may hold, not by the page's own namespace, so they are loaded from
  // what the page is rather than from what it asks for. `api` is large, and only the pages that show
  // a generated table need it.
  const namespaces = ['common', 'nav', 'demos', ...(item === undefined ? [] : [`pages/${item.page}`])];
  const showsApi =
    item !== undefined &&
    (item.page.startsWith('reference/') ||
      item.page.startsWith('customization/') ||
      // The Playground and the theme editor describe every prop and every token they offer.
      item.page === 'demos/playground' ||
      item.page === 'demos/theme-editor' ||
      item.symbols !== undefined);
  if (showsApi && hasBundle(locale, 'api')) namespaces.push('api');
  // An index page lists its children with each child's own description; `summaries` holds those and
  // is loaded only where one is shown (docs pack 03 §3.5).
  if (item?.page === 'features/all-features' || item?.page.endsWith('/index') === true) namespaces.push('summaries');
  return {
    locale,
    rest,
    bundles: await loadBundles(locale, namespaces),
    page: item?.page ?? null,
    layout: item?.layout ?? 'default',
  };
}

/**
 * Every navigation lands on a different page of this layout, and each page has its own locale
 * namespace. React Router keeps a parent's data when only a child route changes, which would leave
 * the new page reading the previous page's bundle, so this route reloads on every navigation. The
 * data it fetches is a prerendered file.
 */
export function shouldRevalidate(): boolean {
  return true;
}

/** Open Graph writes a locale as language and territory; each site language has one variant. */
const OG_LOCALE: Readonly<Record<string, string>> = {
  en: 'en_US',
  ro: 'ro_RO',
  hu: 'hu_HU',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
  pt: 'pt_PT',
};

/**
 * The per-page half of the metadata contract, rendered as elements so React hoists them into
 * <head>. A route-level `meta` export is not used: React Router calls it without the loader data
 * during this prerender, and a head built from no data would be wrong on every page.
 */
function PageHead({ data }: { data: PageData }): React.ReactElement {
  const { locale, rest, bundles, page } = data;
  const common = bundles['common'];
  const namespace = page === null ? undefined : bundles[`pages/${page}`];
  const title = text(lookup(namespace, 'meta.title')) || text(lookup(common, 'notFound.title'));
  const description = text(lookup(namespace, 'meta.description')) || text(lookup(common, 'notFound.text'));
  const template = text(lookup(common, 'meta.titleTemplate')) || '{title}';
  const documentTitle = template.replace('{title}', title).replace('{pluginName}', site.displayName);
  const canonical = `${site.origin}${buildPath(locale, rest, site.pluginId)}`;
  const imageAlt = text(lookup(common, 'meta.ogImageAlt'));

  return (
    <>
      <title>{documentTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={OG_LOCALE[locale] ?? locale} />
      {LOCALES.filter((code) => code !== locale).map((code) => (
        <meta key={code} property="og:locale:alternate" content={OG_LOCALE[code] ?? code} />
      ))}
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:image:alt" content={imageAlt} />
      <link rel="canonical" href={canonical} />
      {/* React writes a hoisted link's props as given, so these read `hrefLang` in the output. HTML
          attribute names are case-insensitive, so crawlers read it as `hreflang`; the conformance
          check compares them the same way. */}
      {LOCALES.map((code) => (
        <link
          key={code}
          rel="alternate"
          hrefLang={code}
          href={`${site.origin}${buildPath(code, rest, site.pluginId)}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${site.origin}${buildPath(DEFAULT_LOCALE, rest, site.pluginId)}`}
      />
    </>
  );
}

export default function DocsLayout(): React.ReactElement {
  const data: PageData = useLoaderData();
  return (
    <I18nProvider value={{ locale: data.locale, bundles: data.bundles }}>
      <PageHead data={data} />
      <AppShell layout={data.layout}>
        {/* A page route is declared once under `:locale`, which also matches a segment that is not a
            locale (`/react-scheduler/xx/pinning/`). The host answers such a URL with the 404 page, and
            this layout's data says so; rendering the matched page instead would disagree with that
            HTML and hydrate a page without its strings. */}
        {data.page === null ? <NotFound /> : <Outlet />}
      </AppShell>
    </I18nProvider>
  );
}
