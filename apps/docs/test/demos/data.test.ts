// SPDX-License-Identifier: MIT
// The demos' sample data (Feature Dossier 08 §4). What matters here is that it is deterministic —
// a prerendered demo and its hydrated copy must agree — and that every field it invents stays
// inside the shape the package documents.
import { describe, expect, it } from 'vitest';
import { createSampleItems } from '~/demos/_shared/data';

const TITLES = ['Delivery delay', 'Staff briefing', 'Inventory count'];
const LEVELS = ['critical', 'watch', 'resolved'];
const START = new Date(2031, 2, 11, 6).getTime();

function sample(
  overrides: Partial<Parameters<typeof createSampleItems>[0]> = {},
): ReturnType<typeof createSampleItems> {
  return createSampleItems({ count: 12, start: START, hours: 8, levels: LEVELS, titles: TITLES, ...overrides });
}

describe('createSampleItems', () => {
  it('gives the same day for the same seed', () => {
    expect(sample({ seed: 3 })).toEqual(sample({ seed: 3 }));
    expect(sample({ seed: 3 })).not.toEqual(sample({ seed: 4 }));
  });

  it('stays inside the range it was given, on a quarter-hour grid', () => {
    for (const item of sample()) {
      const start = Number(item.start);
      expect(start).toBeGreaterThanOrEqual(START);
      expect(start).toBeLessThan(START + 8 * 3_600_000);
      expect((start - START) % (15 * 60_000)).toBe(0);
    }
  });

  it('returns the items in start order', () => {
    const starts = sample().map((item) => Number(item.start));
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('leaves some items open-ended, as the package handles', () => {
    const items = sample({ count: 60 });
    const open = items.filter((item) => item.end === undefined);
    expect(open.length).toBeGreaterThan(0);
    expect(open.length).toBeLessThan(items.length);
  });

  it('repeats the vocabulary with a number rather than inventing words', () => {
    const titles = sample({ count: 6 }).map((item) => item.title);
    expect(titles.every((title) => TITLES.some((word) => title.startsWith(word)))).toBe(true);
    expect(titles.some((title) => /\s2$/.test(title))).toBe(true);
  });

  it('adds only the optional fields it is asked for', () => {
    const plain = sample();
    expect(plain.every((item) => item.reference === undefined && item.tags === undefined)).toBe(true);
    const rich = sample({
      withReferences: true,
      withTags: true,
      tags: ['carriedOver'],
      describe: (t) => `About ${t}.`,
    });
    expect(rich.every((item) => /^\d{4}$/.test(item.reference ?? ''))).toBe(true);
    expect(rich.every((item) => item.description?.startsWith('About ') === true)).toBe(true);
    expect(rich.some((item) => item.tags?.[0] === 'carriedOver')).toBe(true);
  });

  it('clusters the starts when asked to crowd the day', () => {
    const spread = new Set(sample({ count: 40, overlapDensity: 0 }).map((item) => Number(item.start))).size;
    const crowded = new Set(sample({ count: 40, overlapDensity: 0.9 }).map((item) => Number(item.start))).size;
    expect(crowded).toBeLessThan(spread);
  });
});
