// SPDX-License-Identifier: MIT
// Usage:
//   node scripts/check-zero-reference.ts              scan the whole repository (including spec/)
//   node scripts/check-zero-reference.ts --dir <path> scan another directory (e.g. an unpacked tarball)
//   git log --format=%B <range> | node scripts/check-zero-reference.ts --stdin   scan commit messages
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALWAYS_EXCLUDED_DIRS, isBinary, listFiles, readFile } from './lib/repo-files.ts';
import { type FileFinding, parseDenylist, scanFile, type ZeroReferenceConfig } from './lib/zero-reference.ts';

const repoRoot = resolve(import.meta.dirname, '..');

interface ConfigFile {
  salt: string;
  denylistPath: string;
  allowedEmailDomains: string[];
  allowedEmails: string[];
  allowedHosts: string[];
}

function loadConfig(): ZeroReferenceConfig {
  const file = JSON.parse(readFileSync(resolve(repoRoot, 'scripts/zero-reference.config.json'), 'utf8')) as ConfigFile;
  return {
    salt: file.salt,
    denylist: parseDenylist(readFileSync(resolve(repoRoot, file.denylistPath), 'utf8')),
    allowedEmailDomains: file.allowedEmailDomains,
    allowedEmails: file.allowedEmails,
    allowedHosts: file.allowedHosts,
  };
}

function readStdin(): Buffer {
  return readFileSync(0);
}

function main(argv: readonly string[]): number {
  const config = loadConfig();
  const findings: FileFinding[] = [];
  let scanned = 0;

  if (argv.includes('--stdin')) {
    findings.push(...scanFile({ path: '<stdin>', content: readStdin(), binary: false }, config));
    scanned = 1;
  } else {
    const dirFlag = argv.indexOf('--dir');
    const dir = dirFlag >= 0 ? argv[dirFlag + 1] : undefined;
    if (dirFlag >= 0 && !dir) throw new Error('--dir needs a path');
    // A tarball's dist/ is exactly what gets published, so --dir mode keeps build output.
    const files = dir ? listFiles(resolve(dir), ALWAYS_EXCLUDED_DIRS) : listFiles(repoRoot);
    for (const file of files) {
      const content = readFile(file);
      findings.push(...scanFile({ path: file.path, content, binary: isBinary(file.path, content) }, config));
      scanned++;
    }
  }

  if (findings.length === 0) {
    console.log(`zero-reference: ${scanned} file(s) scanned, ${config.denylist.size} denylist hashes, 0 findings.`);
    return 0;
  }
  console.error(`zero-reference: ${findings.length} finding(s) in ${scanned} file(s) scanned:`);
  for (const finding of findings) {
    const where = finding.line > 0 ? `${finding.path}:${finding.line}` : finding.path;
    console.error(`  ${where}  [${finding.kind}] ${finding.detail}`);
  }
  console.error('Replace the concept with the Dossier naming-map term; never obfuscate it (docs pack 09 §8).');
  return 1;
}

process.exitCode = main(process.argv.slice(2));
