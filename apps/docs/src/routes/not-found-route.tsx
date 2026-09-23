// SPDX-License-Identifier: MIT
// The catch-all for paths no page owns. The host answers such a request with the prerendered 404
// page of the locale and status 404 (docs pack 10 §2); this route is what keeps the page whole once
// that HTML hydrates under a URL the route table does not contain. It sits outside the prerendered
// layout, and loads on the client only, because `ssr: false` allows a build-time loader only on
// routes that are prerendered.
import { useLoaderData } from 'react-router';
import { I18nProvider } from '~/i18n/I18nProvider';
import { type Bundle, loadBundles } from '~/i18n/locales';
import { type Locale, parsePath } from '~/i18n/paths';
import { AppShell } from '~/shell/AppShell';
import { site } from '~/shell/nav';
import NotFound from './not-found';

interface Data {
  readonly locale: Locale;
  readonly bundles: Record<string, Bundle>;
}

export async function clientLoader({ request }: { request: Request }): Promise<Data> {
  const { locale } = parsePath(new URL(request.url).pathname, site.pluginId);
  return { locale, bundles: await loadBundles(locale, ['common', 'nav']) };
}

export function HydrateFallback(): React.ReactElement {
  return <main id="main" />;
}

export default function NotFoundRoute(): React.ReactElement {
  const { locale, bundles }: Data = useLoaderData();
  return (
    <I18nProvider value={{ locale, bundles }}>
      <AppShell>
        <NotFound />
      </AppShell>
    </I18nProvider>
  );
}
