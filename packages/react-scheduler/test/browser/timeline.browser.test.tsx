import { page, userEvent } from 'vitest/browser';
import { type ReactElement, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Scheduler, type SchedulerProps, TimelineView } from '../../src/index';
import type { ParityItem } from '../support/items';
import {
  cardByTitle,
  chipTitles,
  fixtures,
  frames,
  mount,
  nav,
  part,
  parts,
  scrollTo,
  settled,
  unmountAll,
  until,
} from './support';

// The timeline browser scenarios (BR-T*), in real layout: Feature Dossier 07 §3, classic preset.
const baseline = fixtures['baseline'] as NonNullable<(typeof fixtures)['baseline']>;
const base: SchedulerProps<ParityItem> = {
  items: baseline.items,
  date: baseline.date,
  now: baseline.now,
  preset: 'classic',
};

afterEach(() => {
  unmountAll();
});

async function landedTimeline(
  props: Partial<SchedulerProps<ParityItem>> = {},
): Promise<{ host: HTMLElement; scroller: HTMLElement }> {
  const { host } = mount(<TimelineView {...base} {...props} />);
  return { host, scroller: await settled(host, 700) };
}

function description(element: HTMLElement): string {
  return document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent ?? '';
}

/** Offset of `element`'s box from `container`'s padding box, in px. */
function offsetIn(element: Element, container: Element): { top: number; left: number } {
  const outer = container.getBoundingClientRect();
  const inner = element.getBoundingClientRect();
  const style = getComputedStyle(container);
  return {
    top: inner.top - outer.top - Number.parseFloat(style.borderTopWidth),
    left: inner.left - outer.left - Number.parseFloat(style.borderLeftWidth),
  };
}

/** The source consumer's per-view header store (Feature Dossier 04 §10). */
function HeaderOwner(
  props: SchedulerProps<ParityItem> & {
    initial: { list: boolean; timeline: boolean };
    record: (value: boolean) => void;
  },
): ReactElement {
  const { record, initial, view = 'list', ...rest } = props;
  const [store, setStore] = useState(initial);
  return (
    <Scheduler
      {...rest}
      view={view}
      headerExpanded={store[view]}
      onHeaderExpandedChange={(value, info) => {
        record(value);
        setStore((previous) => ({ ...previous, [info.view]: value }));
      }}
    />
  );
}

describe('timeline browser scenarios', () => {
  it("[BR-T01] lands at 1986 with the previous shift's critical items pinned", async () => {
    const { host, scroller } = await landedTimeline();
    expect(scroller.scrollTop).toBe(1986);
    expect(chipTitles(host)).toEqual(['Backup verification', 'Network follow-up']);
    expect(nav(host, 'top')?.textContent).toBe('View previous shift(2 inherited)');
  });

  it('[BR-T02] a card pins only once its bottom crosses the scroller top (fixed: B-05)', async () => {
    const { host, scroller } = await landedTimeline();
    await scrollTo(scroller, 2600);
    const card = cardByTitle(host, 'Safety inspection', 'timelineCard');
    const sentinel = part(card, 'pinSentinel');
    const place = async (offset: number): Promise<boolean> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const line = scroller.getBoundingClientRect().top;
        const delta = sentinel.getBoundingClientRect().top - (line + offset);
        if (Math.abs(delta) < 0.5) break;
        scroller.scrollTop += delta;
        await frames(3);
      }
      await frames(2);
      return chipTitles(host).includes('Safety inspection');
    };
    // The source pinned it while its bottom was still one sticky height inside the scroller.
    const stickyHeight = part(host, 'stickyTop').offsetHeight;
    expect(await place(stickyHeight - 2)).toBe(false);
    expect(await place(2)).toBe(false);
    expect(await place(-2)).toBe(true);
  });

  it('[BR-T03] grid geometry: gutter, pads, grid height and three shared columns', async () => {
    const { host } = await landedTimeline();
    expect(part(host, 'timeGutter').getBoundingClientRect().width).toBe(88);
    expect(part(host, 'laneStartPad').getBoundingClientRect().width).toBe(64);
    expect(part(host, 'laneEndPad').getBoundingClientRect().width).toBe(64);
    const box = part(host, 'gridBox');
    // Border-box: the 1 px border is inside the 6192 px (measured-styles grid.box).
    expect(box.offsetHeight).toBe(36 * 172);
    const lane = part(host, 'lane');
    const c01 = cardByTitle(host, 'Server room alert', 'timelineCard');
    expect(offsetIn(c01, lane)).toEqual({ top: 2150, left: 0 });
    expect(c01.getBoundingClientRect().height).toBe(254);
    const laneWidth = lane.getBoundingClientRect().width;
    const shared = parts(host, 'timelineCard').filter((card) => card.dataset['rsColumns'] === '3');
    expect(shared.length).toBeGreaterThan(0);
    const width = (laneWidth - 2 * 4) / 3;
    for (const card of shared) {
      const column = Number(card.dataset['rsColumn']);
      expect(Math.abs(card.getBoundingClientRect().width - width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(offsetIn(card, lane).left - column * (width + 4))).toBeLessThanOrEqual(0.5);
    }
  });

  it('[BR-T04] "View next shift" ends at 4050 with the bottom button disabled', async () => {
    const { host, scroller } = await landedTimeline();
    (nav(host, 'bottom') as HTMLElement).click();
    await until(
      () => Math.abs(scroller.scrollTop - 4050) <= 1 && nav(host, 'bottom')?.getAttribute('aria-disabled') === 'true',
      4000,
      'next shift',
    );
    expect(description(nav(host, 'bottom') as HTMLElement)).toBe('No next shift available.');
  });

  it('[BR-T05] a list → timeline switch lands near the bottom and emits one header value (fixed: B-04)', async () => {
    const values: boolean[] = [];
    const record = (value: boolean): number => values.push(value);
    const { host, rerender } = mount(
      <HeaderOwner
        {...base}
        view="list"
        keepInactiveViewMounted
        initial={{ list: true, timeline: false }}
        record={record}
      />,
    );
    await settled(host, 700);
    values.length = 0;
    rerender(
      <HeaderOwner
        {...base}
        view="timeline"
        keepInactiveViewMounted
        initial={{ list: true, timeline: false }}
        record={record}
      />,
    );
    const timelineRoot = parts(host, 'root').find((root) => root.dataset['rsView'] === 'timeline') as HTMLElement;
    const scroller = part(timelineRoot, 'scroller');
    await until(() => values.length > 0, 8000, 'the header value');
    await settled(timelineRoot, 500);
    expect(scroller.scrollTop).toBe(2072 + 430 - (scroller.clientHeight - 86));
    expect(scroller.clientHeight).toBe(712);
    expect(values).toEqual([true]);
  });

  it('[BR-T06] the now line sits at 14.5 h, 2 px tall, from 9 px left of the grid; the label is centred on it', async () => {
    const { host } = await landedTimeline();
    const box = part(host, 'gridBox');
    const line = part(host, 'nowLine');
    expect(offsetIn(line, box).top).toBe(14.5 * 172);
    expect(line.getBoundingClientRect().height).toBe(2);
    expect(offsetIn(line, box).left).toBe(-9);
    const label = part(host, 'nowLabel').getBoundingClientRect();
    const rect = line.getBoundingClientRect();
    expect(Math.abs((label.top + label.bottom) / 2 - (rect.top + rect.bottom) / 2)).toBeLessThanOrEqual(1);
  });

  it('[BR-T07] keyboard path: chips, top button, first card; Enter opens, Escape restores focus', async () => {
    const { host } = await landedTimeline();
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    const first = cardByTitle(host, 'Handover notes', 'timelineCard');
    const order = document.activeElement;
    expect(order).toBe(part(first, 'cardActivator'));
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByRole('dialog', { name: 'Handover notes' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await until(() => document.querySelector('dialog[open]') === null, 3000, 'dialog closed');
    expect(document.activeElement).toBe(part(first, 'cardActivator'));
  });

  it('[BR-T08] hovering the bottom button shows its hint as a tooltip above it', async () => {
    const { host } = await landedTimeline();
    const bottom = nav(host, 'bottom') as HTMLElement;
    await userEvent.hover(bottom);
    const tooltip = document.getElementById(bottom.getAttribute('aria-describedby') ?? '') as HTMLElement;
    await until(() => !tooltip.classList.contains('rs-visually-hidden'), 2000, 'tooltip');
    expect(tooltip.textContent).toBe('Scroll to next shift start');
    expect(Math.round(bottom.getBoundingClientRect().top - tooltip.getBoundingClientRect().bottom)).toBe(14);
  });

  it('[BR-T09] the "+more" chip sits in the right pad at 09:00: top 2236, left 4, height 28', async () => {
    const { host } = await landedTimeline();
    const chip = part(host, 'moreChip');
    const pad = part(host, 'laneEndPad');
    expect(offsetIn(chip, pad)).toEqual({ top: 13 * 172, left: 4 });
    expect(chip.getBoundingClientRect().height).toBe(28);
  });
});
