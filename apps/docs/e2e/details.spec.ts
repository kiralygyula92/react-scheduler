// SPDX-License-Identifier: MIT
// The details a reader notices in the first minute (site review, ADR 0005 D6 and EXCEPTIONS #9, #17):
// no control that does nothing, breadcrumbs that follow `02` §6.5, code that keeps its case, a head
// that previews well when shared, one title per page, and nothing wider than a small phone.
import { expect, test } from '@playwright/test';
import navigation from '../src/content/nav.json' with { type: 'json' };
import { open } from './hydrated.ts';

const pluginId = navigation.pluginId;
const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;

interface Item {
  readonly path: string;
  readonly type?: string;
  readonly items?: readonly Item[];
}

const paths: string[] = navigation.sections
  .flatMap((section) =>
    (section.items as unknown as Item[]).flatMap((entry) => (entry.type === 'group' ? (entry.items ?? []) : [entry])),
  )
  .map((entry) => entry.path);

const url = (locale: string, path: string): string =>
  `/${pluginId}/${locale === 'en' ? '' : `${locale}/`}${path.replace(/^\//, '')}`;

test.describe('site details', () => {
  test('the menu button shows only where it opens something', async ({ page }) => {
    await open(page, `/${pluginId}/pinning/`);
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    const burger = page.getByRole('button', { name: 'Open navigation' });
    await expect(burger).toBeVisible();
    await burger.click();
    await expect(page.locator('#ds-drawer')).toBeVisible();
  });

  test('breadcrumbs are the plugin, the section and the group, each but the last a link', async ({ page }) => {
    await open(page, `/${pluginId}/pinning/`);
    const trail = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(trail.locator('li')).toHaveText(['React Scheduler', 'Features', 'Interaction']);
    await expect(trail.getByRole('link')).toHaveCount(2);
    await expect(trail.getByRole('link', { name: 'Features' })).toHaveAttribute('href', `/${pluginId}/all-features/`);
    await open(page, `/${pluginId}/demos/`);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('li')).toHaveText([
      'React Scheduler',
      'Demos',
    ]);
  });

  test('a props table names each prop as it is written', async ({ page }) => {
    await open(page, `/${pluginId}/api/scheduler/`);
    const first = page.locator('.ds-table tbody th').first();
    await expect(first.locator('code')).toHaveText('items');
    expect(await first.evaluate((cell) => getComputedStyle(cell).textTransform)).toBe('none');
  });

  test('the head previews well when shared, in every locale', async ({ page, request }) => {
    for (const [locale, og] of [
      ['en', 'en_US'],
      ['de', 'de_DE'],
    ] as const) {
      await page.goto(url(locale, '/pinning/'));
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', og);
      await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(LOCALES.length - 1);
      expect(await page.locator('meta[property="og:image:alt"]').getAttribute('content')).toMatch(/React Scheduler/);
      await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveCount(1);
    }
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
    expect((await request.get('/apple-touch-icon.png')).status()).toBe(200);
    // The favicon has to be an image a browser can decode, not only a file that is served.
    const decoded = await page.evaluate(async () => {
      const image = new Image();
      image.src = '/favicon.svg';
      await image.decode();
      return image.naturalWidth > 0;
    });
    expect(decoded).toBe(true);
  });

  test('no two pages of one locale share a title', async ({ request, browserName }) => {
    test.skip(browserName !== 'chromium', 'reads the prerendered HTML; one engine is enough');
    test.setTimeout(120_000);
    for (const locale of LOCALES) {
      const seen = new Map<string, string>();
      for (const path of paths) {
        const html = await (await request.get(url(locale, path))).text();
        const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
        expect(seen.get(title), `${locale}: "${title}" on ${path}`).toBeUndefined();
        seen.set(title, path);
      }
    }
  });

  test('nothing is wider than a 280px phone, in German', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'a layout check; one engine is enough');
    await page.setViewportSize({ width: 280, height: 653 });
    for (const path of [
      '/demos/playground/',
      '/demos/theme-editor/',
      '/api/types-model/',
      '/guides/',
      '/timeline-view/',
    ]) {
      await open(page, url('de', path));
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
      const toolbar = page.locator('.ds-demo__bar').first();
      if ((await toolbar.count()) > 0) {
        const box = await toolbar.boundingBox();
        expect((box?.x ?? 0) >= 0, `${path}: demo toolbar`).toBe(true);
      }
    }
  });
});
