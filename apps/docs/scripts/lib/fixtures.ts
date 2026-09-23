// SPDX-License-Identifier: MIT
// Writes `src/content/fixtures/{id}.json`: the eight characterization fixtures (Feature Dossier 08
// §2), reduced to what a demo needs. Only the shape of the day is kept — the starts, the ends, the
// levels and the tags — because the wording on this site comes from `locales/{lng}/demos.json` like
// every other demo's, and because the fixture files carry fields the site has no use for.
//
// Generated rather than imported, so the site never reaches into the read-only `spec/` at runtime
// and the largest fixture costs the page 240 tuples instead of 78 kB of JSON.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FIXTURES = [
  'baseline-day',
  'empty',
  'sparse',
  'crowded',
  'night-shift',
  'past-date',
  'pinned-many',
  'large',
] as const;

const specDir = resolve(import.meta.dirname, '..', '..', '..', '..', 'spec/feature-dossier/characterization');
const outDir = resolve(import.meta.dirname, '..', '..', 'src', 'content', 'fixtures');

interface FixtureFile {
  readonly id: string;
  readonly description: string;
  readonly selectedDate: string;
  readonly now: string;
  readonly shiftHours: number;
  readonly anchorHour: number;
  readonly items: readonly {
    readonly id: string;
    readonly start: string;
    readonly end?: string;
    readonly level: string;
    readonly tags?: readonly string[];
  }[];
}

/** `2031-03-12T10:30:00` → `[2031, 2, 12, 10, 30]`, so the demo builds the date in the reader's own zone. */
function parts(stamp: string): [number, number, number, number, number] {
  const [date = '', time = ''] = stamp.split('T');
  const [year = '0', month = '1', day = '1'] = date.split('-');
  const [hour = '0', minute = '0'] = time.split(':');
  return [Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)];
}

export function writeFixtures(): number {
  mkdirSync(outDir, { recursive: true });

  for (const id of FIXTURES) {
    const file = JSON.parse(readFileSync(resolve(specDir, 'fixtures', `${id}.json`), 'utf8')) as FixtureFile;
    const zero = new Date(...parts(file.selectedDate)).setHours(0, 0, 0, 0);
    const minutes = (stamp: string): number => Math.round((new Date(...parts(stamp)).getTime() - zero) / 60_000);

    const data = {
      id: file.id,
      // Minutes from midnight of the selected day: the demo adds them to its own local midnight, so
      // the prerendered schedule and the hydrated one agree in every time zone.
      date: minutes(file.selectedDate),
      now: minutes(file.now),
      shiftHours: file.shiftHours,
      anchorHour: file.anchorHour,
      // `end` is null where the fixture gives none: the scheduler falls back to `defaultDuration`.
      items: file.items.map((item) => ({
        start: minutes(item.start),
        end: item.end === undefined ? null : minutes(item.end),
        level: item.level,
        tags: item.tags ?? [],
      })),
    };

    const contents = `${JSON.stringify(data)}\n`;
    const path = resolve(outDir, `${id}.json`);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== contents) writeFileSync(path, contents);
  }
  return FIXTURES.length;
}
