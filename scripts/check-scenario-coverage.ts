// SPDX-License-Identifier: MIT
// Usage:
//   node scripts/check-scenario-coverage.ts                       report only (exit 0)
//   node scripts/check-scenario-coverage.ts --enforce             fail on any missing scenario
//   node scripts/check-scenario-coverage.ts --enforce=unit,dom    fail only for these layers
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { listFiles, readFile } from './lib/repo-files.ts';
import { coverage, findTestTitles, parseScenarios } from './lib/scenarios.ts';

const repoRoot = resolve(import.meta.dirname, '..');
const SCENARIOS = 'spec/feature-dossier/characterization/scenarios.json';
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

function main(argv: readonly string[]): number {
  const scenarios = parseScenarios(readFileSync(resolve(repoRoot, SCENARIOS), 'utf8'));
  const titles = new Map<string, string[]>();
  for (const file of listFiles(repoRoot)) {
    // The gate scripts' own tests use made-up ids; spec/ holds no tests.
    if (!TEST_FILE.test(file.path) || file.path.startsWith('scripts/') || file.path.startsWith('spec/')) continue;
    for (const [id, found] of findTestTitles(readFile(file).toString('utf8'))) {
      titles.set(id, [...(titles.get(id) ?? []), ...found]);
    }
  }
  const report = coverage(scenarios, titles);

  console.log(`scenarios: ${report.covered.length}/${scenarios.length} covered, ${report.missing.length} missing.`);
  const byLayer = new Map<string, string[]>();
  for (const scenario of report.missing)
    byLayer.set(scenario.layer, [...(byLayer.get(scenario.layer) ?? []), scenario.id]);
  for (const [layer, ids] of byLayer) console.log(`  missing (${layer}, ${ids.length}): ${ids.join(' ')}`);
  for (const id of report.bugTitleMissing)
    console.log(`  [${id}] is tagged "bug" but no test title carries "fixed: B-nn"`);

  const enforceFlag = argv.find((arg) => arg === '--enforce' || arg.startsWith('--enforce='));
  if (!enforceFlag) return 0;
  const layers = enforceFlag.includes('=') ? new Set(enforceFlag.slice('--enforce='.length).split(',')) : null;
  const enforcedMissing = report.missing.filter((scenario) => !layers || layers.has(scenario.layer));
  const enforcedBugTitles = report.bugTitleMissing.filter((id) => {
    const layer = scenarios.find((scenario) => scenario.id === id)?.layer ?? '';
    return !layers || layers.has(layer);
  });
  return enforcedMissing.length + enforcedBugTitles.length === 0 ? 0 : 1;
}

process.exitCode = main(process.argv.slice(2));
