// Fixture items in the new shape (Feature Dossier 07 §3). No Node.js imports: browser tests use it too.
import type { SchedulerItem } from '../../src/core/types';

export interface FixtureItem {
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

export interface FixtureFile {
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

/** A fixture file in the new shape. */
export function toFixture(file: FixtureFile): Fixture {
  return { items: file.items.map(toItem), date: file.selectedDate, now: file.now };
}
