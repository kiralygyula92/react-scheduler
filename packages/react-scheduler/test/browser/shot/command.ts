// Node side of the screenshot comparison: decodes the captured screenshot and the characterization
// reference, compares them with the 09 §4 tolerance and writes the capture and a diff image to
// test-results/shot/ for review. References are read only, never updated (09 §4).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BrowserCommand } from 'vitest/node';
import { diffImages, type Rect } from './diff';
import { decodePng, encodePng, type Image } from './png';

const repoRoot = resolve(import.meta.dirname, '../../../../..');
const references = resolve(repoRoot, 'spec/feature-dossier/characterization/screenshots');
const output = resolve(import.meta.dirname, '../../../test-results/shot');

export interface ScreenshotComparison {
  name: string;
  compared: number;
  different: number;
  ratio: number;
  diff: string;
}

export const compareScreenshot: BrowserCommand<[{ name: string; base64: string; masks: Rect[] }]> = (
  _context,
  { name, base64, masks },
): ScreenshotComparison => {
  mkdirSync(output, { recursive: true });
  const captured = Buffer.from(base64, 'base64');
  writeFileSync(resolve(output, `${name}.actual.png`), captured);
  const result = diffImages(decodePng(captured), decodePng(readFileSync(resolve(references, `${name}.png`))), masks);
  const diff = resolve(output, `${name}.diff.png`);
  writeFileSync(diff, encodePng(result.image));
  const comparison = { name, compared: result.compared, different: result.different, ratio: result.ratio, diff };
  writeFileSync(resolve(output, `${name}.json`), `${JSON.stringify(comparison, null, 2)}\n`);
  return comparison;
};

/**
 * Whether screenshot parity is enforced here. The references match Windows Chromium (eleven of them
 * pixel for pixel), so Windows enforces; RS_SHOT=1 enforces anywhere.
 */
export const screenshotEnvironment: BrowserCommand<[]> = () => ({
  platform: process.platform,
  enforce: process.platform === 'win32' || process.env['RS_SHOT'] === '1',
});

/** Mirrors an image horizontally. */
function flip(image: Image): Image {
  const data = new Uint8Array(image.data.length);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const from = (y * image.width + x) * 4;
      const to = (y * image.width + (image.width - 1 - x)) * 4;
      data.set(image.data.subarray(from, from + 4), to);
    }
  }
  return { width: image.width, height: image.height, data };
}

/**
 * RTL against LTR (Feature Dossier 05 F-29, "checked by flipping"): the RTL capture, mirrored, is
 * compared with the LTR capture at the 09 §4 tolerance; all three images are written for review.
 */
export const compareMirrored: BrowserCommand<[{ name: string; ltr: string; rtl: string }]> = (
  _context,
  { name, ltr, rtl },
): ScreenshotComparison => {
  mkdirSync(output, { recursive: true });
  const left = Buffer.from(ltr, 'base64');
  const right = Buffer.from(rtl, 'base64');
  writeFileSync(resolve(output, `${name}.ltr.png`), left);
  writeFileSync(resolve(output, `${name}.rtl.png`), right);
  const result = diffImages(flip(decodePng(right)), decodePng(left), []);
  const diff = resolve(output, `${name}.diff.png`);
  writeFileSync(diff, encodePng(result.image));
  return { name, compared: result.compared, different: result.different, ratio: result.ratio, diff };
};
