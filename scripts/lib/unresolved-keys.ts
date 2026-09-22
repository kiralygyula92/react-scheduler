// SPDX-License-Identifier: MIT
// Project-dictionary keys (UPPER_SNAKE_CASE in double braces) are resolved at M0 and must not
// appear outside spec/. GitHub Actions expressions (`${{ … }}`) are not keys.

const KEY = /(?<!\$)\{\{([A-Z][A-Z0-9_]*)\}\}/g;

export interface KeyFinding {
  line: number;
  key: string;
}

/** Line ranges (1-based, inclusive) of the "## Project dictionary" section of AGENTS.md. */
function dictionarySection(lines: readonly string[]): { from: number; to: number } | null {
  const start = lines.findIndex((line) => /^##\s+Project dictionary\s*$/.test(line));
  if (start < 0) return null;
  const end = lines.findIndex((line, index) => index > start && /^##\s/.test(line));
  return { from: start + 1, to: end < 0 ? lines.length : end };
}

export function findUnresolvedKeys(path: string, text: string): KeyFinding[] {
  const lines = text.split('\n');
  const allowed = path === 'AGENTS.md' ? dictionarySection(lines) : null;
  const findings: KeyFinding[] = [];
  lines.forEach((content, index) => {
    const line = index + 1;
    if (allowed && line >= allowed.from && line <= allowed.to) return;
    for (const match of content.matchAll(KEY)) findings.push({ line, key: match[1] ?? '' });
  });
  return findings;
}
