import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
} from 'react-router';
import { parsePath } from '~/i18n/paths';
import { themeBootstrap } from '~/shell/theme-bootstrap';
import '~/shell/tokens.css';
import '~/shell/shell.css';
import '~/shell/shell-overrides.css';
import '~/playground/playground.css';
import { site } from '~/shell/nav';

// The document shell (docs pack 01 §5, 10 §3.3). The theme script runs before any stylesheet, so the
// first paint already has the right theme; analytics use the /react entry points.
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
        <Analytics />
        <SpeedInsights />
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

export function ErrorBoundary(): React.ReactElement {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return <main id="main">{String(status)}</main>;
}
