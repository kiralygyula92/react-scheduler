import { page, userEvent } from 'vitest/browser';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ListView, type SchedulerHandle, type SchedulerProps, TimelineView } from '../../src/index';
import type { ParityItem } from '../support/items';
import { chipTitles, fixtures, frames, mount, nav, part, parts, scrollTo, settled, unmountAll, until } from './support';

// v1.0 acceptance checks that need real layout and focus (Feature Dossier 05): F-07, F-08, F-13, F-16
// and F-19, in Chromium, Firefox and WebKit.
const baseline = fixtures['baseline'] as NonNullable<(typeof fixtures)['baseline']>;
const base: SchedulerProps<ParityItem> = {
  items: baseline.items,
  date: baseline.date,
  now: baseline.now,
  preset: 'classic',
};

afterEach(async () => {
  unmountAll();
  document.querySelectorAll('[data-test-before]').forEach((element) => element.remove());
  await page.viewport(1440, 900);
});

describe('v1.0 acceptance checks in the browser', () => {
  it('F-07: content does not jump when the pinned strip gains its first chip', async () => {
    const { host } = mount(<ListView {...base} />);
    const scroller = await settled(host, 500);
    await scrollTo(scroller, 0);
    await until(() => chipTitles(host).length === 0, 3000, 'an empty strip');
    const probe = parts(host, 'listCard').at(-1) as HTMLElement;
    let appeared = false;
    for (let step = 0; step < 200 && !appeared; step++) {
      const before = probe.getBoundingClientRect().top;
      const from = scroller.scrollTop;
      scroller.scrollTop = from + 20;
      const moved = scroller.scrollTop - from;
      await frames(4);
      appeared = chipTitles(host).length > 0;
      // The strip's growth is compensated in the same frame (B-21): the content moved by the scroll only.
      expect(Math.abs(probe.getBoundingClientRect().top - (before - moved))).toBeLessThanOrEqual(1);
    }
    expect(appeared).toBe(true);
  });

  it.each(['list', 'timeline'] as const)(
    'F-08: with before 2, the top button leads from the start of shift −1 to shift −2 (%s view)',
    async (view) => {
      const ref = createRef<SchedulerHandle<ParityItem>>();
      const props = { ...base, shifts: { before: 2, after: 2 }, ref };
      const { host } = mount(view === 'list' ? <ListView {...props} /> : <TimelineView {...props} />);
      const scroller = await settled(host, 500);
      // From the current shift, the top button goes to shift −1, at its own start: the previous-jump
      // offset of F-08 only applies to the first shift (DQ-10). Every frame of the way the scroll only
      // moves toward its target: the strip collapsing on arrival is not compensated and then
      // corrected back (B-21).
      const positions: number[] = [];
      let sampling = true;
      const sample = (): void => {
        positions.push(scroller.scrollTop);
        if (sampling) requestAnimationFrame(sample);
      };
      sample();
      (nav(host, 'top') as HTMLElement).click();
      await until(() => nav(host, 'top')?.textContent?.includes('View earlier shift') === true, 4000, 'shift −1');
      await settled(host, 300);
      sampling = false;
      const final = scroller.scrollTop;
      expect(Math.min(...positions)).toBeGreaterThanOrEqual(final - 1);
      (nav(host, 'top') as HTMLElement).click();
      await until(() => ref.current?.getActiveShift()?.offset === -2, 4000, 'shift −2');
    },
  );

  it('F-13: the overflow dialog opens, sorts, pages and closes by keyboard alone', async () => {
    const { host } = mount(<TimelineView {...base} overflowPageSize={1} />);
    await settled(host, 500);
    const chip = part(host, 'moreChip');
    chip.focus();
    await userEvent.keyboard('{Enter}');
    await until(() => document.querySelector('dialog[open]') !== null, 3000, 'dialog');
    const dialog = document.querySelector('dialog[open]') as HTMLElement;
    const pressUntil = async (target: () => Element | null | undefined): Promise<void> => {
      for (let tab = 0; tab < 20 && document.activeElement !== target(); tab++) await userEvent.tab();
      expect(document.activeElement).toBe(target());
      await userEvent.keyboard('{Enter}');
    };
    const header = (): HTMLElement =>
      [...dialog.querySelectorAll<HTMLElement>('th')].find((th) => th.textContent === 'Severity') as HTMLElement;
    await pressUntil(() => header().querySelector('button'));
    await until(() => header().getAttribute('aria-sort') === 'ascending', 2000, 'sorted by severity');
    const next = (): Element | null | undefined =>
      [...dialog.querySelectorAll('[data-rs-part="pagination"] button')].find(
        (button) => button.textContent === 'Next',
      );
    await pressUntil(next);
    await until(() => dialog.querySelector('[aria-current="page"]')?.textContent === '2', 2000, 'page 2');
    await userEvent.keyboard('{Escape}');
    await until(() => document.querySelector('dialog[open]') === null, 3000, 'dialog closed');
    expect(document.activeElement).toBe(chip);
  });

  it('F-16: a 1000 px root inside a 390 px viewport keeps the regular layout (B-16)', async () => {
    await page.viewport(390, 844);
    const { host } = mount(<ListView {...base} />, { width: 1000, height: 800 });
    await settled(host, 500);
    expect(part(host, 'root').hasAttribute('data-rs-compact')).toBe(false);
  });

  it.each(['list', 'timeline', 'compact list'] as const)('F-19: the tab order of the %s', async (view) => {
    const compact = view === 'compact list';
    if (compact) await page.viewport(390, 844);
    // The compact scroll-to-top button mounts and unmounts with the scroll the walk itself causes, and
    // Firefox can skip a button that appears under the focus it is moving (GAPS G14). Its place in the
    // order is checked on its own in the next test; this walk checks everything else.
    const element: ReactElement =
      view === 'timeline' ? (
        <TimelineView {...base} />
      ) : (
        <ListView {...base} enableAnimations={false} enableScrollTopButton={!compact} />
      );
    const { host } = mount(element, compact ? { width: 390, height: 844 } : undefined);
    const scroller = await settled(host, 500);
    if (compact) {
      await scrollTo(scroller, scroller.scrollTop + 400);
      // The pinned strip follows the scroll through an observer, a frame or several later. A fixed
      // number of frames was enough on an idle machine and not under load (GAPS G14): the walk
      // began while chips were still arriving. Wait until the strip has stopped changing.
      let last = '';
      let still = 0;
      for (let frame = 0; frame < 240 && still < 10; frame++) {
        await frames(1);
        const now = chipTitles(host).join('|');
        still = now === last ? still + 1 : 0;
        last = now;
      }
    }
    await frames(4);
    // Root → chips → top navigation → cards in section order → "+more" chips → bottom navigation.
    // Focus scrolls the view, and the list hides a navigation button whose shift is the first or last
    // (F-08), so the order is checked as the keys walk the view.
    const rank = (element: Element): number => {
      const part = element.closest<HTMLElement>('[data-rs-part]')?.dataset['rsPart'];
      const position = (element as HTMLElement).dataset['rsPosition'];
      if (part === 'pinnedChip') return 0;
      if (part === 'navButton') return position === 'top' ? 1 : 4;
      if (part === 'cardActivator') return 2;
      if (part === 'moreChip') return 3;
      if (part === 'scrollTopButton') return 5;
      return Number.NaN;
    };
    const all = [...host.querySelectorAll('*')];
    const before = document.createElement('button');
    before.dataset['testBefore'] = '';
    document.body.prepend(before);
    before.focus();
    const order: Element[] = [];
    for (let tab = 0; tab < 80; tab++) {
      await userEvent.tab();
      if (!host.contains(document.activeElement)) break;
      order.push(document.activeElement as Element);
    }
    const keys = order.map((element) => [rank(element), all.indexOf(element)] as const);
    expect(keys.every(([category]) => Number.isFinite(category))).toBe(true);
    expect(keys).toEqual([...keys].sort(([a, i], [b, j]) => a - b || i - j));
    expect(new Set(order.filter((element) => rank(element) === 2))).toEqual(new Set(parts(host, 'cardActivator')));
    expect(rank(order[0] as Element)).toBe(0);
    if (view === 'timeline') expect(order.at(-1)).toBe(nav(host, 'bottom'));
  });

  it('F-19: the scroll-to-top button of the compact list is the last stop once it shows', async () => {
    await page.viewport(390, 844);
    const { host } = mount(<ListView {...base} enableAnimations={false} />, { width: 390, height: 844 });
    const scroller = await settled(host, 500);
    await scrollTo(scroller, scroller.scrollHeight);
    await until(() => parts(host, 'scrollTopButton').length > 0, 4000, 'scroll-to-top button');
    await settled(host, 300);

    // From the last card, forward: past the bottom navigation when there is one, then the button.
    const cards = parts(host, 'cardActivator');
    (cards.at(-1) as HTMLElement).focus();
    await frames(2);
    const stops: Element[] = [];
    for (let tab = 0; tab < 4; tab++) {
      await userEvent.tab();
      if (!host.contains(document.activeElement)) break;
      stops.push(document.activeElement as Element);
    }
    expect(stops.at(-1)).toBe(parts(host, 'scrollTopButton')[0]);
  });
});
