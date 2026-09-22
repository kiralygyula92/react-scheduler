// SPDX-License-Identifier: MIT
// Usage: node scripts/check-licenses.ts
// Fails on any production dependency outside the allowlist, any development dependency that is
// neither allowlisted nor a named exception, and any publishable package with runtime dependencies.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  checkLicenses,
  checkPackageManifest,
  type DevException,
  type Manifest,
  parsePnpmLicenses,
} from './lib/licenses.ts';

const repoRoot = resolve(import.meta.dirname, '..');

interface PolicyFile {
  allowed: string[];
  allowedPeers: string[];
  devExceptions: DevException[];
}

function pnpmLicenses(extraArgs: readonly string[]): string {
  // One command string: on Windows pnpm is a .cmd shim that needs a shell, and Node warns when
  // arguments are passed separately to a shell (DEP0190).
  const command = ['pnpm', 'licenses', 'list', '--json', '--recursive', ...extraArgs].join(' ');
  const result = spawnSync(command, { cwd: repoRoot, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`pnpm licenses list failed:\n${result.stderr}`);
  return result.stdout;
}

function main(): number {
  const policy = JSON.parse(readFileSync(join(repoRoot, 'scripts/licenses.config.json'), 'utf8')) as PolicyFile;
  const all = parsePnpmLicenses(pnpmLicenses([]));
  const production = parsePnpmLicenses(pnpmLicenses(['--prod']));
  const report = checkLicenses(all, production, policy);

  const manifestProblems: string[] = [];
  const packagesDir = join(repoRoot, 'packages');
  for (const dir of readdirSync(packagesDir)) {
    const manifestPath = join(packagesDir, dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
    if (manifest.private) continue;
    manifestProblems.push(...checkPackageManifest(manifest, policy.allowedPeers));
    if (!existsSync(join(packagesDir, dir, 'LICENSE')))
      manifestProblems.push(`${manifest.name ?? dir}: LICENSE file missing`);
  }

  console.log(`licenses: ${all.length} installed package(s), ${production.length} in production trees.`);
  if (report.excepted.length > 0) {
    console.log(`Development-only exceptions in use (docs/adr/0001-toolchain.md):`);
    for (const line of report.excepted) console.log(`  ${line}`);
  }
  for (const line of report.unusedExceptions)
    console.warn(`warning: unused exception ${line}; remove it from scripts/licenses.config.json`);

  const failures = [...report.violations, ...manifestProblems];
  if (failures.length === 0) {
    console.log('licenses: OK');
    return 0;
  }
  console.error(`licenses: ${failures.length} problem(s):`);
  for (const line of failures) console.error(`  ${line}`);
  return 1;
}

process.exitCode = main();
