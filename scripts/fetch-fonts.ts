// SPDX-License-Identifier: MIT
// Downloads the two OFL fonts the characterization references were rendered with (Feature Dossier 09
// §4: "fonts installed from the OFL sources") into .cache/fonts/, for the browser suite's visual
// checks. The files are pinned to a commit of the Google Fonts repository and verified by SHA-256;
// they are never committed.
//
// Usage: node scripts/fetch-fonts.ts
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const COMMIT = 'e44c4b011a820c2cbe2fd2cfa8052037d7edb571';
const BASE = `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl`;

export const FONTS = [
  {
    file: 'Inter.ttf',
    source: `${BASE}/inter/Inter%5Bopsz,wght%5D.ttf`,
    sha256: '29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031',
  },
  {
    file: 'InterTight.ttf',
    source: `${BASE}/intertight/InterTight%5Bwght%5D.ttf`,
    sha256: 'b81b73dcb64df3c230cabade7df6c5773bf863233f24c9ee51087519f1f88b6f',
  },
] as const;

const directory = resolve(import.meta.dirname, '..', '.cache', 'fonts');

function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

async function main(): Promise<number> {
  mkdirSync(directory, { recursive: true });
  for (const font of FONTS) {
    const target = resolve(directory, font.file);
    if (existsSync(target) && sha256(readFileSync(target)) === font.sha256) continue;
    const response = await fetch(font.source);
    if (!response.ok) {
      console.error(`fonts: ${font.file}: HTTP ${response.status}`);
      return 1;
    }
    const data = new Uint8Array(await response.arrayBuffer());
    const hash = sha256(data);
    if (hash !== font.sha256) {
      console.error(`fonts: ${font.file}: SHA-256 ${hash} does not match the pinned ${font.sha256}`);
      return 1;
    }
    writeFileSync(target, data);
    console.log(`fonts: ${font.file} downloaded and verified`);
  }
  console.log(`fonts: ${FONTS.length} font(s) ready in .cache/fonts`);
  return 0;
}

process.exitCode = await main();
