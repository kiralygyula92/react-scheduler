// SPDX-License-Identifier: MIT
// Usage: node scripts/check-unresolved-keys.ts
// Fails when a project-dictionary key is left unresolved outside spec/ (Template Prompt 2, M0 gate).
import { resolve } from 'node:path';
import { isBinary, listFiles, readFile } from './lib/repo-files.ts';
import { findUnresolvedKeys } from './lib/unresolved-keys.ts';

const repoRoot = resolve(import.meta.dirname, '..');

function main(): number {
  const problems: string[] = [];
  let scanned = 0;
  for (const file of listFiles(repoRoot)) {
    if (file.path.startsWith('spec/')) continue;
    const content = readFile(file);
    if (isBinary(file.path, content)) continue;
    scanned++;
    for (const finding of findUnresolvedKeys(file.path, content.toString('utf8'))) {
      problems.push(`${file.path}:${finding.line}  ${finding.key}`);
    }
  }
  if (problems.length === 0) {
    console.log(`keys: ${scanned} file(s) outside spec/ scanned, no unresolved key.`);
    return 0;
  }
  console.error(`keys: ${problems.length} unresolved key(s); resolve them from the Project dictionary in AGENTS.md:`);
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
}

process.exitCode = main();
