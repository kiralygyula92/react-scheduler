// SPDX-License-Identifier: MIT
// Every page of the site answers, in every locale, with the structure the docs pack fixes
// (07 §6 gate for M4): one h1, the landmarks of 07 §2, a title and a description.
import { expect, test } from '@playwright/test';
import navigation from '../src/content/nav.json' with { type: 'json' };
import { open } from './hydrated.ts';

const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
const pluginId = navigation.pluginId;

interface Item {
  readonly id: string;
  readonly path: string;
  readonly type?: string;
  readonly items?: readonly Item[];
}

const pages: Item[] = navigation.sections.flatMap((section) =>
  (section.items as unknown as Item[]).flatMap((entry) => (entry.type === 'group' ? (entry.items ?? []) : [entry])),
);

function url(locale: string, path: string): string {
  const inner = path.split('/').filter((segment) => segment !== '');
  return `/${[pluginId, ...(locale === 'en' ? [] : [locale]), ...inner].join('/')}/`;
}

/** Ten pages spread over the sections, for the locales other than English. */
const SAMPLE = [
  '/',
  '/getting-started/installation/',
  '/getting-started/faq/',
  '/all-features/',
  '/timeline-view/',
  '/pinning/',
  '/demos/',
  '/api/',
  '/customization/theming/',
  '/discover-more/license/',
];

test.describe('every page in English', () => {
  for (const page of pages) {
    test(`${page.path} answers with one h1 @smoke`, async ({ page: browser }) => {
      const response = await browser.goto(url('en', page.path));
      expect(response?.status()).toBe(200);
      await expect(browser.locator('h1')).toHaveCount(1);
      await expect(browser.locator('main#main')).toBeVisible();
    });
  }
});

test.describe('the other six locales', () => {
  for (const locale of LOCALES.filter((code) => code !== 'en')) {
    for (const path of SAMPLE) {
      test(`${locale} ${path}`, async ({ page }) => {
        const response = await page.goto(url(locale, path));
        expect(response?.status()).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
      });
    }
  }
});

test.describe('the page frame', () => {
  test('has the landmarks, the skip link and the metadata @smoke', async ({ page }) => {
    await page.goto(url('en', '/pinning/'));
    await expect(page.locator('header.ds-navbar')).toBeVisible();
    await expect(page.locator('aside.ds-sidebar nav')).toBeVisible();
    await expect(page.locator('aside.ds-toc')).toBeVisible();
    await expect(page.locator('footer.ds-footer')).toBeVisible();
    await expect(page.locator('a.ds-skip')).toHaveAttribute('href', '#main');
    await expect(page).toHaveTitle(/Pinning · React Scheduler/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/react-scheduler\/pinning\/$/);
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(8);
  });

  test('moves focus to the content from the skip link', async ({ page, browserName }) => {
    // After hydration: React replaces the anchor, and a Tab sent before that would be lost.
    await open(page, url('en', '/pinning/'));

    if (browserName !== 'webkit') {
      // Safari does not put links in the tab order unless the reader turns that on, so the first
      // Tab is checked where it is the platform default.
      await page.keyboard.press('Tab');
      await expect(page.locator('a.ds-skip')).toBeFocused();
    }

    await page.locator('a.ds-skip').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('serves an unknown path as the locale 404', async ({ page }) => {
    const response = await page.goto(`/${pluginId}/ro/not-a-page/`);
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Pagina nu a fost găsită');
  });

  test('keeps a page path under a segment that is no locale a 404', async ({ page }) => {
    // Page routes are declared once under `:locale`, which also matches `xx`; the layout has to
    // show the 404 the host answered with, not the page the route table would have matched.
    const response = await page.goto(`/${pluginId}/xx/pinning/`);
    expect(response?.status()).toBe(404);
    await page.waitForFunction(() => document.documentElement.dataset['hydrated'] === 'true');
    await expect(page.locator('h1')).toHaveText('Page not found');
  });

  test('ships a root 404.html for the static host', async ({ request }) => {
    // The file a static host serves for a path without one (docs pack 10 §2); the local server
    // picks the locale's own 404 instead, so the file is fetched directly.
    const response = await request.get('/404.html');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('Page not found');
  });

  test('redirects the site root to the plugin root', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(`/${pluginId}/`);
  });
});

test.describe('the machine-readable surface', () => {
  test('serves llms.txt, the twins and the sitemap @smoke', async ({ request }) => {
    const index = await request.get(`/${pluginId}/llms.txt`);
    expect(index.status()).toBe(200);
    expect(await index.text()).toContain('# React Scheduler');

    const twin = await request.get(`/${pluginId}/pinning/index.md`);
    expect(twin.status()).toBe(200);
    expect(twin.headers()['content-type']).toContain('text/markdown');
    expect(await twin.text()).toContain('# Pinning');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('hreflang="x-default"');
  });
});
