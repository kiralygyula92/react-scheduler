import { describe, expect, it } from 'vitest';
import { computeTimelineLayout } from '../../src/core/layout';
import { referenceLayout } from '../support/reference-layout';
import { fixture, type GoldenLayout, localIso, loadJson, parityLayoutOptions, toGoldenShape } from './adapter';

// Engine parity (Feature Dossier 07 §1.2): computeTimelineLayout reproduces every golden file
// exactly; `large` runs with overflowMergeWindow: Infinity (B-10), every other file with defaults.
const GOLDEN_LAYOUTS = [
  'baseline-day-regular',
  'baseline-day-compact',
  'crowded-regular',
  'crowded-compact',
  'large-regular',
  'large-compact',
] as const;

describe('golden layouts', () => {
  it.each(GOLDEN_LAYOUTS)('%s is reproduced exactly', (name) => {
    const golden = loadJson<GoldenLayout>(`golden/layout-${name}.json`);
    const { items, date } = fixture(golden.fixture);
    const overrides = golden.fixture === 'large' ? { overflowMergeWindow: Infinity } : {};
    const options = parityLayoutOptions(date, golden.mode === 'compact', overrides);
    const expected = { rangeStart: golden.rangeStart, placed: golden.placed, overflow: golden.overflow };

    expect(toGoldenShape(computeTimelineLayout(items, options))).toEqual(expected);

    // The test oracle used by the differential test reproduces the goldens too.
    const reference = referenceLayout(items, options);
    expect({
      rangeStart: localIso(options.rangeStart),
      placed: reference.placed,
      overflow: reference.overflow.map((group) => ({ anchor: localIso(group.anchor), ids: group.ids })),
    }).toEqual(expected);
  });
});
