// Seeded, copyright-free item generator for tests (Park–Miller PRNG, as in Feature Dossier 08 §4).
import type { SchedulerItem } from '../../src/core/types';

const LEVELS = [
  'critical',
  'watch',
  'monitoring',
  'capacityWatch',
  'ready',
  'normal',
  'onTarget',
  'routine',
  'resolved',
];
const DURATIONS = [30, 45, 60, 90, 120];

export function seededRandom(seed: number): () => number {
  let state = seed % 2_147_483_647 || 1;
  return () => {
    state = (state * 48_271) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

/** `count` items with starts on a 15-minute grid inside [rangeStart, rangeStart + hours). */
export function generateItems(count: number, rangeStart: number, hours: number, seed = 42): SchedulerItem[] {
  const random = seededRandom(seed);
  const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)] as T;
  return Array.from({ length: count }, (_, index) => {
    const start = rangeStart + Math.floor(random() * hours * 4) * 15 * 60_000;
    const item: SchedulerItem = {
      id: `t${String(index).padStart(4, '0')}`,
      start,
      level: pick(LEVELS),
      title: `Task ${index}`,
    };
    if (random() >= 0.1) item.end = start + pick(DURATIONS) * 60_000;
    return item;
  });
}
