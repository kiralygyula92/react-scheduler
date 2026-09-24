// SPDX-License-Identifier: MIT
// Lighthouse on the four pages docs pack `07` §1 names, mobile and throttled, for the pre-publish
// audit (`09` §10). It runs against the built site served locally, because the Vercel project does
// not exist yet (GAPS G1, G2); the audit says so where it reports the numbers.
//
// Usage: node scripts/audit/lighthouse.ts [origin]   (the site must already be built)
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const origin = process.argv[2] ?? 'http://localhost:4173';
const PAGES: readonly { readonly name: string; readonly path: string }[] = [
  { name: 'Overview', path: '/react-scheduler/' },
  { name: 'Capability page', path: '/react-scheduler/pinning/' },
  { name: 'Playground', path: '/react-scheduler/demos/playground/' },
  { name: 'API page', path: '/react-scheduler/api/scheduler/' },
];

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;

interface Row {
  readonly page: string;
  readonly url: string;
  readonly scores: Record<string, number>;
  readonly metrics: Record<string, number>;
}

/** Playwright's Chromium is the browser the rest of the suite uses, so the audit uses it too. */
function launchChrome(port: number): ReturnType<typeof spawn> {
  return spawn(
    chromium.executablePath(),
    [
      `--remote-debugging-port=${String(port)}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      // A throwaway profile outside the repository: Chrome writes logs with absolute paths into it.
      `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rs-lighthouse-'))}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
}

async function main(): Promise<number> {
  const port = 9222;
  const chrome = launchChrome(port);
  await new Promise((wait) => setTimeout(wait, 2000));
  const rows: Row[] = [];

  try {
    for (const page of PAGES) {
      const url = `${origin}${page.path}`;
      const result = await lighthouse(url, { port, output: 'json', logLevel: 'error' });
      if (result === undefined) throw new Error(`Lighthouse returned nothing for ${url}`);
      const { categories, audits } = result.lhr;
      rows.push({
        page: page.name,
        url: page.path,
        scores: Object.fromEntries(CATEGORIES.map((id) => [id, Math.round((categories[id]?.score ?? 0) * 100)])),
        metrics: {
          lcp: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
          cls: Number((audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
          tbt: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
        },
      });
      console.log(
        `${page.name.padEnd(18)} ${CATEGORIES.map((id) => `${id}=${String(rows.at(-1)?.scores[id])}`).join(' ')} ` +
          `lcp=${String(rows.at(-1)?.metrics['lcp'])}ms cls=${String(rows.at(-1)?.metrics['cls'])} tbt=${String(rows.at(-1)?.metrics['tbt'])}ms`,
      );
    }
  } finally {
    chrome.kill();
  }

  const out = resolve(import.meta.dirname, '..', '..', 'test-results');
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'lighthouse.json'), `${JSON.stringify({ origin, rows }, null, 2)}\n`);
  return 0;
}

process.exitCode = await main();
