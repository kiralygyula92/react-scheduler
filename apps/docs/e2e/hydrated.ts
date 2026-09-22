// SPDX-License-Identifier: MIT
// Opens a page and waits until its JavaScript is live. Prerendered pages are readable before
// hydration, so a keystroke sent too early is simply lost; `AppShell` sets `data-hydrated` when the
// shell's behaviour is attached.
import type { Page } from '@playwright/test';

export async function open(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset['hydrated'] === 'true');
}
