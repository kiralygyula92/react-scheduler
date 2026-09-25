import { describe, expect, it } from 'vitest';
import {
  listActiveIndex,
  listAtStart,
  listHeaderExpanded,
  listLandingTarget,
  listSectionTarget,
  listSectionVisible,
  type ListMetrics,
  scrollTopButtonVisible,
} from '../../src/core/list';
import { listDefaults } from '../../src/core/options';

// Injected layout of LV-14: sticky 64, client 600, scroll 3000; sections at 0 / 600 / 2200 with 60 px
// headers; current cards at 660 + i·110, 100 px tall.
const metricsAt = (scrollTop: number): ListMetrics => ({
  scrollTop,
  clientHeight: 600,
  scrollHeight: 3000,
  stickyHeight: 64,
  sections: [
    { top: 0, headerHeight: 60 },
    { top: 600, headerHeight: 60 },
    { top: 2200, headerHeight: 60 },
  ],
});
const cards = [0, 1, 2, 3, 4].map((i) => ({
  top: 660 + i * 110,
  height: 100,
  start: new Date(2031, 2, 12, 9 + i).getTime(),
}));
const eps = listDefaults.segmentEpsilon;

describe('listActiveIndex', () => {
  it('uses the last section whose top − epsilon has reached the visible top', () => {
    expect([0, 527, 528, 2127, 2128].map((top) => listActiveIndex(metricsAt(top), eps))).toEqual([0, 0, 1, 1, 2]);
  });

  it('activates the last section at the end of the scroll range', () => {
    expect(listActiveIndex(metricsAt(2392), eps)).toBe(2);
    expect(listActiveIndex({ ...metricsAt(0), sections: [] }, eps)).toBe(-1);
  });
});

describe('listAtStart and listSectionVisible', () => {
  it('is at the start of the first section within epsilon, and of later sections at their top', () => {
    expect([listAtStart(0, metricsAt(8), eps), listAtStart(0, metricsAt(9), eps)]).toEqual([true, false]);
    expect([listAtStart(1, metricsAt(536), eps), listAtStart(1, metricsAt(537), eps)]).toEqual([true, false]);
    expect(listAtStart(3, metricsAt(0), eps)).toBe(false);
  });

  it('counts the first section as reached down to where a jump to it lands (DQ-11)', () => {
    // No earlier shift rendered: the first section is the current one, 152 px down the content, and
    // a jump to it lands at 152 − 64 − 8 = 80, well past the epsilon from the top.
    const lower: ListMetrics = {
      ...metricsAt(80),
      sections: [{ top: 152, headerHeight: 60 }, ...metricsAt(0).sections.slice(1)],
    };
    expect(listAtStart(0, lower, eps, 80)).toBe(true);
    expect(listAtStart(0, { ...lower, scrollTop: 89 }, eps, 80)).toBe(false);
    // With the landing at the top (the source's three shifts), the rule is scrollTop ≤ epsilon exactly.
    expect([listAtStart(0, metricsAt(8), eps, -264), listAtStart(0, metricsAt(9), eps, -264)]).toEqual([true, false]);
  });

  it('reports whether a section is visible below the fold', () => {
    expect([listSectionVisible(1, metricsAt(0), eps), listSectionVisible(1, metricsAt(9), eps)]).toEqual([false, true]);
    expect(listSectionVisible(7, metricsAt(0), eps)).toBe(false);
  });
});

describe('listHeaderExpanded', () => {
  const expanded = (scrollTop: number, overrides: Partial<Parameters<typeof listHeaderExpanded>[0]> = {}): boolean => {
    const metrics = metricsAt(scrollTop);
    return listHeaderExpanded({
      metrics,
      currentIndex: 1,
      activeIndex: listActiveIndex(metrics, eps),
      currentItemCount: 5,
      currentCards: cards,
      options: listDefaults,
      ...overrides,
    });
  };

  it('[B-08] collapses after the third card of the current shift, counting cards only', () => {
    expect([100, 536, 878, 879, 988, 989, 1100].map((top) => expanded(top))).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('stays expanded when the current shift has at most collapseMinItems items', () => {
    expect(expanded(1100, { currentItemCount: 3 })).toBe(true);
  });

  it('falls back to the header bottom + collapseMargin without a third card', () => {
    expect([700, 701].map((top) => expanded(top, { currentCards: cards.slice(0, 2) }))).toEqual([true, false]);
  });

  it('is expanded while previous, current and next sections are all visible', () => {
    const tall: ListMetrics = { ...metricsAt(300), clientHeight: 2000 };
    expect(
      listHeaderExpanded({
        metrics: tall,
        currentIndex: 1,
        activeIndex: 1,
        currentItemCount: 5,
        currentCards: [],
        options: listDefaults,
      }),
    ).toBe(true);
  });

  it('is expanded when the current section is not rendered', () => {
    expect(expanded(1100, { currentIndex: 7 })).toBe(true);
  });
});

describe('list targets', () => {
  it('lands below the sticky top and alignOffset, minus the extra offset for earlier shifts', () => {
    expect(listSectionTarget(612, 152, 8)).toBe(452);
    expect(listSectionTarget(0, 152, 8, 104)).toBe(-264);
  });

  it('lands on the section, or on the first card at or after the date', () => {
    const input = {
      current: { top: 600, headerHeight: 60 },
      cards,
      date: cards[2]!.start - 1,
      stickyHeight: 64,
      alignOffset: 8,
    };
    expect(listLandingTarget('shiftStart', input)).toBe(528);
    expect(listLandingTarget('date', input)).toBe(880 - 72);
    expect(listLandingTarget('dateNearBottom', { ...input, date: cards[4]!.start + 1 })).toBe(528);
    expect(listLandingTarget('none', input)).toBeNull();
  });

  it('shows the scroll-to-top button past the threshold', () => {
    expect([96, 97].map((top) => scrollTopButtonVisible(top, 96))).toEqual([false, true]);
  });
});
