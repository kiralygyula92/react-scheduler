// SPDX-License-Identifier: MIT
// The shell's behaviour (docs pack 02 §6, 11): the drawer, search, the language menu, the theme and
// the sidebar, each checked the way a reader would use it.
import { expect, test } from '@playwright/test';
import { open } from './hydrated.ts';

const OVERVIEW = '/react-scheduler/';
const PINNING = '/react-scheduler/pinning/';

test.describe('theme', () => {
  test('persists and applies before the first paint @smoke', async ({ page }) => {
    await open(page, PINNING);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // A full reload must come back dark with no light frame in between: the bootstrap script sets
    // the attribute before any stylesheet is applied (02 §8).
    await page.reload();
    const theme = await page.evaluate(() => document.documentElement.dataset['theme']);
    expect(theme).toBe('dark');
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  });
});

test.describe('language menu', () => {
  test('keeps the path and the hash @smoke', async ({ page }) => {
    await open(page, `${PINNING}#limitations`);
    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('menuitem', { name: 'Română' }).click();
    await expect(page).toHaveURL('/react-scheduler/ro/pinning/#limitations');
    await expect(page.locator('h1')).toHaveText('Fixare');
  });

  test('marks the current language and closes on Escape', async ({ page }) => {
    await open(page, '/react-scheduler/de/pinning/');
    const button = page.getByRole('button', { name: 'Sprache' });
    await button.click();
    await expect(page.getByRole('menuitem', { name: 'Deutsch' })).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});

test.describe('search', () => {
  test('opens with the slash key and finds a page @smoke', async ({ page }) => {
    await open(page, OVERVIEW);
    await page.keyboard.press('/');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();

    await page.keyboard.type('timeline');
    const results = dialog.getByRole('option');
    await expect(results.first()).toContainText('Timeline view');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/react-scheduler/timeline-view/');
  });

  test('opens with Control+K and closes with Escape', async ({ page }) => {
    await open(page, OVERVIEW);
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('says so when nothing matches', async ({ page }) => {
    await open(page, OVERVIEW);
    await page.keyboard.press('/');
    await page.keyboard.type('qqqzzz');
    await expect(page.getByText('No results for “qqqzzz”.')).toBeVisible();
  });
});

test.describe('sidebar', () => {
  test('marks the current page and toggles a section', async ({ page }) => {
    await open(page, PINNING);
    const sidebar = page.locator('aside.ds-sidebar');
    await expect(sidebar.getByRole('link', { name: 'Pinning' })).toHaveAttribute('aria-current', 'page');

    const header = sidebar.getByRole('button', { name: 'Features' });
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await header.click();
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(sidebar.getByRole('link', { name: 'Pinning' })).toBeHidden();
  });

  test('navigates without a full page load and moves focus to the heading', async ({ page }) => {
    await open(page, PINNING);
    await page.locator('aside.ds-sidebar').getByRole('link', { name: 'Now indicator' }).click();
    await expect(page).toHaveURL('/react-scheduler/now-indicator/');
    await expect(page.locator('h1')).toBeFocused();
  });
});

test.describe('table of contents', () => {
  test('lists the page sections and links to them', async ({ page }) => {
    await open(page, PINNING);
    const toc = page.locator('aside.ds-toc');
    await expect(toc.getByRole('link')).toHaveCount(6);
    await toc.getByRole('link', { name: 'Limitations' }).click();
    await expect(page).toHaveURL(`${PINNING}#limitations`);
  });
});

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens, traps focus and closes on navigation @smoke', async ({ page }) => {
    await open(page, PINNING);
    await expect(page.locator('aside.ds-sidebar')).toBeHidden();

    const hamburger = page.getByRole('button', { name: 'Open navigation' });
    await hamburger.click();
    const drawer = page.locator('#ds-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');

    await drawer.getByRole('link', { name: 'Overflow' }).click();
    await expect(page).toHaveURL('/react-scheduler/overflow/');
    await expect(drawer).toBeHidden();
  });

  test('closes on Escape and gives focus back', async ({ page }) => {
    await open(page, PINNING);
    // Opened from the keyboard, which is the case where returning focus matters — and the only one
    // that behaves the same everywhere, because WebKit does not focus a button on click.
    const hamburger = page.getByRole('button', { name: 'Open navigation' });
    await hamburger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#ds-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#ds-drawer')).toBeHidden();
    await expect(hamburger).toBeFocused();
  });
});
