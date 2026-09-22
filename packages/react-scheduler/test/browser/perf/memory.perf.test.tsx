import { cdp, commands } from 'vitest/browser';
import type { ReactElement } from 'react';
import { afterAll, describe, expect, it } from 'vitest';
import { ListView, type SchedulerProps, TimelineView } from '../../../src/index';
import type { ParityItem } from '../../support/items';
import { fixtures, frames, mount, settled } from '../support';

// Memory (Feature Dossier 09 §1): 20 mount/unmount cycles of each view leave the heap within +5 % and
// retain no DOM nodes or listeners, measured in Chromium through the DevTools protocol after forced
// garbage collections. The numbers are written to test-results/memory.json.
const large = fixtures['large'] as NonNullable<(typeof fixtures)['large']>;
const props: SchedulerProps<ParityItem> = { items: large.items, date: large.date, now: large.now, preset: 'classic' };
const VIEWS: Record<'list' | 'timeline', ReactElement> = {
  list: <ListView {...props} />,
  timeline: <TimelineView {...props} />,
};

interface Snapshot {
  heap: number;
  nodes: number;
  listeners: number;
  documents: number;
}

const report: Record<string, unknown> = {};

async function snapshot(): Promise<Snapshot> {
  const session = cdp();
  for (let pass = 0; pass < 3; pass++) {
    await session.send('HeapProfiler.collectGarbage');
    await frames(2);
  }
  const { usedSize } = (await session.send('Runtime.getHeapUsage')) as { usedSize: number };
  const counters = await session.send('Memory.getDOMCounters');
  return { heap: usedSize, nodes: counters.nodes, listeners: counters.jsEventListeners, documents: counters.documents };
}

async function cycle(element: ReactElement): Promise<void> {
  const { host, unmount } = mount(element);
  await settled(host, 200);
  unmount();
  await frames(2);
}

afterAll(async () => {
  await commands.writeFile('test-results/memory.json', `${JSON.stringify(report, null, 2)}\n`);
});

describe('memory (Chromium)', () => {
  it.each(Object.keys(VIEWS) as (keyof typeof VIEWS)[])(
    '%s: 20 mount/unmount cycles keep the heap within +5 % and retain no nodes or listeners',
    async (view) => {
      for (let warmup = 0; warmup < 3; warmup++) await cycle(VIEWS[view]);
      const before = await snapshot();
      for (let run = 0; run < 20; run++) await cycle(VIEWS[view]);
      const after = await snapshot();
      report[view] = { before, after, heapGrowth: Math.round((after.heap / before.heap - 1) * 1000) / 10 };
      expect(after.heap).toBeLessThanOrEqual(before.heap * 1.05);
      expect(after.nodes).toBeLessThanOrEqual(before.nodes);
      expect(after.listeners).toBeLessThanOrEqual(before.listeners);
    },
  );
});
