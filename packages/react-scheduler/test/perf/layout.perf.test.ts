import { describe, expect, it } from 'vitest';
import { computeTimelineLayout } from '../../src/core/layout';
import type { SchedulerItem, TimelineLayoutOptions } from '../../src/core/types';
import { generateItems } from '../support/generate';
import { fixture, parityLayoutOptions } from '../parity/adapter';

// Performance budgets (Feature Dossier 09 §3): 240 items ≤ 8 ms, 1 000 items ≤ 40 ms (unthrottled).
function medianMs(items: readonly SchedulerItem[], options: TimelineLayoutOptions<SchedulerItem>, runs = 25): number {
  for (let warmup = 0; warmup < 5; warmup++) computeTimelineLayout(items, options);
  const samples: number[] = [];
  for (let run = 0; run < runs; run++) {
    const started = performance.now();
    computeTimelineLayout(items, options);
    samples.push(performance.now() - started);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? Infinity;
}

describe('computeTimelineLayout performance', () => {
  it('[B-11] lays out the 240-item fixture within 8 ms (source: ~290 ms)', () => {
    const { items, date } = fixture('large');
    for (const compact of [false, true]) {
      const median = medianMs(items, parityLayoutOptions(date, compact));
      expect(median, `median ${median.toFixed(2)} ms`).toBeLessThanOrEqual(8);
    }
  });

  it('[B-11] lays out 1 000 items within 40 ms', () => {
    const options = parityLayoutOptions('2031-03-12T10:30:00', false);
    const items = generateItems(1000, options.rangeStart, 36);
    const median = medianMs(items, options, 11);
    expect(median, `median ${median.toFixed(2)} ms`).toBeLessThanOrEqual(40);
  });
});
