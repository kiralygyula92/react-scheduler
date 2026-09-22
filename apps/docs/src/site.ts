// SPDX-License-Identifier: MIT
// Per-plugin identity. `src/shell/` and `src/i18n/` are identical in every plugin repository
// (docs pack 01 §5), so everything specific to this one is read from here. Values come from the
// project dictionary in AGENTS.md; none of them is user-visible prose (the display name is a proper
// noun, every translated string lives in `src/locales/`).

export interface SiteConfig {
  /** URL segment every route carries, without slashes (docs pack 10 §2). */
  readonly pluginId: string;
  /** Wordmark in the navbar and the `{title} · {name}` suffix. */
  readonly displayName: string;
  readonly packageName: string;
  readonly repoUrl: string;
  /** Origin without a trailing slash, for canonical URLs, `og:*` and the sitemap. */
  readonly origin: string;
  /** Path prefix with both slashes: `/react-scheduler/`. */
  readonly basePath: string;
}

const pluginId = 'react-scheduler';

export const site: SiteConfig = {
  pluginId,
  displayName: 'React Scheduler',
  packageName: '@react-schedulerkit/react-scheduler',
  repoUrl: 'https://github.com/kiralygyula92/react-scheduler',
  origin: import.meta.env.VITE_SITE_URL,
  basePath: `/${pluginId}/`,
};
