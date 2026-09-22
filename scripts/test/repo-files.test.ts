import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ALWAYS_EXCLUDED_DIRS, isBinary, listFiles } from '../lib/repo-files.ts';

describe('isBinary', () => {
  it('detects binary files by extension or NUL bytes', () => {
    expect(isBinary('a.PNG', Buffer.from('text'))).toBe(true);
    expect(isBinary('a.bin', Buffer.from([0x41, 0, 0x42]))).toBe(true);
    expect(isBinary('a.md', Buffer.from('plain text'))).toBe(false);
  });
});

describe('listFiles', () => {
  const root = mkdtempSync(join(tmpdir(), 'repo-files-'));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('lists files with forward slashes, sorted, skipping dependencies and build output', () => {
    for (const dir of ['src', 'node_modules/x', 'packages/p/dist', '.git', 'spec'])
      mkdirSync(join(root, dir), { recursive: true });
    for (const file of [
      'src/b.ts',
      'src/a.ts',
      'node_modules/x/i.js',
      'packages/p/dist/i.js',
      '.git/HEAD',
      'spec/s.md',
      'x.tsbuildinfo',
    ]) {
      writeFileSync(join(root, file), 'x');
    }
    expect(listFiles(root).map((file) => file.path)).toEqual(['spec/s.md', 'src/a.ts', 'src/b.ts']);
  });

  it('keeps build output when only VCS data and dependencies are excluded (tarball mode)', () => {
    expect(listFiles(root, ALWAYS_EXCLUDED_DIRS).map((file) => file.path)).toContain('packages/p/dist/i.js');
  });
});
