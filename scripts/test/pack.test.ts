import { describe, expect, it } from 'vitest';
import { checkPackList, parsePackJson } from '../lib/pack.ts';

describe('checkPackList', () => {
  it('accepts the build output, the README, the license text and the manifest', () => {
    const paths = ['package.json', 'README.md', 'LICENSE', 'dist/index.js', 'dist/locales/ro.d.ts'];
    expect(checkPackList(paths, ['dist/index.js'])).toEqual({ unexpected: [], missing: [] });
  });

  it('reports files that are not meant to be published and required files that are missing', () => {
    const paths = ['package.json', 'src/index.ts', 'dist/index.js', '.size-limit.js'];
    expect(checkPackList(paths, ['LICENSE', 'dist/index.js'])).toEqual({
      unexpected: ['.size-limit.js', 'src/index.ts'],
      missing: ['LICENSE'],
    });
  });
});

describe('parsePackJson', () => {
  it('reads the file paths of npm pack --json, with forward slashes', () => {
    const output = JSON.stringify([{ files: [{ path: 'dist\\index.js' }, { path: 'LICENSE' }] }]);
    expect(parsePackJson(output)).toEqual(['dist/index.js', 'LICENSE']);
  });
});
