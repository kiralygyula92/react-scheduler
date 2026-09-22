import { describe, expect, it } from 'vitest';

// Feature Dossier 05 F-27: the core entry imports in a plain Node environment (no DOM globals, no
// React) and exposes exactly the functions of 04 §8.
describe('entries', () => {
  it('imports the core entry without a DOM and exposes the 04 §8 functions', async () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    const core = await import('../../src/core');
    expect(Object.keys(core).sort()).toEqual(
      [
        'bucketItems',
        'compareByPlacement',
        'computeTimelineLayout',
        'createFormatters',
        'getShiftWindows',
        'interpolate',
        'pageList',
        'resolveEnd',
        'resolveLevels',
        'resolveShift',
        'resolveTimeLabel',
        'sortOverflowItems',
        'toMs',
      ].sort(),
    );
  });

  it('imports the DOM engines entry without touching globals at import time', async () => {
    const dom = await import('../../src/dom');
    expect(Object.keys(dom).sort()).toEqual([
      'compensateStickyGrowth',
      'createNavigator',
      'createPinEngine',
      'observeCompact',
      'observeWidth',
      'prefersReducedMotion',
    ]);
  });

  it('exposes the classic definitions and the default strings from the main entry', async () => {
    const main = await import('../../src/index');
    expect(Object.keys(main).sort()).toEqual(['CARRIED_OVER_TAG', 'classicLevels', 'classicTags', 'enUS']);
  });
});
