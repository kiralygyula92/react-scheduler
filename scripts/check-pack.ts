// SPDX-License-Identifier: MIT
// Usage: node scripts/check-pack.ts   (after `pnpm --filter @react-schedulerkit/react-scheduler build`)
// Fails when the package tarball would contain anything besides dist/, README.md, LICENSE and
// package.json, or lacks a file that every entry point needs.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkPackList, parsePackJson } from './lib/pack.ts';

const packageDir = resolve(import.meta.dirname, '../packages/react-scheduler');

/** Every file an `exports` target names, with the literal wildcard left out. */
function exportTargets(): string[] {
  const manifest = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8')) as { exports: unknown };
  const targets: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') targets.push(value.replace(/^\.\//, ''));
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(manifest.exports);
  return targets.filter((target) => !target.includes('*'));
}

function main(): number {
  // One command string: on Windows npm is a .cmd shim that needs a shell (DEP0190).
  const result = spawnSync('npm pack --dry-run --json --ignore-scripts', {
    cwd: packageDir,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error(`npm pack failed:\n${result.stderr}`);
    return 1;
  }
  const paths = parsePackJson(result.stdout);
  const { unexpected, missing } = checkPackList(paths, ['README.md', 'LICENSE', 'package.json', ...exportTargets()]);
  console.log(`pack: ${paths.length} file(s) in the tarball.`);
  if (unexpected.length === 0 && missing.length === 0) {
    console.log('pack: OK');
    return 0;
  }
  for (const path of unexpected) console.error(`  not meant to be published: ${path}`);
  for (const path of missing) console.error(`  missing: ${path}`);
  return 1;
}

process.exitCode = main();
