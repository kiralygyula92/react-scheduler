// Which audits cost points, for the pre-publish audit's performance section.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import lighthouse from 'lighthouse';

const port = 9223;
const chrome = spawn(
  chromium.executablePath(),
  [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rs-lighthouse-'))}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
await new Promise((wait) => setTimeout(wait, 2000));

const url = process.argv[2] ?? 'http://localhost:4173/react-scheduler/';
const result = await lighthouse(url, { port, output: 'json', logLevel: 'error' });
const { audits, categories } = result.lhr;

for (const category of ['performance', 'best-practices']) {
  console.log(`\n## ${category}: ${Math.round(categories[category].score * 100)}`);
  for (const ref of categories[category].auditRefs) {
    const audit = audits[ref.id];
    if (audit.score === null || audit.score >= 0.9) continue;
    const savings = audit.details?.overallSavingsMs ?? audit.numericValue;
    console.log(
      `  ${audit.score.toFixed(2)}  ${ref.id.padEnd(34)} ${audit.displayValue ?? ''} ${
        typeof savings === 'number' ? `(${Math.round(savings)})` : ''
      }`,
    );
    for (const item of (audit.details?.items ?? []).slice(0, 3)) {
      console.log(`        · ${(item.url ?? item.node?.snippet ?? JSON.stringify(item)).toString().slice(0, 110)}`);
    }
  }
}

chrome.kill();
