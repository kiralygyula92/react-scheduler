// SPDX-License-Identifier: MIT
// License policy (docs pack 09 §3.2, Feature Dossier 09 §8, docs/adr/0001-toolchain.md).

type Expr = { kind: 'id'; id: string } | { kind: 'and' | 'or'; left: Expr; right: Expr };

function tokenize(expression: string): string[] {
  return expression
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/** Parses an SPDX expression (`AND`, `OR`, `WITH`, parentheses). `AND` binds tighter than `OR`. */
export function parseSpdx(expression: string): Expr {
  const tokens = tokenize(expression);
  let position = 0;
  const peek = (): string | undefined => tokens[position];
  const next = (): string => {
    const token = tokens[position++];
    if (token === undefined) throw new Error(`Unexpected end of license expression: ${expression}`);
    return token;
  };
  const primary = (): Expr => {
    const token = next();
    if (token === '(') {
      const inner = or();
      if (next() !== ')') throw new Error(`Missing ")" in license expression: ${expression}`);
      return inner;
    }
    // "X WITH exception" is judged by its base license X.
    if (peek()?.toUpperCase() === 'WITH') {
      next();
      next();
    }
    return { kind: 'id', id: token };
  };
  const and = (): Expr => {
    let left = primary();
    while (peek()?.toUpperCase() === 'AND') {
      next();
      left = { kind: 'and', left, right: primary() };
    }
    return left;
  };
  const or = (): Expr => {
    let left = and();
    while (peek()?.toUpperCase() === 'OR') {
      next();
      left = { kind: 'or', left, right: and() };
    }
    return left;
  };
  const result = or();
  if (position !== tokens.length)
    throw new Error(`Unexpected "${tokens[position]}" in license expression: ${expression}`);
  return result;
}

/** True when the expression can be satisfied with licenses from `allowed` (OR = any, AND = all). */
export function isLicenseAllowed(expression: string, allowed: readonly string[]): boolean {
  const allowedIds = new Set(allowed.map((id) => id.toLowerCase()));
  let tree: Expr;
  try {
    tree = parseSpdx(expression);
  } catch {
    return false;
  }
  const evaluate = (node: Expr): boolean => {
    if (node.kind === 'id') return allowedIds.has(node.id.replace(/\+$/, '').toLowerCase());
    return node.kind === 'and'
      ? evaluate(node.left) && evaluate(node.right)
      : evaluate(node.left) || evaluate(node.right);
  };
  return evaluate(tree);
}

export interface DevException {
  /** Package name; a trailing `*` matches a prefix (`@csstools/*`, `lightningcss*`). */
  package: string;
  license: string;
  via: string;
}

export interface LicensePolicy {
  allowed: readonly string[];
  devExceptions: readonly DevException[];
}

export interface InstalledPackage {
  name: string;
  license: string;
  versions: readonly string[];
}

export interface LicenseReport {
  violations: string[];
  excepted: string[];
  unusedExceptions: string[];
}

function matchesPackage(pattern: string, name: string): boolean {
  return pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : pattern === name;
}

/**
 * Production packages must be allowlisted outright. Development packages may also match a
 * named exception with exactly the same license.
 */
export function checkLicenses(
  all: readonly InstalledPackage[],
  production: readonly InstalledPackage[],
  policy: LicensePolicy,
): LicenseReport {
  const report: LicenseReport = { violations: [], excepted: [], unusedExceptions: [] };
  const productionNames = new Set(production.map((pkg) => pkg.name));
  const usedExceptions = new Set<DevException>();

  for (const pkg of production) {
    if (!isLicenseAllowed(pkg.license, policy.allowed)) {
      report.violations.push(`${pkg.name}@${pkg.versions.join(',')} (${pkg.license}) is a production dependency`);
    }
  }
  for (const pkg of all) {
    if (productionNames.has(pkg.name) || isLicenseAllowed(pkg.license, policy.allowed)) continue;
    const exception = policy.devExceptions.find(
      (candidate) => matchesPackage(candidate.package, pkg.name) && candidate.license === pkg.license,
    );
    if (exception) {
      usedExceptions.add(exception);
      report.excepted.push(`${pkg.name} (${pkg.license}) via ${exception.via}`);
    } else {
      report.violations.push(`${pkg.name}@${pkg.versions.join(',')} (${pkg.license}) is not allowlisted`);
    }
  }
  for (const exception of policy.devExceptions) {
    if (!usedExceptions.has(exception)) report.unusedExceptions.push(`${exception.package} (${exception.license})`);
  }
  return report;
}

/** Flattens `pnpm licenses list --json` output (`{ [license]: [{ name, versions, … }] }`). */
export function parsePnpmLicenses(output: string): InstalledPackage[] {
  const trimmed = output.trim();
  if (!trimmed.startsWith('{')) return [];
  const byLicense = JSON.parse(trimmed) as Record<string, { name: string; versions: string[]; license?: string }[]>;
  const packages: InstalledPackage[] = [];
  for (const [license, entries] of Object.entries(byLicense)) {
    for (const entry of entries)
      packages.push({ name: entry.name, license: entry.license ?? license, versions: entry.versions });
  }
  return packages;
}

export interface Manifest {
  name?: string;
  license?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/** Rules for publishable packages under `packages/` (docs pack 09 §3.1, Dossier 03 §4). */
export function checkPackageManifest(manifest: Manifest, allowedPeers: readonly string[]): string[] {
  const problems: string[] = [];
  const name = manifest.name ?? '(unnamed)';
  if (manifest.license !== 'MIT') problems.push(`${name}: "license" must be "MIT"`);
  const dependencies = Object.keys(manifest.dependencies ?? {});
  if (dependencies.length > 0) problems.push(`${name}: "dependencies" must be empty, found ${dependencies.join(', ')}`);
  for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
    if (!allowedPeers.includes(peer)) problems.push(`${name}: peer dependency "${peer}" is not approved`);
  }
  return problems;
}
