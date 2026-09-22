// SPDX-License-Identifier: MIT
'use strict';

// typescript-eslint needs the TypeScript compiler API (peer range >=4.8.4 <6.1.0), which
// TypeScript 7 does not ship. pnpm resolves peers from the workspace root (TypeScript 7), so
// the peer is replaced by a direct TypeScript 6 dependency for these packages only.
// See docs/adr/0001-toolchain.md.
const TS_API = 'npm:typescript@6.0.3';

function needsTypeScriptApi(name) {
  return name === 'typescript-eslint' || name === 'ts-api-utils' || name.startsWith('@typescript-eslint/');
}

function readPackage(pkg) {
  if (needsTypeScriptApi(pkg.name) && pkg.peerDependencies && pkg.peerDependencies.typescript) {
    delete pkg.peerDependencies.typescript;
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript;
    pkg.dependencies = { ...pkg.dependencies, typescript: TS_API };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
