import { afterEach, describe, expect, it } from 'vitest';
import { type Density, ListView, type SchedulerProps, TimelineView } from '../../src/index';
import type { ParityItem } from '../support/items';
import { fixtures, frames, mount, nav, part, parts, scrollTo, settled, unmountAll } from './support';

// The default preset's room for what it draws (ADR 0005 D2, D3): a short timeline card shows its title
// whole with the card's padding around it and never cuts a line, and a navigation button with its
// focus ring always fits inside the root. The classic preset keeps the source's measures (SHOT, VIS).
const baseline = fixtures['baseline'] as NonNullable<(typeof fixtures)['baseline']>;
const start = new Date(baseline.now).getTime();
const at = (minutes: number): string => new Date(start + minutes * 60_000).toISOString();
/** Items from 5 to 90 minutes long, so every density draws some at the minimum height. */
const short: ParityItem[] = [5, 15, 30, 45, 60, 90].map((minutes, index) => ({
  id: `short-${String(minutes)}`,
  title: `Short item ${String(minutes)}`,
  description: 'A description line under the title.',
  level: 'routine',
  start: at(index * 180),
  end: at(index * 180 + minutes),
}));
const base: SchedulerProps<ParityItem> = {
  items: [...baseline.items, ...short],
  date: baseline.date,
  now: baseline.now,
};

/** The focus ring (`--rs-focus-width` plus `--rs-focus-offset`) and the air the preset keeps past it. */
const RING = 4;
const AIR = 4;

afterEach(() => {
  unmountAll();
});

describe('default preset: short timeline cards', () => {
  it.each(['standard', 'comfortable', 'dense'] as const)(
    '%s: the title sits whole inside the card top with padding around it; no line is cut',
    async (density: Density) => {
      const { host } = mount(<TimelineView {...base} density={density} />);
      await settled(host, 500);
      const cards = parts(host, 'timelineCard').filter((card) => card.textContent?.includes('Short item'));
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        const title = part(card, 'cardTitle').getBoundingClientRect();
        const top = card.querySelector<HTMLElement>('.rs-card__top') as HTMLElement;
        const box = top.getBoundingClientRect();
        const style = getComputedStyle(top);
        const name = card.textContent ?? '';
        expect(title.top - box.top, `${name}: room above the title`).toBeGreaterThanOrEqual(
          Number.parseFloat(style.paddingTop) - 0.5,
        );
        expect(box.bottom - title.bottom, `${name}: room below the title`).toBeGreaterThanOrEqual(
          Number.parseFloat(style.paddingBottom) - 0.5,
        );
        expect(part(card, 'cardRail').getBoundingClientRect().height, `${name}: rail`).toBeGreaterThan(0);
        // Every text line is either wholly inside the card body or moved out of it, never cut.
        const body = (card.querySelector('.rs-card__body') as HTMLElement).getBoundingClientRect();
        for (const line of card.querySelectorAll<HTMLElement>(
          '.rs-card__body .rs-card-description, .rs-card__body .rs-card-time-label',
        )) {
          const rect = line.getBoundingClientRect();
          const inside = rect.top >= body.top - 0.5 && rect.bottom <= body.bottom + 0.5 && rect.left < body.right;
          const outside = rect.left >= body.right - 0.5 || rect.top >= body.bottom - 0.5;
          expect(inside || outside, `${name}: "${line.textContent ?? ''}" is cut`).toBe(true);
        }
      }
    },
  );

  it('an explicit minCardHeight still wins, and classic keeps the source minimum', async () => {
    const custom = mount(<TimelineView {...base} timeline={{ minCardHeight: 64 }} />);
    await settled(custom.host, 500);
    const heights = (host: HTMLElement): number[] =>
      parts(host, 'timelineCard')
        .filter((card) => card.textContent?.includes('Short item 5'))
        .map((card) => card.offsetHeight);
    expect(heights(custom.host)).toEqual([64]);
    custom.unmount();
    const classic = mount(<TimelineView {...base} preset="classic" />);
    await settled(classic.host, 500);
    expect(heights(classic.host)).toEqual([80]);
  });
});

describe('default preset: navigation buttons fit inside the root', () => {
  const cases = [
    { view: 'list', compact: false },
    { view: 'list', compact: true },
    { view: 'timeline', compact: false },
    { view: 'timeline', compact: true },
  ] as const;

  it.each(cases)(
    '$view view, compact $compact: every button and its focus ring, at both ends',
    async ({ view, compact }) => {
      const size = compact ? { width: 390, height: 800 } : { width: 1200, height: 800 };
      const props = { ...base, shifts: { before: 1, after: 1 }, list: { navigationThreshold: 1 } };
      const { host } = mount(view === 'list' ? <ListView {...props} /> : <TimelineView {...props} />, size);
      const scroller = await settled(host, 500);
      const root = part(host, 'root').getBoundingClientRect();
      const check = (where: string): void => {
        for (const position of ['top', 'bottom'] as const) {
          const button = nav(host, position);
          if (!button) continue;
          const rect = button.getBoundingClientRect();
          const label = `${where}, ${position} "${button.textContent ?? ''}"`;
          expect(rect.top - RING - AIR, `${label}: top`).toBeGreaterThanOrEqual(root.top);
          expect(rect.bottom + RING + AIR, `${label}: bottom`).toBeLessThanOrEqual(root.bottom);
        }
      };
      check('landed');
      await scrollTo(scroller, 0);
      await frames(4);
      check('at the start');
      await scrollTo(scroller, scroller.scrollHeight);
      await frames(4);
      check('at the end');
    },
  );
});

describe('default preset: parts that belong to the schedule, not the page (ADR 0005 D6)', () => {
  it('keeps the compact scroll-to-top button inside the root, above the bottom band', async () => {
    const { host } = mount(<ListView {...base} />, { width: 390, height: 700 });
    const scroller = await settled(host, 500);
    await scrollTo(scroller, scroller.scrollHeight);
    await frames(6);
    const button = part(host, 'scrollTopButton');
    const rect = button.getBoundingClientRect();
    const root = part(host, 'root').getBoundingClientRect();
    const band = part(host, 'stickyBottom').getBoundingClientRect();
    expect(getComputedStyle(button).position).toBe('absolute');
    expect(rect.right).toBeLessThanOrEqual(root.right);
    expect(rect.bottom).toBeLessThanOrEqual(band.top);
  });

  it('draws the error state retry as an outlined button', async () => {
    const { host } = mount(<ListView {...base} error={new Error('down')} onRetry={() => undefined} />);
    await frames(4);
    const retry = host.querySelector<HTMLElement>('.rs-error-state button') as HTMLElement;
    expect(retry.textContent).toBe('Retry');
    expect(Number.parseFloat(getComputedStyle(retry).borderTopWidth)).toBeGreaterThanOrEqual(1);
  });
});
