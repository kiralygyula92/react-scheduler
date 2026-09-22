// SPDX-License-Identifier: MIT
// Visual baselines of the shell (M4 gate): the three breakpoints of 02 §7 in both themes, plus the
// two overlays. Chromium only, and only where the baselines were recorded — a screenshot is a
// rasterization, and Windows and Linux do not rasterize identically (ADR 0003 D9). CI runs this on
// Windows; elsewhere the suite skips instead of inventing a baseline.
import { expect, test } from '@playwright/test';
import { open } from './hydrated.ts';

const PAGE = '/react-scheduler/pinning/';
const WIDTHS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 1024, height: 900 },
  { name: 'desktop', width: 1440, height: 900 },
];

test.skip(
  process.platform !== 'win32' && process.env['RS_VISUAL'] !== '1',
  'shell baselines are recorded on Windows (ADR 0003 D9)',
);
test.describe.configure({ mode: 'serial' });

test.use({ colorScheme: 'light' });

for (const theme of ['light', 'dark'] as const) {
  for (const size of WIDTHS) {
    test(`${size.name} ${theme} @visual`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'one engine is enough for a rasterization check');
      await page.setViewportSize({ width: size.width, height: size.height });
      if (theme === 'dark') {
        await page.addInitScript(() => {
          localStorage.setItem('ds:theme', 'dark');
        });
      }
      await open(page, PAGE);
      await expect(page).toHaveScreenshot(`shell-${size.name}-${theme}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }
}

test('search dialog @visual', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'one engine is enough for a rasterization check');
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, PAGE);
  await page.keyboard.press('/');
  await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  await page.keyboard.type('view');
  await expect(page.getByRole('option').first()).toBeVisible();
  await expect(page).toHaveScreenshot('search-dialog.png', { animations: 'disabled', caret: 'hide' });
});

test('mobile drawer @visual', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'one engine is enough for a rasterization check');
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, PAGE);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('#ds-drawer')).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-drawer.png', { animations: 'disabled', caret: 'hide' });
});
