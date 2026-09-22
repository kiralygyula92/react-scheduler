// SPDX-License-Identifier: MIT
// Every page of the site runs through this module (see `routes.ts`): the loader resolves which page
// the URL asks for and loads its locale bundles, the component wraps it in the shell, and `meta`
// fills the document head from the same two keys the page shows (docs pack 01 §9).
import { lazy, Suspense } from 'react';
import { useLoaderData } from 'react-router';
import { I18nProvider } from '~/i18n/I18nProvider';
import { type Bundle, hasBundle, loadBundles, lookup } from '~/i18n/locales';
import { buildPath, DEFAULT_LOCALE, type Locale, LOCALES, parsePath } from '~/i18n/paths';
import { AppShell } from '~/shell/AppShell';
import { itemByPath, site } from '~/shell/nav';
import { NotFound } from './not-found';

/** Locale files hold strings; anything else at that key is a mistake the i18n check reports. */
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

interface PageData {
  readonly locale: Locale;
  readonly rest: string;
  readonly bundles: Record<string, Bundle>;
  readonly page: string | null;
  readonly layout: 'default' | 'wide';
}

const modules = import.meta.glob('/src/content/pages/**/*.tsx') as Readonly<
  Record<string, () => Promise<{ default: React.ComponentType }>>
>;

/** One lazy component per page, built once: the chunk itself is fetched only when it renders. */
const components: Readonly<Record<string, React.ComponentType>> = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [
    path.replace('/src/content/pages/', '').replace('.tsx', ''),
    lazy(load),
  ]),
);

/**
 * Single fetch asks for a route's data at `…/_.data`; the page behind it is the same one
 * (https://reactrouter.com). Without stripping that suffix the loader would look up a path that no
 * nav item has and serve the 404 body as the page's own data.
 */
function pageUrl(url: string): string {
  return new URL(url).pathname.replace(/_?\.data$/, '');
}

export async function loader({ request }: { request: Request }): Promise<PageData> {
  const { locale, rest } = parsePath(pageUrl(request.url), site.pluginId);
  const item = itemByPath(rest);
  const namespaces = ['common', 'nav', ...(item === undefined ? [] : [`pages/${item.page}`])];
  if (hasBundle(locale, 'api')) namespaces.push('api');
  return {
    locale,
    rest,
    bundles: await loadBundles(locale, namespaces),
    page: item?.page ?? null,
    layout: item?.layout ?? 'default',
  };
}

/**
 * The per-page half of the metadata contract (01 §9), rendered as elements so React hoists them
 * into <head>. A route-level `meta` export is not used: React Router calls it without the loader
 * data during this prerender, and a head built from no data would be wrong on every page.
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

  return (
    <>
      <title>{documentTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={locale} />
      <link rel="canonical" href={canonical} />
      {/* React writes a hoisted link’s props as given, so these read `hrefLang` in the output.
          HTML attribute names are case-insensitive, so crawlers and validators read it as
          `hreflang`; the conformance check compares them the same way. */}
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

export function HydrateFallback(): React.ReactElement {
  return <main id="main" />;
}

export default function RoutePage(): React.ReactElement {
  const data: PageData = useLoaderData();
  const Content = data.page === null ? NotFound : (components[data.page] ?? NotFound);
  return (
    <I18nProvider value={{ locale: data.locale, bundles: data.bundles }}>
      <PageHead data={data} />
      <AppShell layout={data.layout}>
        <Suspense fallback={null}>
          <Content />
        </Suspense>
      </AppShell>
    </I18nProvider>
  );
}
