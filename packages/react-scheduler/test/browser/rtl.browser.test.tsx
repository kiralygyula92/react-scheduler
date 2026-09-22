import { commands, page, server } from 'vitest/browser';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ListView, type SchedulerProps, TimelineView } from '../../src/index';
import type { ParityItem } from '../support/items';
import { fixtures, frames, mount, settled, unmountAll } from './support';

// Right-to-left (Feature Dossier 05 F-29): with dir="rtl" the layout mirrors the left-to-right one.
// Every part's box is checked in all three engines; the Dossier's flip check compares the mirrored
// RTL screenshot with the LTR one in Chromium, with text made transparent (text is not mirrored).
const baseline = fixtures['baseline'] as NonNullable<(typeof fixtures)['baseline']>;
const base: SchedulerProps<ParityItem> = {
  items: baseline.items,
  date: baseline.date,
  now: baseline.now,
  preset: 'classic',
};

const VIEWS: Record<'list' | 'timeline', ReactElement> = {
  list: <ListView {...base} />,
  timeline: <TimelineView {...base} />,
};

/** Parts that are not laid out in the mirrored flow: visually hidden text for assistive technology. */
const UNLAID = new Set(['tooltip', 'liveRegion']);

const inDirection = (dir: 'ltr' | 'rtl', element: ReactElement): ReactElement => (
  <div dir={dir} style={{ height: '100%' }}>
    {element}
  </div>
);

interface Box {
  part: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

async function boxes(dir: 'ltr' | 'rtl', element: ReactElement): Promise<Box[]> {
  const { host } = mount(inDirection(dir, element));
  await settled(host, 500);
  await frames(4);
  const origin = host.getBoundingClientRect();
  const result = [...host.querySelectorAll<HTMLElement>('[data-rs-part]')]
    .filter((node) => !UNLAID.has(node.dataset['rsPart'] ?? '') && !node.closest('.rs-visually-hidden'))
    .map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        part: node.dataset['rsPart'] ?? '',
        left: rect.left - origin.left,
        top: rect.top - origin.top,
        width: rect.width,
        height: rect.height,
      };
    });
  unmountAll();
  return result;
}

const hideText = document.createElement('style');
hideText.textContent =
  '.rs-root, .rs-root * { color: transparent !important; caret-color: transparent !important; text-shadow: none !important; }';

afterEach(() => {
  unmountAll();
  hideText.remove();
});

describe('right-to-left (F-29)', () => {
  it.each(Object.keys(VIEWS) as (keyof typeof VIEWS)[])('%s: every part is the mirror of its LTR box', async (view) => {
    const ltr = await boxes('ltr', VIEWS[view]);
    const rtl = await boxes('rtl', VIEWS[view]);
    expect(rtl.map((box) => box.part)).toEqual(ltr.map((box) => box.part));
    const width = 1440;
    const off = ltr.flatMap((box, index) => {
      const other = rtl[index] as Box;
      const mirrored = width - box.left - box.width;
      const deltas = [other.left - mirrored, other.top - box.top, other.width - box.width, other.height - box.height];
      return deltas.every((delta) => Math.abs(delta) <= 1)
        ? []
        : [`${box.part}#${index}: ltr ${JSON.stringify(box)} rtl ${JSON.stringify(other)}`];
    });
    expect(off).toEqual([]);
  });

  it.runIf(server.browser === 'chromium').each(Object.keys(VIEWS) as (keyof typeof VIEWS)[])(
    '%s: the flipped RTL screenshot matches the LTR one',
    async (view) => {
      document.head.append(hideText);
      const shots: string[] = [];
      for (const dir of ['ltr', 'rtl'] as const) {
        const { host } = mount(inDirection(dir, VIEWS[view]));
        await settled(host, 500);
        await frames(4);
        shots.push(await page.screenshot({ save: false, animations: 'disabled', caret: 'hide' }));
        unmountAll();
      }
      const [ltr = '', rtl = ''] = shots;
      const result = await commands.compareMirrored({ name: `rtl-${view}`, ltr, rtl });
      expect(result.ratio, `${result.different} pixels differ (diff: ${result.diff})`).toBeLessThanOrEqual(0.001);
    },
  );
});
