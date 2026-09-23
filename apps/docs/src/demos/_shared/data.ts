// SPDX-License-Identifier: MIT
// The sample data every demo on this site shows (Feature Dossier 08 §4). It is generated, seeded and
// copyright-free: no real people, places or companies, and the same seed always produces the same
// day, so a prerendered demo and its hydrated copy agree and the screenshots do not flicker.
//
// The wording is not here: titles and descriptions are passed in by `useDemo`, which reads them from
// `locales/{lng}/demos.json`, so the sample data is translated like the rest of the site.
import type { SchedulerItem } from '@react-schedulerkit/react-scheduler';

const MINUTE = 60_000;
const DURATIONS = [30, 45, 60, 90, 120];

export interface SampleOptions {
  /** Anything with the same seed is the same day, everywhere, forever. */
  readonly seed?: number;
  readonly count: number;
  /** The first moment items may start at. */
  readonly start: number;
  /** How long the generated range is. */
  readonly hours: number;
  /** The level keys to draw from, in the order they are ranked. */
  readonly levels: readonly string[];
  /** The invented vocabulary, from `demos.json`. */
  readonly titles: readonly string[];
  /** Turns a title into the item's description; also from `demos.json`. */
  readonly describe?: (title: string) => string;
  /** 0 spreads the starts evenly, 1 clusters them into a few busy moments. */
  readonly overlapDensity?: number;
  /** The share of items that may be pinned by hand. */
  readonly pinnableShare?: number;
  readonly withReferences?: boolean;
  readonly withTags?: boolean;
  readonly tags?: readonly string[];
}

/** Park–Miller, the generator the package's own fixtures use, so both tell the same story. */
function seededRandom(seed: number): () => number {
  let state = seed % 2_147_483_647 || 1;
  return () => {
    state = (state * 48_271) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

/**
 * `count` items on a 15-minute grid inside `[start, start + hours)`. Every optional field is off by
 * default, so a demo shows the one thing it is about and nothing else.
 */
export function createSampleItems(options: SampleOptions): SchedulerItem[] {
  const {
    seed = 7,
    count,
    start,
    hours,
    levels,
    titles,
    describe,
    overlapDensity = 0,
    pinnableShare = 0,
    withReferences = false,
    withTags = false,
    tags = [],
  } = options;
  const random = seededRandom(seed);
  const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)] as T;
  const slots = hours * 4;

  const items: SchedulerItem[] = [];
  let previous = 0;
  for (let index = 0; index < count; index += 1) {
    // Clustering is what makes a day crowded: the higher the density, the more often an item starts
    // in the quarter of an hour the one before it started in.
    const slot = random() < overlapDensity ? previous : Math.floor(random() * slots);
    previous = slot;
    const itemStart = start + slot * 15 * MINUTE;
    const title = titles[index % titles.length] ?? '';
    const suffix = index < titles.length ? '' : ` ${String(Math.floor(index / titles.length) + 1)}`;

    const item: SchedulerItem = {
      id: `s${String(index).padStart(3, '0')}`,
      start: itemStart,
      level: levels[Math.floor(random() * levels.length)] ?? (levels[0] as string),
      title: `${title}${suffix}`,
    };
    // A tenth of the items have no end: the scheduler gives them `defaultDuration`.
    if (random() >= 0.1) item.end = itemStart + pick(DURATIONS) * MINUTE;
    if (describe !== undefined) item.description = describe(title);
    if (withReferences) item.reference = String(1000 + Math.floor(random() * 9000));
    if (withTags && tags.length > 0 && random() < 0.25) item.tags = [pick(tags)];
    if (random() < pinnableShare) item.pinnable = true;
    items.push(item);
  }
  return items.sort((a, b) => Number(a.start) - Number(b.start));
}
