// SPDX-License-Identifier: MIT
// Renders the one static social image the site uses (docs pack 01 §9: `/react-scheduler/og.png`,
// 1200×630) with Playwright, which this repository already runs, and writes it next to the other
// prefixed assets. The strings are the display name and the one-line description from the project
// dictionary in AGENTS.md; this is the only image with text, and the docs pack gives every plugin
// exactly one, so it is not localized. Colours are the light-theme tokens of the shell.
//
// Usage: node scripts/build-og-image.ts   (after scripts/build-site-font.ts)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { sha256 } from './lib/fonts.ts';

const DISPLAY_NAME = 'React Scheduler';
const DESCRIPTION =
  'Shift schedules for React: a working day as a list or a timeline, for offices, factories and anywhere people work in shifts.';
const PACKAGE_NAME = '@react-schedulerkit/react-scheduler';

const WIDTH = 1200;
const HEIGHT = 630;

const publicDirectory = resolve(import.meta.dirname, '..', 'apps', 'docs', 'public');
const fontFile = resolve(publicDirectory, 'fonts', 'InterVariable.woff2');
const target = resolve(publicDirectory, 'react-scheduler', 'og.png');
// The home-screen and share-sheet icon of iOS and several chat apps, which do not read SVG favicons:
// the favicon's own bars, on white, with the margin iOS's rounded mask needs. Also where iOS looks
// without a <link>, the site root.
const favicon = resolve(publicDirectory, 'favicon.svg');
const touchIcon = resolve(publicDirectory, 'apple-touch-icon.png');
const TOUCH = 180;

function iconPage(svgDataUrl: string): string {
  return `<!doctype html><html><head><style>
  * { margin: 0; padding: 0; }
  body { width: ${TOUCH}px; height: ${TOUCH}px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; }
</style></head><body><img src="${svgDataUrl}" width="120" height="120" alt=""></body></html>`;
}

function write(path: string, png: Buffer, label: string, size: string): void {
  const unchanged = existsSync(path) && sha256(readFileSync(path)) === sha256(png);
  if (!unchanged) writeFileSync(path, png);
  console.log(
    `og: ${label} ${unchanged ? 'unchanged' : 'written'} — ${size}, ${(png.byteLength / 1024).toFixed(1)} kB`,
  );
}

function card(fontDataUrl: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @font-face { font-family: "Inter Variable"; src: url("${fontDataUrl}") format("woff2"); font-weight: 100 900; font-style: normal; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; background: #FFFFFF; color: #0F172A;
         font-family: "Inter Variable", sans-serif; -webkit-font-smoothing: antialiased; }
  .frame { height: 100%; padding: 96px 88px; display: flex; flex-direction: column; justify-content: space-between;
           border-top: 12px solid #1D4ED8; }
  h1 { font-size: 84px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; }
  p { margin-top: 28px; max-width: 880px; font-size: 32px; line-height: 1.45; color: #475569; }
  .foot { display: flex; align-items: center; gap: 16px; font-size: 26px; color: #5B6B82; }
  .bars { display: flex; flex-direction: column; gap: 7px; }
  .bars i { display: block; height: 11px; border-radius: 6px; background: #1D4ED8; }
  .bars i:nth-child(1) { width: 46px; }
  .bars i:nth-child(2) { width: 62px; margin-left: 14px; opacity: 0.72; }
  .bars i:nth-child(3) { width: 32px; opacity: 0.48; }
</style></head>
<body><div class="frame">
  <div><h1>${DISPLAY_NAME}</h1><p>${DESCRIPTION}</p></div>
  <div class="foot"><span class="bars"><i></i><i></i><i></i></span><span>${PACKAGE_NAME}</span></div>
</div></body></html>`;
}

async function main(): Promise<number> {
  if (!existsSync(fontFile)) {
    console.error('og: apps/docs/public/fonts/InterVariable.woff2 is missing — run scripts/build-site-font.ts first');
    return 1;
  }
  mkdirSync(resolve(publicDirectory, 'react-scheduler'), { recursive: true });
  const fontDataUrl = `data:font/woff2;base64,${readFileSync(fontFile).toString('base64')}`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await page.setContent(card(fontDataUrl), { waitUntil: 'load' });
    // Passed as source, not as a closure: these scripts type-check without the DOM library.
    await page.evaluate('document.fonts.ready');
    write(target, await page.screenshot({ type: 'png' }), 'react-scheduler/og.png', `${WIDTH}×${HEIGHT}`);

    const icon = await browser.newPage({ viewport: { width: TOUCH, height: TOUCH }, deviceScaleFactor: 1 });
    const svg = `data:image/svg+xml;base64,${readFileSync(favicon).toString('base64')}`;
    await icon.setContent(iconPage(svg), { waitUntil: 'load' });
    write(touchIcon, await icon.screenshot({ type: 'png' }), 'apple-touch-icon.png', `${TOUCH}×${TOUCH}`);
  } finally {
    await browser.close();
  }
  return 0;
}

process.exitCode = await main();
