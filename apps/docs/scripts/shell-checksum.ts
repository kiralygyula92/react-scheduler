// SPDX-License-Identifier: MIT
// Prints the checksum of `src/shell/` and `src/i18n/` (docs pack 11 README). After the user
// approves the shell, the output is written to
// `spec/docs-pack/11-docs-shell-reference/SHELL_CHECKSUM` in the master copy of the pack, and from
// then on conformance check C8 compares every plugin site against it.
//
// Usage: node scripts/shell-checksum.ts
import { shellChecksum } from './lib/shell.ts';

console.log(shellChecksum());
