// SPDX-License-Identifier: MIT
// The checksum that keeps every plugin site's shell identical (docs pack 11 README): a hash over
// `src/shell/` and `src/i18n/`, file by file in a stable order, contents included.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const src = resolve(import.meta.dirname, '..', '..', 'src');

function filesOf(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) found.push(...filesOf(path));
    else found.push(path);
  }
  return found;
}

export function shellChecksum(): string {
  const hash = createHash('sha256');
  const files = [...filesOf(resolve(src, 'shell')), ...filesOf(resolve(src, 'i18n'))]
    .map((file) => relative(src, file).split('\\').join('/'))
    .sort();
  for (const file of files) {
    hash.update(file);
    hash.update(readFileSync(resolve(src, file)));
  }
  return hash.digest('hex');
}
