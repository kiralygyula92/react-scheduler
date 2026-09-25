// SPDX-License-Identifier: MIT
// The Playground and the theme editor (docs pack 04 §4): the controls drive the component, the code
// and the URL, the log fills as the component emits, and the theme editor hands back the CSS for
// what was changed.
import { expect, type Page, test } from '@playwright/test';
import { open } from './hydrated.ts';

const PLAYGROUND = '/react-scheduler/demos/playground/';
const THEME_EDITOR = '/react-scheduler/demos/theme-editor/';

/** A category group is a disclosure: only the first one is open, so a card may need its group first. */
async function card(page: Page, name: string) {
  const found = page.locator(`[data-prop="${name}"]`);
  const group = found.locator('xpath=ancestor::details[1]');
  if (!(await group.evaluate((node: HTMLDetailsElement) => node.open))) await group.locator('summary').click();
  return found;
}

test.describe('playground', () => {
  test('a control changes the component, the code and the URL @smoke', async ({ page }) => {
    await open(page, PLAYGROUND);
    const view = await card(page, 'view');
    await view.getByRole('combobox').selectOption('timeline');

    await expect(page.locator('.ds-pg__component [data-rs-view="timeline"]')).toBeVisible();
    await expect(page.locator('.ds-code')).toContainText('view="timeline"');
    await expect(page).toHaveURL(/\?p=/);
    await expect(view).toHaveAttribute('data-changed', '');

    // The link is the configuration: opening it again lands on the same schedule.
    await page.goto(page.url());
    await page.waitForFunction(() => document.documentElement.dataset['hydrated'] === 'true');
    await expect(page.locator('[data-prop="view"]').getByRole('combobox')).toHaveValue('timeline');
  });

  test('reset all clears the configuration and the query string', async ({ page }) => {
    await open(page, PLAYGROUND);
    const density = await card(page, 'density');
    await density.getByRole('combobox').selectOption('dense');
    await expect(page).toHaveURL(/\?p=/);

    await page.getByRole('button', { name: 'Reset all' }).click();
    await expect(page).toHaveURL(PLAYGROUND);
    await expect(page.locator('[data-prop="density"]')).not.toHaveAttribute('data-changed', '');
    await expect(page.locator('.ds-code')).not.toContainText('density');
  });

  test('the filter and "changed only" narrow the list', async ({ page }) => {
    await open(page, PLAYGROUND);
    const cards = page.locator('.ds-pg__card');

    await page.getByLabel('Filter props').fill('overflow');
    const names = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-prop')));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name?.toLowerCase()).toContain('overflow');

    await page.locator('[data-prop="overflowPageSize"] input[type="number"]').fill('25');
    await page.getByLabel('Filter props').fill('');
    await page.getByLabel('Changed only').check();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toHaveAttribute('data-prop', 'overflowPageSize');
  });

  test('the log records what the component emits', async ({ page }) => {
    await open(page, PLAYGROUND);
    const log = page.locator('.ds-pg__panel', { has: page.locator('#event-log') });
    await log.locator('summary').click();
    // The schedule lands on the current shift and pins what it scrolls past, announcing its range,
    // its shift and its pins as it goes; the reader's own action is what has to turn up after that.
    const stage = page.locator('.ds-pg__component');
    await expect
      .poll(() => stage.locator('[data-rs-part="scroller"]').evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await page.waitForTimeout(800);
    await log.getByRole('button', { name: 'Clear' }).click();
    await expect(log.locator('li')).toHaveCount(0);
    await expect(log).toContainText('Nothing yet.');

    // A card already in view below the sticky top: the click itself scrolls nothing.
    const cards = stage.locator('[data-rs-part="cardActivator"]');
    const inView = await cards.evaluateAll((elements) => {
      const top =
        document.querySelector('.ds-pg__component [data-rs-part="stickyTop"]')?.getBoundingClientRect().bottom ?? 0;
      const bottom =
        document.querySelector('.ds-pg__component [data-rs-part="scroller"]')?.getBoundingClientRect().bottom ?? 0;
      return elements.findIndex((card) => {
        const rect = card.getBoundingClientRect();
        return rect.top >= top && rect.bottom <= bottom;
      });
    });
    expect(inView).toBeGreaterThanOrEqual(0);
    await cards.nth(inView).click();
    await expect(log).toContainText('onItemOpen');
    await expect(log.locator('li').first()).toContainText('onItemOpen');
  });
});

test.describe('theme editor', () => {
  test('a token changes the schedule and the CSS to copy @smoke', async ({ page }) => {
    await open(page, THEME_EDITOR);
    await expect(page.getByText('Change a token and its CSS appears here')).toBeVisible();

    const token = page.locator('[data-token="--rs-radius-card"]');
    const group = token.locator('xpath=ancestor::details[1]');
    if (!(await group.evaluate((node: HTMLDetailsElement) => node.open))) await group.locator('summary').click();
    await token.locator('input[type="text"]').fill('2px');

    await expect(token).toHaveAttribute('data-changed', '');
    await expect(page.locator('.ds-code')).toContainText('--rs-radius-card: 2px;');
    await expect(page.locator('.ds-pg__component [data-rs-view]').first()).toBeVisible();

    await page.getByRole('button', { name: 'Reset all' }).click();
    await expect(page.locator('.ds-code')).toHaveCount(0);
  });
});
