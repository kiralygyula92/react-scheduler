import { describe, expect, it } from 'vitest';
import { bucketItems } from '../../src/core/bucketing';
import { createFormatters } from '../../src/core/format';
import { computeTimelineLayout } from '../../src/core/layout';
import { classicLevels, compareByPlacement, resolveLevels } from '../../src/core/levels';
import { getShiftWindows, resolveShift } from '../../src/core/shifts';
import { resolveTimeLabel } from '../../src/core/time-label';
import type { SchedulerItem, TimelineLayout } from '../../src/core/types';
import { enUS } from '../../src/locales/en';
import { fixture, type GoldenLayout, HOUR, loadJson, parityLayoutOptions, toGoldenShape } from './adapter';

// Unit-layer scenarios L-01…L-15 (Feature Dossier characterization/scenarios.json), expressed
// through the new API. L-13 (DST) runs in shifts.dst.test.ts under DST zones.
const levels = resolveLevels(classicLevels);
const baseline = fixture('baseline-day');
const crowded = fixture('crowded');
const layoutOf = (name: string, compact: boolean): TimelineLayout<SchedulerItem> => {
  const { items, date } = fixture(name);
  return computeTimelineLayout(items, parityLayoutOptions(date, compact));
};
const golden = (name: string): Omit<GoldenLayout, 'fixture' | 'mode'> => {
  const { rangeStart, placed, overflow } = loadJson<GoldenLayout>(`golden/layout-${name}.json`);
  return { rangeStart, placed, overflow };
};
const card = (layout: TimelineLayout<SchedulerItem>, id: string) => layout.cards.find((c) => c.item.id === id);
const at = (h: number, m = 0): string => `2031-03-12T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
const item = (id: string, level: string, start: string, end: string): SchedulerItem => ({
  id,
  level,
  start,
  end,
  title: id,
});

describe('unit scenarios', () => {
  it('[L-01] placement order: start, then level rank, then id', () => {
    const order = [...baseline.items].sort(compareByPlacement(levels)).map((i) => i.id);
    expect(order).toEqual(loadJson<string[]>('golden/order-baseline.json'));
    const same = [
      item('b', 'watch', at(9), at(10)),
      item('a', 'watch', at(9), at(10)),
      item('z', 'critical', at(9), at(10)),
    ];
    expect(same.sort(compareByPlacement(levels)).map((i) => i.id)).toEqual(['z', 'a', 'b']);
    // The list (bucketing) and the timeline (layout) use the same order.
    const windows = getShiftWindows(baseline.date);
    expect(bucketItems(baseline.items, windows).flatMap((s) => s.items.map((i) => i.id))).toEqual(order);
    const options = parityLayoutOptions(baseline.date, false);
    expect(computeTimelineLayout(baseline.items, { ...options, compareItems: compareByPlacement(levels) })).toEqual(
      computeTimelineLayout(baseline.items, options),
    );
  });

  it('[L-02] isolated items are full width', () => {
    const layout = layoutOf('pinned-many', false);
    const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }): boolean =>
      a.start < b.end && b.start < a.end;
    const isolated = layout.cards.filter((c) => !layout.cards.some((o) => o !== c && overlaps(o, c)));
    expect(isolated.length).toBeGreaterThan(0);
    for (const c of isolated) expect([c.column, c.columns]).toEqual([0, 1]);
  });

  it('[L-03] stronger levels take the left columns inside an overlap group', () => {
    const layout = layoutOf('baseline-day', false);
    expect(card(layout, 'c01')).toMatchObject({ column: 0, columns: 3 });
    expect(toGoldenShape(layout)).toEqual(golden('baseline-day-regular'));
  });

  it('[L-04] column cap and overflow group', () => {
    const layout = layoutOf('crowded', false);
    expect(Math.max(...layout.cards.map((c) => c.columns))).toBeLessThanOrEqual(3);
    expect(layout.overflow.length).toBeGreaterThanOrEqual(1);
    expect(layout.overflow.map((g) => g.items.map((i) => i.id))).toEqual([['k04', 'k05', 'k01', 'k07']]);
    expect(new Date(layout.overflow[0]!.anchor).getHours()).toBe(9);
    expect(toGoldenShape(layout)).toEqual(golden('crowded-regular'));
  });

  it('[L-05] compact mode column cap', () => {
    const layout = layoutOf('crowded', true);
    expect(layout.cards.filter((c) => c.item.id !== 'k08').map((c) => c.columns)).toEqual([1]);
    expect(toGoldenShape(layout)).toEqual(golden('crowded-compact'));
  });

  it('[L-06] promotion from overflow', () => {
    const layout = computeTimelineLayout(
      [
        item('w', 'watch', at(9), at(10)),
        item('m', 'monitoring', at(9), at(10)),
        item('r', 'routine', at(9), at(10)),
        item('c', 'critical', at(9, 30), at(11)),
      ],
      parityLayoutOptions(baseline.date, false),
    );
    expect(layout.cards.map((c) => c.item.id).sort()).toEqual(['c', 'm', 'w']);
    expect(layout.overflow.flatMap((g) => g.items.map((i) => i.id))).toEqual(['r']);
  });

  it('[L-07] overflow buckets merge across hours', () => {
    const items = [
      ...['a', 'b', 'c', 'd'].map((id) => item(id, 'routine', at(10), at(11, 30))),
      item('e', 'routine', at(11), at(12)),
    ];
    const layout = computeTimelineLayout(items, parityLayoutOptions(baseline.date, false));
    expect(layout.overflow.map((g) => [new Date(g.anchor).getHours(), g.items.map((i) => i.id)])).toEqual([
      [10, ['d', 'e']],
    ]);
  });

  it('[L-08] shared column count per overlap-connected group', () => {
    const layout = layoutOf('crowded', false);
    const cluster = layout.cards.filter((c) => c.item.id !== 'k08');
    expect(new Set(cluster.map((c) => c.columns)).size).toBe(1);
    expect(card(layout, 'k08')).toMatchObject({ column: 0, columns: 1 });
  });

  it('[L-09] geometry', () => {
    const layout = layoutOf('baseline-day', false);
    expect(card(layout, 'c09')).toMatchObject({ top: 3612, height: 340 });
    // c01 lasts 90 minutes = 258 px, minus the 4 px card gap.
    expect(card(layout, 'c01')).toMatchObject({ top: 2150, height: 254 });
    const short = computeTimelineLayout(
      [item('x', 'routine', at(9), at(9, 10))],
      parityLayoutOptions(baseline.date, false),
    );
    expect(short.cards[0]?.height).toBe(80);
  });

  it('[L-10] large golden layouts are stable', () => {
    const { items, date } = fixture('large');
    for (const mode of ['regular', 'compact'] as const) {
      const options = parityLayoutOptions(date, mode === 'compact', { overflowMergeWindow: Infinity });
      const first = toGoldenShape(computeTimelineLayout(items, options));
      expect(toGoldenShape(computeTimelineLayout(items, options))).toEqual(first);
      expect(first).toEqual(golden(`large-${mode}`));
    }
    expect(toGoldenShape(layoutOf('baseline-day', true))).toEqual(golden('baseline-day-compact'));
  });

  it('[L-11] shift windows', () => {
    const window = (value: string): [number, number, string] => {
      const shift = resolveShift(value);
      return [shift.start, shift.end, shift.key];
    };
    const ms = (value: string): number => new Date(value).getTime();
    expect(window(at(10, 30))).toEqual([ms(at(8)), ms(at(20)), 'day']);
    expect(window(at(8))).toEqual([ms(at(8)), ms(at(20)), 'day']);
    expect(window('2031-03-12T07:59:59')).toEqual([ms('2031-03-11T20:00:00'), ms(at(8)), 'night']);
    expect(window(at(2))).toEqual([ms('2031-03-11T20:00:00'), ms(at(8)), 'night']);
    expect(window(at(20))).toEqual([ms(at(20)), ms('2031-03-13T08:00:00'), 'night']);
    const keys = getShiftWindows(at(10), { before: 1, after: 2 }).map((w) => w.key);
    expect(keys).toEqual(['night', 'day', 'night', 'day']);
  });

  it('[L-12] bucketing items into shifts', () => {
    const extra = [
      item('x-next-day-08', 'routine', '2031-03-13T08:00:00', '2031-03-13T09:00:00'),
      item('x-20', 'routine', at(20), at(21)),
    ];
    const segments = bucketItems([...baseline.items, ...extra], getShiftWindows(baseline.date));
    expect(segments.map((s) => s.items.map((i) => i.id))).toEqual([
      ['p01', 'p02', 'p03', 'p04'],
      ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10'],
      ['x-20', 'n01', 'n02', 'n03'],
    ]);
    // Ids are never mutated (B-20).
    expect(segments[0]?.items[0]).toBe(baseline.items[0]);
  });

  it('[L-14] label formats (fixed: B-15: every locale uses its own formats)', () => {
    const samples = loadJson<{
      boundaryRange: { en: string; es: string };
      clockTime: { en: string; es: string };
      hourLabels: string[];
      sinceTimestamp: string;
    }>('golden/format-samples.json');
    const en = createFormatters('en-US');
    const d = (h: number, m = 0, day = 12): Date => new Date(2031, 2, day, h, m);
    expect([0, 8, 12, 13, 20].map((h) => en.hourLabel(d(h)))).toEqual(samples.hourLabels);
    expect(en.shiftRange(d(20, 0, 11), d(8))).toBe(samples.boundaryRange.en);
    expect(en.shiftRange(new Date(Number.NaN), d(8))).toBe('');
    expect(en.clockTime(d(10, 30))).toBe(samples.clockTime.en);
    expect(en.sinceTimestamp(d(7, 45))).toBe(samples.sinceTimestamp);
    // es: the source forced a 12-hour clock; the golden is reproduced by asking for it explicitly.
    const es = createFormatters('es-ES-u-hc-h12');
    expect(es.clockTime(d(10, 30))).toBe(samples.clockTime.es);
    expect(es.shiftRange(d(20, 0, 11), d(8))).toBe(samples.boundaryRange.es);
    // B-15: other languages no longer fall back to en-US.
    expect(createFormatters('de-DE').clockTime(d(10, 30))).toBe('10:30');
    // The source's "shift date" label ("March 12, 2031") was passed but never rendered (01 §1.1);
    // it is not part of the new API.
  });

  it('[L-15] item time label', () => {
    const formatters = createFormatters('en-US');
    const byId = new Map(baseline.items.map((i) => [i.id, i]));
    const label = (id: string): string => resolveTimeLabel(byId.get(id)!, enUS, formatters, 2 * HOUR);
    expect(label('c01')).toBe('Observed at: 8:12 AM – Present');
    expect(label('c04')).toBe('Ready since: 03/12/2031 07:45 AM');
    expect(label('c02')).toBe('9:00 AM – 10:30 AM');
    expect(label('c09')).toBe('5:00 PM – 7:00 PM');
  });
});

describe('fixture mapping', () => {
  it('maps the source detail kind to data.kind and keeps every other field', () => {
    const c01 = baseline.items.find((i) => i.id === 'c01');
    expect(c01).toMatchObject({
      level: 'critical',
      tags: ['impactsNextShift'],
      observedLabel: '8:12 AM – Present',
      data: { kind: 'critical' },
    });
    expect(crowded.items).toHaveLength(8);
  });
});
