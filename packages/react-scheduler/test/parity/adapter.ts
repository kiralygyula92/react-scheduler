// Thin adapter between the Feature Dossier's characterization data and the new API
// (Feature Dossier 07 §3): fixtures become SchedulerItem[], layouts become the golden shape.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { classicLevels, resolveLevels } from '../../src/core/levels';
import { getShiftWindows } from '../../src/core/shifts';
import type { SchedulerItem, TimelineLayout, TimelineLayoutOptions } from '../../src/core/types';

// A path, not a URL: under jsdom, import.meta.url is not a file URL.
const CHARACTERIZATION = resolve(import.meta.dirname, '../../../../spec/feature-dossier/characterization');

export function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(CHARACTERIZATION, relativePath), 'utf8')) as T;
}

interface FixtureItem {
  id: string;
  start: string;
  end?: string;
  level: string;
  tags: string[];
  title: string;
  description: string;
  suggestion: string;
  detail: 'critical' | 'standard';
  observedLabel?: string;
  since?: string;
  reference?: string;
}

interface FixtureFile {
  id: string;
  selectedDate: string;
  now: string;
  shiftHours: number;
  anchorHour: number;
  userRole: string;
  items: FixtureItem[];
}

/** Item payload of the parity fixtures: the source's detail kind (critical / standard). */
export interface ParityData {
  kind: 'critical' | 'standard';
}

export type ParityItem = SchedulerItem<ParityData>;

export interface Fixture {
  items: ParityItem[];
  /** `selectedDate` → `date`. */
  date: string;
  now: string;
}

/** Maps a fixture item to the new item shape: `detail` → `data.kind`; everything else unchanged. */
export function toItem(raw: FixtureItem): ParityItem {
  const item: ParityItem = {
    id: raw.id,
    start: raw.start,
    level: raw.level,
    tags: raw.tags,
    title: raw.title,
    description: raw.description,
    suggestion: raw.suggestion,
    data: { kind: raw.detail },
  };
  if (raw.end !== undefined) item.end = raw.end;
  if (raw.observedLabel !== undefined) item.observedLabel = raw.observedLabel;
  if (raw.since !== undefined) item.since = raw.since;
  if (raw.reference !== undefined) item.reference = raw.reference;
  return item;
}

export function fixture(name: string): Fixture {
  const file = loadJson<FixtureFile>(`fixtures/${name}.json`);
  return { items: file.items.map(toItem), date: file.selectedDate, now: file.now };
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
