// SPDX-License-Identifier: MIT
// The OFL font sources this repository pins, with the SHA-256 of every file. Two consumers:
// `fetch-fonts.ts` (the browser suite's visual checks, Feature Dossier 09 §4) and
// `build-site-font.ts` (the docs site's self-hosted subset, docs pack 07 §1).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Pinned commit of google/fonts. Every file below is verified against its hash after download. */
const COMMIT = 'e44c4b011a820c2cbe2fd2cfa8052037d7edb571';
const BASE = `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl`;

export interface PinnedFile {
  /** Name under `.cache/fonts/`. */
  readonly file: string;
  readonly source: string;
  readonly sha256: string;
}

export const FONTS: readonly PinnedFile[] = [
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
];

/** The licence that must travel with any copy or subset of Inter (OFL 1.1 §2). */
export const INTER_LICENSE: PinnedFile = {
  file: 'Inter-OFL.txt',
  source: `${BASE}/inter/OFL.txt`,
  sha256: '5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57',
};

const cacheDirectory = resolve(import.meta.dirname, '..', '..', '.cache', 'fonts');

export function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Returns the pinned file's bytes, downloading it into `.cache/fonts/` unless the cached copy
 * already matches the pinned hash. Throws when the download fails or the hash differs.
 */
export async function ensureFile(pinned: PinnedFile): Promise<{ data: Uint8Array; downloaded: boolean }> {
  mkdirSync(cacheDirectory, { recursive: true });
  const target = resolve(cacheDirectory, pinned.file);
  if (existsSync(target)) {
    const cached = readFileSync(target);
    if (sha256(cached) === pinned.sha256) return { data: cached, downloaded: false };
  }
  const response = await fetch(pinned.source);
  if (!response.ok) throw new Error(`${pinned.file}: HTTP ${response.status}`);
  const data = new Uint8Array(await response.arrayBuffer());
  const hash = sha256(data);
  if (hash !== pinned.sha256) {
    throw new Error(`${pinned.file}: SHA-256 ${hash} does not match the pinned ${pinned.sha256}`);
  }
  writeFileSync(target, data);
  return { data, downloaded: true };
}
