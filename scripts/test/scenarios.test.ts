import { describe, expect, it } from 'vitest';
import { coverage, findTestTitles, parseScenarios, type Scenario } from '../lib/scenarios.ts';

// Made-up ids, so these samples never count towards real scenario coverage.
const scenarios: Scenario[] = [
  { id: 'X-01', title: 'ordering', tags: ['core'], layer: 'unit' },
  { id: 'X-02', title: 'dst', tags: ['bug'], layer: 'unit' },
  { id: 'XB-01', title: 'pinning', tags: [], layer: 'browser' },
];

describe('parseScenarios', () => {
  it('reads the scenarios array', () => {
    expect(parseScenarios(JSON.stringify({ version: 1, scenarios }))).toEqual(scenarios);
  });
});

describe('findTestTitles', () => {
  it('collects "[ID] …" titles from test sources', () => {
    const source = [
      `it('[X-01] placement order', () => {});`,
      `test("[X-02] night window (fixed: B-07)", fn);`,
      `it('no id', fn)`,
    ].join('\n');
    expect(findTestTitles(source)).toEqual(
      new Map([
        ['X-01', ['[X-01] placement order']],
        ['X-02', ['[X-02] night window (fixed: B-07)']],
      ]),
    );
  });
});

describe('coverage', () => {
  it('lists missing scenarios and bug scenarios without a fixed note', () => {
    const report = coverage(
      scenarios,
      new Map([
        ['X-01', ['[X-01] a']],
        ['X-02', ['[X-02] b']],
      ]),
    );
    expect(report.covered).toEqual(['X-01', 'X-02']);
    expect(report.missing.map((scenario) => scenario.id)).toEqual(['XB-01']);
    expect(report.bugTitleMissing).toEqual(['X-02']);
  });

  it('accepts a bug scenario whose test carries the fixed note', () => {
    const report = coverage(scenarios, new Map([['X-02', ['[X-02] b (fixed: B-07)']]]));
    expect(report.bugTitleMissing).toEqual([]);
  });
});
