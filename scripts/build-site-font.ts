// SPDX-License-Identifier: MIT
// Builds the docs site's self-hosted font: Inter variable reduced to the Latin and Latin Extended
// ranges (docs pack 07 §1), written to apps/docs/public/fonts/ as the single file the verbatim
// shell asks for (11-docs-shell-reference/tokens.css: url("/fonts/InterVariable.woff2"), no
// unicode-range, so one file has to cover all seven locales). The source is the OFL release pinned
// in lib/fonts.ts; the licence is copied next to the font, as OFL 1.1 §2 requires. Both outputs are
// committed, so the site builds without network access — rerun this only to update the font.
//
// Usage: node scripts/build-site-font.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import subsetFont from 'subset-font';
import { ensureFile, FONTS, INTER_LICENSE, sha256 } from './lib/fonts.ts';

type Range = readonly [start: number, end: number];

// The two subset definitions Google Fonts publishes for Inter v20 (fonts.google.com), copied from
// the `unicode-range` descriptors of its stylesheet. Their union is what the site ships.
const LATIN: readonly Range[] = [
  [0x0000, 0x00ff],
  [0x0131, 0x0131],
  [0x0152, 0x0153],
  [0x02bb, 0x02bc],
  [0x02c6, 0x02c6],
  [0x02da, 0x02da],
  [0x02dc, 0x02dc],
  [0x0304, 0x0304],
  [0x0308, 0x0308],
  [0x0329, 0x0329],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2191, 0x2191],
  [0x2193, 0x2193],
  [0x2212, 0x2212],
  [0x2215, 0x2215],
  [0xfeff, 0xfeff],
  [0xfffd, 0xfffd],
];

const LATIN_EXT: readonly Range[] = [
  [0x0100, 0x02ba],
  [0x02bd, 0x02c5],
  [0x02c7, 0x02cc],
  [0x02ce, 0x02d7],
  [0x02dd, 0x02ff],
  [0x0304, 0x0304],
  [0x0308, 0x0308],
  [0x0329, 0x0329],
  [0x1d00, 0x1dbf],
  [0x1e00, 0x1e9f],
  [0x1ef2, 0x1eff],
  [0x2020, 0x2020],
  [0x20a0, 0x20ab],
  [0x20ad, 0x20c0],
  [0x2113, 0x2113],
  [0x2c60, 0x2c7f],
  [0xa720, 0xa7ff],
];

/** Inter's `opsz` default; see the call below. */
const OPTICAL_SIZE = 14;

const outputDirectory = resolve(import.meta.dirname, '..', 'apps', 'docs', 'public', 'fonts');

function characters(ranges: readonly Range[]): string {
  let text = '';
  for (const [start, end] of ranges) {
    for (let code = start; code <= end; code += 1) text += String.fromCodePoint(code);
  }
  return text;
}

function write(file: string, data: Uint8Array): 'written' | 'unchanged' {
  const target = resolve(outputDirectory, file);
  if (existsSync(target) && sha256(readFileSync(target)) === sha256(data)) return 'unchanged';
  writeFileSync(target, data);
  return 'written';
}

async function main(): Promise<number> {
  const inter = FONTS.find((font) => font.file === 'Inter.ttf');
  if (!inter) {
    console.error('font: Inter.ttf is not pinned in scripts/lib/fonts.ts');
    return 1;
  }
  mkdirSync(outputDirectory, { recursive: true });

  let source: Uint8Array;
  let licence: Uint8Array;
  try {
    source = (await ensureFile(inter)).data;
    licence = (await ensureFile(INTER_LICENSE)).data;
  } catch (error) {
    console.error(`font: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const text = characters(LATIN) + characters(LATIN_EXT);
  // `opsz` is pinned to the family default, which is what Google Fonts serves for a `wght@100..900`
  // request and what the shell asks for (tokens.css declares `font-weight: 100 900` and nothing
  // optical). Keeping the axis would add 70 kB to a preloaded file, against the 07 §1 LCP target.
  const subset = await subsetFont(source, text, { targetFormat: 'woff2', variationAxes: { opsz: OPTICAL_SIZE } });

  const font = write('InterVariable.woff2', subset);
  const notice = write('Inter-OFL.txt', licence);
  const kib = (subset.byteLength / 1024).toFixed(1);
  console.log(`font: InterVariable.woff2 ${font} — ${kib} kB, SHA-256 ${sha256(subset)}`);
  console.log(`font: Inter-OFL.txt ${notice}`);
  console.log(`font: source Inter.ttf ${(source.byteLength / 1024).toFixed(1)} kB, subset to Latin + Latin Extended`);
  return 0;
}

process.exitCode = await main();
