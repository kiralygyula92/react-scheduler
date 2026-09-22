// Thin adapter between the Feature Dossier's characterization data and the new API
// (Feature Dossier 07 §3): fixtures become SchedulerItem[], layouts become the golden shape.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { classicLevels, resolveLevels } from '../../src/core/levels';
import { getShiftWindows } from '../../src/core/shifts';
import type { SchedulerItem, TimelineLayout, TimelineLayoutOptions } from '../../src/core/types';
import { type Fixture, type FixtureFile, toFixture } from '../support/items';

export type { Fixture, ParityItem } from '../support/items';

// A path, not a URL: under jsdom, import.meta.url is not a file URL.
const CHARACTERIZATION = resolve(import.meta.dirname, '../../../../spec/feature-dossier/characterization');

export function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(CHARACTERIZATION, relativePath), 'utf8')) as T;
}

export function fixture(name: string): Fixture {
  return toFixture(loadJson<FixtureFile>(`fixtures/${name}.json`));
}

export const HOUR = 3_600_000;

/** Timeline options at their parity defaults (Feature Dossier 04 §5.10) for a selected date. */
export function parityLayoutOptions(
  date: string,
  compact: boolean,
  overrides: Partial<TimelineLayoutOptions<SchedulerItem>> = {},
): TimelineLayoutOptions<SchedulerItem> {
  const windows = getShiftWindows(date);
  return {
    rangeStart: windows[0]?.start ?? Number.NaN,
    rangeEnd: windows[windows.length - 1]?.end ?? Number.NaN,
    levels: resolveLevels(classicLevels),
    compact,
    hourHeight: 172,
    maxColumns: 3,
    maxColumnsCrowded: 3,
    maxColumnsCompact: 1,
    minCardHeight: 80,
    cardGap: 4,
    columnPlacement: 'priority',
    overflowMergeWindow: 2 * HOUR,
    defaultDuration: 2 * HOUR,
    ...overrides,
  };
}

/** Local wall-clock ISO string without offset, as the golden files write instants. */
export function localIso(ms: number): string {
  const d = new Date(ms);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export interface GoldenLayout {
  fixture: string;
  mode: 'regular' | 'compact';
  rangeStart: string;
  placed: { id: string; column: number; columns: number; top: number; height: number }[];
  overflow: { anchor: string; ids: string[] }[];
}

export function toGoldenShape(layout: TimelineLayout<SchedulerItem>): Omit<GoldenLayout, 'fixture' | 'mode'> {
  return {
    rangeStart: localIso(layout.rangeStart),
    placed: layout.cards.map((card) => ({
      id: card.item.id,
      column: card.column,
      columns: card.columns,
      top: card.top,
      height: card.height,
    })),
    overflow: layout.overflow.map((group) => ({
      anchor: localIso(group.anchor),
      ids: group.items.map((item) => item.id),
    })),
  };
}
