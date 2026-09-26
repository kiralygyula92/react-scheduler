// SPDX-License-Identifier: MIT
// The site's canonical origin (docs pack 10 §3.1), one rule for the pages (`vite.config.ts`) and for
// the sitemap, the llms files and the Markdown twins (`build-machine-surface.ts`).
//
// On Vercel, `VERCEL_URL` is the address of one deployment — `project-abc123.vercel.app` — in
// production too. Canonical links and a sitemap built from it would point every production page at
// an address that changes with each deploy. A production build uses the project's production domain
// instead, which Vercel provides as `VERCEL_PROJECT_PRODUCTION_URL`; a preview keeps its own address.
import navigation from '../../src/content/nav.json' with { type: 'json' };

type Env = Readonly<Record<string, string | undefined>>;

/** The origin the build writes into canonical links, `og:url`, the sitemap and the llms files. */
export function siteOrigin(env: Env = process.env): string {
  const explicit = env['VITE_SITE_URL'];
  if (explicit !== undefined && explicit !== '') return explicit.replace(/\/+$/, '');
  const production = env['VERCEL_PROJECT_PRODUCTION_URL'];
  if (env['VERCEL_ENV'] === 'production' && production !== undefined && production !== '') {
    return `https://${production}`;
  }
  const deployment = env['VERCEL_URL'];
  if (deployment !== undefined && deployment !== '') return `https://${deployment}`;
  // The site URL of the dictionary, for a build that is not on Vercel and was told nothing.
  return navigation.siteUrl;
}
