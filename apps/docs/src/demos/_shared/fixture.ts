// SPDX-License-Identifier: MIT
// One characterization fixture turned into items (Feature Dossier 08 §2). The fixture decides the
// shape of the day — the starts, the ends, the levels and the tags — and the site decides the
// wording, so the same day reads in the language of the page. Shared by the scenario boards and by
// the Playground, which offers the same eight days.
import type { SchedulerItem } from '@react-schedulerkit/react-scheduler';

/** One fixture as `scripts/lib/fixtures.ts` writes it: minutes from midnight of the selected day. */
export interface FixtureData {
  readonly id: string;
  readonly date: number;
  readonly now: number;
  readonly shiftHours: number;
  readonly anchorHour: number;
  readonly items: readonly {
    readonly start: number;
    readonly end: number | null;
    readonly level: string;
    readonly tags: readonly string[];
  }[];
}

const MINUTE = 60_000;

export interface FixtureWording {
  /** The invented vocabulary, from `demos.json`. */
  readonly titles: readonly string[];
  readonly describe: (title: string) => string;
}

/** `midnight` is midnight of the day the demos show, in the reader's own zone. */
export function fixtureItems(fixture: FixtureData, midnight: number, wording: FixtureWording): SchedulerItem[] {
  return fixture.items.map(({ start, end, level, tags }, index) => {
    const title = wording.titles[index % wording.titles.length] ?? '';
    const suffix = index < wording.titles.length ? '' : ` ${String(Math.floor(index / wording.titles.length) + 1)}`;
    const item: SchedulerItem = {
      id: `${fixture.id}-${String(index).padStart(3, '0')}`,
      start: midnight + start * MINUTE,
      level,
      title: `${title}${suffix}`,
      description: wording.describe(title),
    };
    if (end !== null) item.end = midnight + end * MINUTE;
    if (tags.length > 0) item.tags = [...tags];
    return item;
  });
}

/** The moment the fixture was recorded at, on the demo day. */
export function fixtureMoment(fixture: FixtureData, midnight: number, which: 'date' | 'now'): number {
  return midnight + fixture[which] * MINUTE;
}
