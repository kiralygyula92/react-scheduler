/// <reference lib="dom" />
// SPDX-License-Identifier: MIT
// The rendering matrix of the pre-publish audit (docs pack 09 §10.2): every page that renders the
// component, in Chromium, Firefox and WebKit, light and dark, at 390, 1024 and 1440 pixels wide.
// It reports what a person cannot check by hand at that scale: console errors, pages that failed to
// render a schedule, and layouts that overflow the viewport sideways.
//
// Usage: node scripts/audit/rendering.ts [origin]   (the site must be built and served)
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, firefox, webkit } from '@playwright/test';

const origin = process.argv[2] ?? 'http://localhost:4173';

const PAGES: readonly string[] = [
  '/react-scheduler/demos/baseline-day/',
  '/react-scheduler/demos/empty/',
  '/react-scheduler/demos/sparse/',
  '/react-scheduler/demos/crowded/',
  '/react-scheduler/demos/night-shift/',
  '/react-scheduler/demos/past-date/',
  '/react-scheduler/demos/pinned-many/',
  '/react-scheduler/demos/large/',
  '/react-scheduler/demos/playground/',
  '/react-scheduler/demos/theme-editor/',
  '/react-scheduler/timeline-view/',
  '/react-scheduler/list-view/',
  '/react-scheduler/pinning/',
  '/react-scheduler/overflow/',
  '/react-scheduler/compact/',
  '/react-scheduler/states/',
];

const ENGINES = [
  { name: 'chromium', type: chromium },
  { name: 'firefox', type: firefox },
  { name: 'webkit', type: webkit },
] as const;
const THEMES = ['light', 'dark'] as const;
const WIDTHS = [390, 1024, 1440] as const;

interface Finding {
  readonly engine: string;
  readonly theme: string;
  readonly width: number;
  readonly page: string;
  readonly kind: 'console' | 'pageerror' | 'no-schedule' | 'overflow';
  readonly detail: string;
}

/** Vercel's own analytics scripts exist only on the host, so their 404s are this server's doing. */
function fromHostOnly(url: string): boolean {
  return url.includes('/_vercel/');
}

async function main(): Promise<number> {
  const findings: Finding[] = [];
  let checked = 0;

  for (const engine of ENGINES) {
    const browser = await engine.type.launch();
    for (const theme of THEMES) {
      const context = await browser.newContext({ viewport: { width: WIDTHS[0], height: 844 } });
      await context.addInitScript(`localStorage.setItem('ds:theme', ${JSON.stringify(theme)})`);
      const page = await context.newPage();
      const messages: string[] = [];
      const failed: string[] = [];
      page.on('response', (response) => {
        if (response.status() >= 400 && !fromHostOnly(response.url())) failed.push(response.url());
      });
      page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        // Chromium reports a failed request without naming it, so a generic line counts only when a
        // request this site owns actually failed.
        if (/Failed to load resource/.test(text) && failed.length === 0) return;
        if (fromHostOnly(message.location().url) || fromHostOnly(text)) return;
        messages.push(text.slice(0, 200));
      });
      page.on('pageerror', (error) => messages.push(`pageerror: ${error.message.slice(0, 200)}`));

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        for (const path of PAGES) {
          messages.length = 0;
          failed.length = 0;
          await page.goto(`${origin}${path}`, { waitUntil: 'load' });
          await page.waitForFunction(() => document.documentElement.dataset['hydrated'] === 'true');
          await page.waitForTimeout(150);
          checked += 1;

          const where = { engine: engine.name, theme, width, page: path };
          for (const detail of messages) findings.push({ ...where, kind: 'console', detail });

          const state = await page.evaluate(() => ({
            schedules: document.querySelectorAll('[data-rs-view]').length,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            theme: document.documentElement.dataset['theme'] ?? '',
          }));
          if (state.schedules === 0) findings.push({ ...where, kind: 'no-schedule', detail: 'no [data-rs-view]' });
          if (state.overflow > 1) {
            findings.push({
              ...where,
              kind: 'overflow',
              detail: `${String(state.overflow)}px wider than the viewport`,
            });
          }
          if (state.theme !== theme) {
            findings.push({ ...where, kind: 'console', detail: `theme is ${state.theme}, expected ${theme}` });
          }
        }
      }
      await context.close();
    }
    await browser.close();
    console.log(`${engine.name}: done`);
  }

  const out = resolve(import.meta.dirname, '..', '..', 'test-results');
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'rendering-matrix.json'), `${JSON.stringify({ checked, findings }, null, 2)}\n`);
  console.log(`rendering: ${String(checked)} page loads, ${String(findings.length)} finding(s)`);
  for (const finding of findings.slice(0, 40)) {
    console.log(
      `  ${finding.engine}/${finding.theme}/${String(finding.width)} ${finding.page} — ${finding.kind}: ${finding.detail}`,
    );
  }
  return findings.length === 0 ? 0 : 1;
}

process.exitCode = await main();
