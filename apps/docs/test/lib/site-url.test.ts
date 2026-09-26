// SPDX-License-Identifier: MIT
// The canonical origin the build writes into every page and into the sitemap. On Vercel, a production
// build must not use `VERCEL_URL`: that is the address of one deployment, not of the site.
import { describe, expect, it } from 'vitest';
import { siteOrigin } from '../../scripts/lib/site-url.ts';

describe('siteOrigin', () => {
  it('prefers VITE_SITE_URL, without a trailing slash', () => {
    expect(siteOrigin({ VITE_SITE_URL: 'https://docs.example.com/', VERCEL_URL: 'x.vercel.app' })).toBe(
      'https://docs.example.com',
    );
  });

  it("uses the project's production domain for a production build on Vercel", () => {
    expect(
      siteOrigin({
        VERCEL_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: 'react-schedulerkit.vercel.app',
        VERCEL_URL: 'react-schedulerkit-abc123.vercel.app',
      }),
    ).toBe('https://react-schedulerkit.vercel.app');
  });

  it('keeps the deployment address for a preview', () => {
    expect(
      siteOrigin({
        VERCEL_ENV: 'preview',
        VERCEL_PROJECT_PRODUCTION_URL: 'react-schedulerkit.vercel.app',
        VERCEL_URL: 'react-schedulerkit-git-branch.vercel.app',
      }),
    ).toBe('https://react-schedulerkit-git-branch.vercel.app');
  });

  it('falls back to the site URL in nav.json off Vercel', () => {
    expect(siteOrigin({})).toBe('https://react-schedulerkit.vercel.app');
    expect(siteOrigin({ VITE_SITE_URL: '' })).toBe('https://react-schedulerkit.vercel.app');
  });
});
