// SPDX-License-Identifier: MIT
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Directories never scanned in any mode: VCS data and installed dependencies. */
export const ALWAYS_EXCLUDED_DIRS: ReadonlySet<string> = new Set(['.git', 'node_modules', '.pnpm-store']);

/** Repository mode also skips build and test output, which is generated from scanned sources. */
export const EXCLUDED_DIRS: ReadonlySet<string> = new Set([
  ...ALWAYS_EXCLUDED_DIRS,
  'dist',
  'build',
  'coverage',
  '.react-router',
  'test-results',
  'playwright-report',
  'blob-report',
  '.turbo',
]);

const EXCLUDED_FILE_SUFFIXES: readonly string[] = ['.tsbuildinfo'];

const BINARY_EXTENSIONS: ReadonlySet<string> = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'ico',
  'bmp',
  'tif',
  'tiff',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'pdf',
  'zip',
  'gz',
  'tgz',
  'br',
  'wasm',
  'mp4',
  'webm',
  'mp3',
  'ogg',
]);

export interface RepoFile {
  /** Path relative to the scan root, with forward slashes. */
  path: string;
  absolutePath: string;
}

/** Lists every file under `root`, skipping `excludedDirs` by name. Sorted for stable output. */
export function listFiles(root: string, excludedDirs: ReadonlySet<string> = EXCLUDED_DIRS): RepoFile[] {
  const files: RepoFile[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolutePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!excludedDirs.has(entry.name)) walk(absolutePath);
      } else if (entry.isFile() || (entry.isSymbolicLink() && statSync(absolutePath).isFile())) {
        if (EXCLUDED_FILE_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) continue;
        files.push({ path: relative(root, absolutePath).split(sep).join('/'), absolutePath });
      }
    }
  };
  walk(root);
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** A file is binary when its extension says so or its first 8 000 bytes contain a NUL byte. */
export function isBinary(path: string, content: Buffer): boolean {
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  if (BINARY_EXTENSIONS.has(extension)) return true;
  return content.subarray(0, 8000).includes(0);
}

export function readFile(file: RepoFile): Buffer {
  return readFileSync(file.absolutePath);
}
