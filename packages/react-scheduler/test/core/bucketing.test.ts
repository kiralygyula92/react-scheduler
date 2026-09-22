import { afterEach, describe, expect, it, vi } from 'vitest';
import { bucketItems, segmentsFromInput } from '../../src/core/bucketing';
import { getShiftWindows } from '../../src/core/shifts';
import type { SchedulerItem } from '../../src/core/types';

const item = (id: string, start: string, level = 'routine'): SchedulerItem => ({ id, start, level, title: id });
const windows = getShiftWindows('2031-03-12T10:30:00');
const ids = (segments: ReturnType<typeof bucketItems>): string[][] => segments.map((s) => s.items.map((i) => i.id));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('bucketItems', () => {
  it('uses half-open windows: a start exactly on a boundary belongs to the later shift', () => {
    const segments = bucketItems(
      [item('a', '2031-03-12T08:00:00'), item('b', '2031-03-12T07:59:00'), item('c', '2031-03-12T20:00:00')],
      windows,
    );
    expect(ids(segments)).toEqual([['b'], ['a'], ['c']]);
  });

  it('drops items outside every window', () => {
    expect(
      ids(bucketItems([item('early', '2031-03-11T19:59:00'), item('late', '2031-03-13T08:00:00')], windows)),
    ).toEqual([[], [], []]);
  });

  it('[B-20] never changes ids; previous and next items keep them as given', () => {
    const input = [item('shared-id', '2031-03-11T22:00:00'), item('other', '2031-03-12T21:00:00')];
    const segments = bucketItems(input, windows);
    expect(segments[0]?.items[0]).toBe(input[0]);
    expect(ids(segments)).toEqual([['shared-id'], [], ['other']]);
  });

  it('keeps the first occurrence of a duplicate id and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const segments = bucketItems([item('dup', '2031-03-12T09:00:00'), item('dup', '2031-03-12T10:00:00')], windows);
    expect(segments[1]?.items.map((i) => i.start)).toEqual(['2031-03-12T09:00:00']);
    bucketItems([item('dup', '2031-03-12T09:00:00'), item('dup', '2031-03-12T10:00:00')], windows);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('drops items with an invalid start and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(ids(bucketItems([item('bad', 'soon')], windows))).toEqual([[], [], []]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"bad" has an invalid start'));
  });

  it('sorts each segment by placement order, or by compareItems when given', () => {
    const input = [
      item('b', '2031-03-12T09:00:00', 'watch'),
      item('a', '2031-03-12T09:00:00', 'watch'),
      item('z', '2031-03-12T09:00:00', 'critical'),
    ];
    expect(ids(bucketItems(input, windows))[1]).toEqual(['z', 'a', 'b']);
    const byTitleDesc = (x: SchedulerItem, y: SchedulerItem): number => y.title.localeCompare(x.title);
    expect(ids(bucketItems(input, windows, { compareItems: byTitleDesc }))[1]).toEqual(['z', 'b', 'a']);
  });
});

describe('segmentsFromInput', () => {
  it('keeps the given buckets, derives offsets from roles and sorts items', () => {
    const segments = segmentsFromInput([
      { role: 'next', start: '2031-03-12T20:00:00', end: '2031-03-13T08:00:00', items: [] },
      {
        role: 'current',
        key: 'day',
        start: '2031-03-12T08:00:00',
        end: '2031-03-12T20:00:00',
        items: [item('b', '2031-03-12T11:00:00'), item('a', '2031-03-12T09:00:00')],
      },
      {
        role: 'previous',
        offset: -3,
        start: '2031-03-11T20:00:00',
        end: '2031-03-12T08:00:00',
        items: [item('far', '2031-03-11T20:00:00')],
      },
    ]);
    expect(segments.map((s) => [s.shift.offset, s.shift.role, s.shift.key])).toEqual([
      [-3, 'previous', ''],
      [0, 'current', 'day'],
      [1, 'next', ''],
    ]);
    expect(ids(segments)).toEqual([['far'], ['a', 'b'], []]);
    expect(segments[1]?.shift.start).toBe(new Date(2031, 2, 12, 8).getTime());
  });
});
