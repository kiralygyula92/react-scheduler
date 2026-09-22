// SPDX-License-Identifier: MIT
// The published tarball's file list (docs pack 09 §9, "npm pack --dry-run lists only intended
// files"): the build output, the README, the license text and the manifest, nothing else.

/** Paths a tarball may contain, relative to the package root. */
const ALLOWED: readonly RegExp[] = [/^dist\//, /^README\.md$/, /^LICENSE$/, /^package\.json$/];

export interface PackCheck {
  /** Files that are not meant to be published. */
  unexpected: string[];
  /** Files the package needs but the tarball lacks. */
  missing: string[];
}

/** Compares a tarball's paths with the allowed patterns and the required files. */
export function checkPackList(paths: readonly string[], required: readonly string[]): PackCheck {
  const present = new Set(paths);
  return {
    unexpected: paths.filter((path) => !ALLOWED.some((pattern) => pattern.test(path))).sort(),
    missing: required.filter((path) => !present.has(path)),
  };
}

/** The file paths of `npm pack --dry-run --json` output. */
export function parsePackJson(output: string): string[] {
  const parsed = JSON.parse(output) as { files?: { path: string }[] }[];
  return (parsed[0]?.files ?? []).map((file) => file.path.replace(/\\/g, '/'));
}
