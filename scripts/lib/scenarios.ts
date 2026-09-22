// SPDX-License-Identifier: MIT
// Scenario coverage rule (Feature Dossier 09 §1.1): every scenario id maps to a test whose title
// starts with "[ID]"; tests for bug-tagged scenarios carry "fixed: B-nn" in their title.

export interface Scenario {
  id: string;
  title: string;
  tags: readonly string[];
  layer: string;
}

export function parseScenarios(json: string): Scenario[] {
  const data = JSON.parse(json) as { scenarios: Scenario[] };
  return data.scenarios;
}

const TEST_TITLE = /['"`]\[([A-Za-z0-9-]+)\]\s([^'"`\n]*)['"`]/g;

/** Test titles of the form "[ID] …" found in a test source file, keyed by id. */
export function findTestTitles(source: string): Map<string, string[]> {
  const titles = new Map<string, string[]>();
  for (const match of source.matchAll(TEST_TITLE)) {
    const id = match[1] ?? '';
    const list = titles.get(id) ?? [];
    list.push(`[${id}] ${match[2] ?? ''}`);
    titles.set(id, list);
  }
  return titles;
}

const CORE_TITLE = /['"`]\[([A-Za-z0-9-]+)\/core\]\s/g;

/**
 * Ids with "[ID/core] …" tests: rules of a DOM or browser scenario checked without rendering. They
 * are reported separately and never count as scenario coverage.
 */
export function findCoreTitles(source: string): Set<string> {
  return new Set([...source.matchAll(CORE_TITLE)].map((match) => match[1] ?? ''));
}

export interface CoverageReport {
  covered: string[];
  missing: Scenario[];
  /** Bug-tagged scenarios whose tests lack a "fixed: B-nn" note. */
  bugTitleMissing: string[];
}

export function coverage(
  scenarios: readonly Scenario[],
  titles: ReadonlyMap<string, readonly string[]>,
): CoverageReport {
  const report: CoverageReport = { covered: [], missing: [], bugTitleMissing: [] };
  for (const scenario of scenarios) {
    const found = titles.get(scenario.id);
    if (!found || found.length === 0) {
      report.missing.push(scenario);
      continue;
    }
    report.covered.push(scenario.id);
    if (scenario.tags.includes('bug') && !found.some((title) => /fixed: B-\d{2}/.test(title))) {
      report.bugTitleMissing.push(scenario.id);
    }
  }
  return report;
}
