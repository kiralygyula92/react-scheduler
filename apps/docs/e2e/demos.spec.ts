// SPDX-License-Identifier: MIT
// The demos do what their pages say (ADR 0005 D5). The schedule fills its container, so every demo
// gives it a height: without one it grows with its content, never scrolls, and the shift buttons
// have nothing to move. The controls above a schedule are the site's own, never bare elements.
import { expect, type Locator, type Page, test } from '@playwright/test';
import navigation from '../src/content/nav.json' with { type: 'json' };
import { open } from './hydrated.ts';

const pluginId = navigation.pluginId;

interface Item {
  readonly path: string;
  readonly type?: string;
  readonly items?: readonly Item[];
}

const pages: string[] = navigation.sections
  .flatMap((section) =>
    (section.items as unknown as Item[]).flatMap((entry) => (entry.type === 'group' ? (entry.items ?? []) : [entry])),
  )
  .map((entry) => `/${pluginId}${entry.path}`);

/** Every scheduler a page renders: in a demo frame, or on the Playground's stage. */
const schedulers = (page: Page): Locator =>
  page.locator('.ds-demo .rs-root:not([hidden]), .ds-pg__component .rs-root:not([hidden])');

const scrollTop = (root: Locator): Promise<number> =>
  root.evaluate((element) => Math.round(element.querySelector('[data-rs-part="scroller"]')?.scrollTop ?? -1));

/** Waits until a smooth scroll and its correction have stopped moving the view. */
async function settle(root: Locator): Promise<void> {
  let last = Number.NaN;
  for (let step = 0; step < 40; step++) {
    const now = await scrollTop(root);
    if (now === last) break;
    last = now;
    await root.page().waitForTimeout(150);
  }
  // The list resumes pinning 180 ms after the final correction (Feature Dossier 01 §L.7).
  await root.page().waitForTimeout(250);
}

test.describe('every demo', () => {
  test('gives its schedule a height, uses the site controls, and throws nothing', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'a sweep of every page; one engine is enough');
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));
    let seen = 0;
    for (const path of pages) {
      await open(page, path);
      const found = await schedulers(page).evaluateAll((roots) =>
        roots.map((root) => {
          const scroller = root.querySelector<HTMLElement>('[data-rs-part="scroller"]');
          return {
            height: root.getBoundingClientRect().height,
            fits: scroller === null || scroller.scrollHeight <= scroller.clientHeight + 1,
            scrolls: scroller !== null && scroller.scrollHeight > scroller.clientHeight + 1,
          };
        }),
      );
      for (const [index, root] of found.entries()) {
        // A bounded root is at most a screen tall; one that fits its content needs no scrolling.
        expect(root.height, `${path} #${String(index)} height`).toBeLessThanOrEqual(900);
        expect(root.fits || root.scrolls, `${path} #${String(index)} scrolls`).toBe(true);
      }
      seen += found.length;
      const bare = await page.locator('.ds-demo__stage').evaluateAll((stages) =>
        stages.flatMap((stage) =>
          [...stage.querySelectorAll<HTMLElement>('button, select, input')]
            .filter((element) => element.closest('.rs-root, [role="dialog"], dialog') === null)
            .filter((element) => element.className === '' && element.closest('.ds-check') === null)
            .map((element) => element.outerHTML.slice(0, 80)),
        ),
      );
      expect(bare, `${path}: bare controls`).toEqual([]);
    }
    expect(seen).toBeGreaterThan(30);
    expect(errors).toEqual([]);
  });

  test('the shift buttons walk the list down and back up, each press moving it', async ({ page }) => {
    await open(page, `/${pluginId}/navigation/`);
    const root = schedulers(page).first();
    await root.scrollIntoViewIfNeeded();
    for (const position of ['bottom', 'top'] as const) {
      const button = root.locator(`[data-rs-part="navButton"][data-rs-position="${position}"]:not([data-rs-disabled])`);
      let presses = 0;
      while ((await button.count()) > 0 && presses < 8) {
        const before = await scrollTop(root);
        await button.click();
        await expect
          .poll(() => scrollTop(root), { message: `${position} press ${String(presses + 1)}` })
          .not.toBe(before);
        await settle(root);
        presses++;
      }
      expect(presses, `${position} presses`).toBeGreaterThan(0);
    }
    expect(await scrollTop(root)).toBe(0);
  });

  test('the timeline buttons move between shifts', async ({ page }) => {
    await open(page, `/${pluginId}/timeline-view/`);
    const root = schedulers(page).first();
    await root.scrollIntoViewIfNeeded();
    const next = root.locator('[data-rs-part="navButton"][data-rs-position="bottom"]:not([data-rs-disabled])');
    await next.click();
    await expect.poll(() => scrollTop(root)).toBeGreaterThan(0);
    await settle(root);
    const back = root.locator('[data-rs-part="navButton"][data-rs-position="top"]:not([data-rs-disabled])');
    await back.click();
    await expect.poll(() => scrollTop(root)).toBe(0);
  });

  test('a card opens its detail, and "+ more" opens the overflow table', async ({ page }) => {
    await open(page, `/${pluginId}/item-detail/`);
    const list = schedulers(page).first();
    await list.scrollIntoViewIfNeeded();
    await list.locator('[data-rs-part="cardActivator"]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await open(page, `/${pluginId}/overflow/`);
    const timeline = schedulers(page).first();
    await timeline.scrollIntoViewIfNeeded();
    await timeline.locator('[data-rs-part="moreChip"]').first().click();
    await expect(page.getByRole('dialog').getByRole('table')).toBeVisible();
  });

  test('in a narrow container, the scroll-to-top button takes the list back to the top', async ({ page }) => {
    await open(page, `/${pluginId}/compact/`);
    const demo = page.locator('.ds-demo').first();
    await demo.scrollIntoViewIfNeeded();
    await demo.getByRole('button', { name: '420 pixels' }).click();
    const root = schedulers(page).first();
    await expect(root).toHaveAttribute('data-rs-compact', '');
    await root.locator('[data-rs-part="scroller"]').evaluate((scroller) => {
      scroller.scrollTop = scroller.scrollHeight;
    });
    const button = root.locator('[data-rs-part="scrollTopButton"]');
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => scrollTop(root)).toBe(0);
  });
});
