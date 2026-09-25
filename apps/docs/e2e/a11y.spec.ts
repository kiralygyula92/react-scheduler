// SPDX-License-Identifier: MIT
// Accessibility of the shell and of every kind of page (docs pack 07 §1: zero serious or critical
// axe violations on every page, both themes, all locales). axe-core is injected from the workspace,
// so nothing is fetched at test time.
import { createRequire } from 'node:module';
import { expect, type Page, test } from '@playwright/test';
import { open } from './hydrated.ts';

interface AxeResult {
  readonly violations: readonly { id: string; impact: string | null; nodes: readonly { target: string[] }[] }[];
}

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

/**
 * Resolves once the DOM has not changed for `quiet` ms. A page that renders a schedule keeps working
 * after hydration — it lands, pins and reports each change — and axe measures what it finds while it
 * runs: auditing the Playground in the middle of that burst, WebKit under load reported `<body>`
 * without its background, and axe took the page for white (ADR 0005 D5).
 */
async function quiet(page: Page, quietMs = 500): Promise<void> {
  await page.evaluate(
    (ms) =>
      new Promise<void>((resolve) => {
        let timer = setTimeout(done, ms);
        const observer = new MutationObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(done, ms);
        });
        function done(): void {
          observer.disconnect();
          resolve();
        }
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }),
    quietMs,
  );
}

/** One page, one theme: the serious and critical violations axe reports. */
async function violations(page: Page): Promise<string[]> {
  await quiet(page);
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate<AxeResult>(async () => {
    const axe = (globalThis as unknown as { axe: { run: (options: unknown) => Promise<AxeResult> } }).axe;
    return axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
  });
  return result.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id} at ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
}

/** One page per template kind — including the ones the component itself renders on — plus one
 * non-English page. */
const PAGES = [
  '/react-scheduler/',
  '/react-scheduler/getting-started/installation/',
  '/react-scheduler/all-features/',
  '/react-scheduler/pinning/',
  '/react-scheduler/demos/',
  '/react-scheduler/demos/playground/',
  '/react-scheduler/demos/theme-editor/',
  '/react-scheduler/api/',
  '/react-scheduler/api/scheduler/',
  '/react-scheduler/api/types-model/',
  '/react-scheduler/timeline-view/',
  '/react-scheduler/customization/theming/',
  '/react-scheduler/discover-more/license/',
  '/react-scheduler/ro/pinning/',
  '/react-scheduler/404/',
];

test.describe('axe', () => {
  for (const url of PAGES) {
    test(`${url} is clean in both themes @smoke`, async ({ page }) => {
      await open(page, url);
      expect(await violations(page)).toEqual([]);

      // The dark theme is checked on a fresh load, the way a reader with the preference stored gets
      // it: flipping the attribute in place would have axe measure colours the page has not
      // repainted with yet.
      await page.addInitScript(() => {
        localStorage.setItem('ds:theme', 'dark');
      });
      await open(page, url);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      expect(await violations(page)).toEqual([]);
    });
  }

  test('the search dialog is clean while open', async ({ page }) => {
    await open(page, '/react-scheduler/');
    await page.keyboard.press('/');
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
    await page.keyboard.type('view');
    expect(await violations(page)).toEqual([]);
  });

  test('the drawer is clean while open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '/react-scheduler/pinning/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.locator('#ds-drawer')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('the language menu is clean while open', async ({ page }) => {
    await open(page, '/react-scheduler/pinning/');
    await page.getByRole('button', { name: 'Language' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
});
