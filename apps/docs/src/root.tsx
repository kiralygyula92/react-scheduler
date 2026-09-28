import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from 'react-router';
import { parsePath } from '~/i18n/paths';
// Only the `crash` block of each locale: named JSON imports keep the rest of `common` out of the
// root chunk every page loads.
import { crash as de } from '~/locales/de/common.json';
import { crash as en } from '~/locales/en/common.json';
import { crash as es } from '~/locales/es/common.json';
import { crash as fr } from '~/locales/fr/common.json';
import { crash as hu } from '~/locales/hu/common.json';
import { crash as pt } from '~/locales/pt/common.json';
import { crash as ro } from '~/locales/ro/common.json';
import { themeBootstrap } from '~/shell/theme-bootstrap';
import '~/shell/tokens.css';
import '~/shell/shell.css';
import '~/shell/shell-overrides.css';
import '~/playground/playground.css';
import { site } from '~/shell/nav';

// The document shell (docs pack 01 §5, 10 §3.3). The theme script runs before any stylesheet, so the
// first paint already has the right theme; analytics use the /react entry points and load only in a
// production build on Vercel (`vite.config.ts`).
export function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  const { locale } = parsePath(useLocation().pathname, site.pluginId);
  return (
    // `data-theme` is the bootstrap script’s alone: rendering it here would let any re-render of
    // this component put the light theme back over the reader’s choice.
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* The shell's only web font, self-hosted and preloaded (07 §1); tokens.css declares the
            face at this exact path. `crossOrigin` is required even same-origin, or the preload is
            discarded and fetched twice. */}
        <link rel="preload" href="/fonts/InterVariable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {import.meta.env.VITE_ANALYTICS ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}

/**
 * The document-wide half of the metadata contract (01 §9): what every page shares. Each route adds
 * its own `title`, `description`, canonical URL and `hreflang` alternates from its locale file.
 */
export function meta(): Array<Record<string, string>> {
  return [
    { property: 'og:site_name', content: site.displayName },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: `${site.origin}${site.basePath}og.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: `${site.origin}${site.basePath}og.png` },
  ];
}

export default function Root(): React.ReactElement {
  return <Outlet />;
}

const CRASH: Readonly<Record<string, typeof en>> = { en, ro, hu, es, fr, de, pt };

/**
 * What a reader sees if a page throws while rendering: the shell is gone with it, so the page says
 * what happened in the reader's language and links back to the overview with a full load, which does
 * not depend on the router that just failed. Unknown paths never get here; they have their 404 page.
 */
export function ErrorBoundary(): React.ReactElement {
  const { locale } = parsePath(useLocation().pathname, site.pluginId);
  const strings = CRASH[locale] ?? en;
  const home = locale === 'en' ? site.basePath : `${site.basePath}${locale}/`;
  return (
    <main
      id="main"
      className="ds-content"
      style={{ maxWidth: '40rem', margin: '0 auto', padding: 'var(--ds-space-8) var(--ds-space-4)' }}
    >
      <h1>{strings.title}</h1>
      <p className="ds-lead">{strings.text}</p>
      <p>
        <a href={home}>{strings.back}</a>
      </p>
    </main>
  );
}
