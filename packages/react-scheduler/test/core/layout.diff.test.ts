import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { classicLevels, resolveLevels } from '../../src/core/levels';
import { computeTimelineLayout } from '../../src/core/layout';
import type { SchedulerItem, TimelineLayoutOptions } from '../../src/core/types';
import { referenceLayout } from '../support/reference-layout';

// Differential test: the optimized engine equals the naive transcription of 01 §T.5 on random input,
// under every option combination, including zero-length and end-before-start items.
const MINUTE = 60_000;
const RANGE_START = new Date(2031, 2, 11, 20).getTime();
const levels = [...classicLevels.map((level) => level.key), 'unknown'];

const itemsArbitrary = fc
  .array(
    fc.record({
      slot: fc.integer({ min: 0, max: 36 * 4 - 1 }),
      duration: fc.option(fc.constantFrom(0, -30, 15, 30, 45, 60, 90, 120, 240, 600), { nil: undefined }),
      level: fc.constantFrom(...levels),
    }),
    { maxLength: 30 },
  )
  .map((records) =>
    records.map(({ slot, duration, level }, index): SchedulerItem => {
      const start = RANGE_START + slot * 15 * MINUTE;
      const item: SchedulerItem = { id: `i${String(index).padStart(2, '0')}`, start, level, title: `Item ${index}` };
      if (duration !== undefined) item.end = start + duration * MINUTE;
      return item;
    }),
  );

const optionsArbitrary = fc.record({
  compact: fc.boolean(),
  columnPlacement: fc.constantFrom('priority' as const, 'time' as const),
  maxColumns: fc.integer({ min: 1, max: 4 }),
  maxColumnsCrowded: fc.integer({ min: 1, max: 4 }),
  maxColumnsCompact: fc.integer({ min: 1, max: 3 }),
  overflowMergeWindow: fc.constantFrom(0, 30 * MINUTE, 120 * MINUTE, Infinity),
  reverseIds: fc.boolean(),
});

type Extra = typeof optionsArbitrary extends fc.Arbitrary<infer T> ? T : never;

function options(extra: Extra): TimelineLayoutOptions<SchedulerItem> {
  const { reverseIds, ...rest } = extra;
  const result: TimelineLayoutOptions<SchedulerItem> = {
    rangeStart: RANGE_START,
    rangeEnd: RANGE_START + 36 * 60 * MINUTE,
    levels: resolveLevels(classicLevels),
    hourHeight: 172,
    minCardHeight: 80,
    cardGap: 4,
    defaultDuration: 120 * MINUTE,
    ...rest,
  };
  if (reverseIds) result.compareItems = (a, b) => b.id.localeCompare(a.id);
  return result;
}

describe('computeTimelineLayout (differential)', () => {
  it('equals the reference transcription of 01 §T.5 on random input', () => {
    fc.assert(
      fc.property(itemsArbitrary, optionsArbitrary, (items, extra) => {
        const layoutOptions = options(extra);
        const layout = computeTimelineLayout(items, layoutOptions);
        const reference = referenceLayout(items, layoutOptions);
        expect(
          layout.cards.map((card) => ({
            id: card.item.id,
            column: card.column,
            columns: card.columns,
            top: card.top,
            height: card.height,
          })),
        ).toEqual(reference.placed);
        expect(
          layout.overflow.map((group) => ({ anchor: group.anchor, ids: group.items.map((item) => item.id) })),
        ).toEqual(reference.overflow);
      }),
      { numRuns: 400 },
    );
  });

  // A zero-length item covers no instant (half-open intervals), so it can sit in a column its own
  // start does not count; such cards are excluded (documented in docs/adr/0002-core-engine.md).
  it('keeps every card of positive duration inside its column count when the cap is constant', () => {
    fc.assert(
      fc.property(itemsArbitrary, (items) => {
        const layout = computeTimelineLayout(
          items,
          options({
            compact: false,
            columnPlacement: 'priority',
            maxColumns: 3,
            maxColumnsCrowded: 3,
            maxColumnsCompact: 1,
            overflowMergeWindow: 120 * MINUTE,
            reverseIds: false,
          }),
        );
        for (const card of layout.cards.filter((c) => c.end > c.start)) expect(card.column).toBeLessThan(card.columns);
      }),
      { numRuns: 300 },
    );
  });
});
