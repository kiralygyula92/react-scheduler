import { page, userEvent } from 'vitest/browser';
import { createRef, type ReactElement, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ListView, type SchedulerHandle, type SchedulerProps } from '../../src/index';
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
  unmountAll,
  settled,
  until,
} from './support';

// The list-view browser scenarios (BR-L*), in real layout: Feature Dossier 07 §3, classic preset.
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

async function landedList(
  props: Partial<SchedulerProps<ParityItem>> = {},
): Promise<{ host: HTMLElement; scroller: HTMLElement }> {
  const { host } = mount(<ListView {...base} {...props} />);
  return { host, scroller: await settled(host, 600) };
}

/** Where a shift's section lands: its top below the sticky top and the 8 px align offset. */
function sectionTarget(host: HTMLElement, offset: number, extra = 0): number {
  const section = parts(host, 'shiftSection').find((candidate) => candidate.dataset['rsOffset'] === String(offset));
  return (section?.offsetTop ?? 0) - part(host, 'stickyTop').offsetHeight - 8 - extra;
}

function HeaderOwner(props: SchedulerProps<ParityItem> & { record: (value: boolean) => void }): ReactElement {
  const { record, ...rest } = props;
  const [expanded, setExpanded] = useState(true);
  return (
    <ListView
      {...rest}
      headerExpanded={expanded}
      onHeaderExpandedChange={(value) => {
        record(value);
        setExpanded(value);
      }}
    />
  );
}

describe('list browser scenarios', () => {
  it("[BR-L01] lands on the current shift; the previous shift's critical items pin with the carried-over tag", async () => {
    const { host, scroller } = await landedList();
    expect(Math.abs(scroller.scrollTop - sectionTarget(host, 0))).toBeLessThanOrEqual(1);
    expect(part(host, 'stickyTop').offsetHeight).toBe(152);
    expect(sectionTarget(host, 0)).toBe(452);
    expect(chipTitles(host)).toEqual(['Backup verification', 'Network follow-up']);
    const chip = parts(host, 'pinnedChip')[0] as HTMLElement;
    expect(parts(chip, 'tagPill').map((pill) => pill.textContent)).toEqual(['Inherited']);
    expect(part(chip, 'cardTimeLabel').textContent).toBe('Observed at: 1:48 AM – Present');
    await expect.element(page.getByRole('button', { name: 'Backup verification' }).first()).toBeInTheDocument();
  });

  it('[BR-L02] navigation labels follow the position (fixed: B-06: no count beside "View current shift")', async () => {
    const { host, scroller } = await landedList();
    await scrollTo(scroller, 0);
    await until(() => nav(host, 'top') === undefined, 3000, 'no top button at 0');
    expect(nav(host, 'bottom')?.textContent).toBe('View current shift');
    await scrollTo(scroller, 200);
    expect(nav(host, 'top')?.textContent).toBe('View previous shift(2 inherited)');
    expect(nav(host, 'bottom')?.textContent).toBe('View current shift');
    await scrollTo(scroller, scroller.scrollHeight);
    expect(nav(host, 'top')?.textContent).toBe('View current shift');
    expect(nav(host, 'bottom')).toBeUndefined();
  });

  it('[BR-L03] "View next shift" scrolls smoothly to the next section; the bottom button disappears', async () => {
    const { host, scroller } = await landedList();
    (nav(host, 'bottom') as HTMLElement).click();
    await settled(host, 1000);
    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    expect(Math.abs(scroller.scrollTop - Math.min(maxScroll, sectionTarget(host, 1)))).toBeLessThanOrEqual(1);
    expect(nav(host, 'bottom')).toBeUndefined();
  });

  it('[BR-L04] "View previous shift" targets the previous top with the 104 px extra, clamped to 0', async () => {
    const { host, scroller } = await landedList();
    expect(sectionTarget(host, -1, 104)).toBeLessThan(0);
    (nav(host, 'top') as HTMLElement).click();
    await settled(host, 1000);
    expect(scroller.scrollTop).toBe(0);
    expect(nav(host, 'top')).toBeUndefined();
  });

  // The source rendered three shifts, where the jump to the previous shift is also the jump to the
  // first one. With more or fewer shifts, every button press has to move the list and land where the
  // next press starts from: a jump to a middle earlier shift used to land 104 px inside the shift
  // before it (DQ-10), and a first section below the top of the list never counted as reached (DQ-11).
  it.each([
    { before: 2, after: 2 },
    { before: 0, after: 1 },
  ])('the buttons walk every shift and back, each press landing on its target: %o', async (shifts) => {
    const ref = createRef<SchedulerHandle<ParityItem>>();
    const jumps: number[] = [];
    const { host } = mount(
      <ListView
        {...base}
        shifts={shifts}
        ref={ref}
        onNavigate={(info) => {
          jumps.push(info.to.offset);
        }}
      />,
    );
    const scroller = await settled(host, 600);
    await scrollTo(scroller, 0);
    await settled(host, 300);

    const walk = async (position: 'top' | 'bottom'): Promise<number[]> => {
      const reached: number[] = [];
      for (let step = 0; step < 8; step++) {
        const button = nav(host, position);
        if (!button || button.hasAttribute('data-rs-disabled')) break;
        const before = scroller.scrollTop;
        const target = jumps.length;
        button.click();
        await until(() => jumps.length > target, 3000, 'a navigation');
        await settled(host, 800);
        expect(scroller.scrollTop, `${position} press ${String(step + 1)} moved`).not.toBe(before);
        reached.push(ref.current?.getActiveShift()?.offset ?? Number.NaN);
      }
      return reached;
    };

    // Each press lands on the shift it jumped to. The last one down may reach the end of the scroll
    // range first, which makes the last shift the active one (01 §L.5).
    const down = await walk('bottom');
    down.forEach((offset, index) => {
      const last = index === down.length - 1 && offset === shifts.after;
      expect(offset === jumps[index] || last, `press ${String(index + 1)} down`).toBe(true);
    });
    expect(down.at(-1)).toBe(shifts.after);

    const up = await walk('top');
    expect(up).toEqual(jumps.slice(down.length));
    expect(up.at(-1)).toBe(shifts.before === 0 ? 0 : -shifts.before);
    expect(up).toEqual([...up].sort((a, b) => b - a));
  });

  it('[BR-L05] pinning keeps its 22 px hysteresis around the sticky bottom', async () => {
    const { host, scroller } = await landedList();
    const card = cardByTitle(host, 'Safety inspection', 'listCard');
    const place = async (offset: number): Promise<boolean> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const line = part(host, 'stickyTop').getBoundingClientRect().bottom;
        const delta = card.getBoundingClientRect().top - (line + offset);
        if (Math.abs(delta) < 0.5) break;
        scroller.scrollTop += delta;
        await frames(3);
      }
      await frames(2);
      return chipTitles(host).includes('Safety inspection');
    };
    expect(await place(5)).toBe(false);
    expect(await place(-1)).toBe(false);
    expect(await place(-3)).toBe(true);
    expect(await place(20)).toBe(true);
    expect(await place(23)).toBe(false);
  });

  it('[BR-L06] a pinned chip opens its detail view', async () => {
    const { host } = await landedList();
    (parts(host, 'pinnedChip')[0] as HTMLElement).click();
    await expect.element(page.getByRole('dialog', { name: 'Backup verification' })).toBeVisible();
  });

  it('[BR-L07] the header signal follows the scroll position; the threshold is the third card (fixed: B-08)', async () => {
    const values: boolean[] = [];
    const { host } = mount(<HeaderOwner {...base} record={(value) => values.push(value)} />);
    const scroller = await settled(host, 600);
    const expanded = async (top: number): Promise<boolean> => {
      await scrollTo(scroller, top);
      return values.at(-1) ?? true;
    };
    expect(await expanded(0)).toBe(true);
    expect(await expanded(300)).toBe(true);
    expect(await expanded(452)).toBe(true);
    expect(await expanded(700)).toBe(true);
    // The source collapsed at 900: its threshold was the 2nd card because the critical first card's
    // sentinel counted as a card (B-08). The threshold is now the 3rd card's bottom + 8.
    const current = parts(host, 'shiftSection').find((section) => section.dataset['rsOffset'] === '0') as HTMLElement;
    const third = parts(current, 'listCard')[2] as HTMLElement;
    const threshold = third.offsetTop + third.offsetHeight + 8;
    expect(threshold).toBeGreaterThan(900);
    expect(await expanded(900)).toBe(true);
    expect(await expanded(threshold)).toBe(true);
    expect(await expanded(threshold + 1)).toBe(false);
    expect(await expanded(1049)).toBe(false);
    expect(await expanded(600)).toBe(true);
    expect(await expanded(0)).toBe(true);
  });

  it('[BR-L08] a 390 px root is compact: stacked cards, taller sticky padding, a scroll-to-top button', async () => {
    await page.viewport(390, 844);
    try {
      const { host } = mount(<ListView {...base} />, { width: 390, height: 844 });
      const scroller = await settled(host, 600);
      expect(getComputedStyle(host.querySelector('.rs-card__content') as Element).flexDirection).toBe('column-reverse');
      expect(getComputedStyle(part(host, 'stickyTop')).paddingBottom).toBe('28px');
      expect(getComputedStyle(nav(host, 'top') ?? (nav(host, 'bottom') as HTMLElement)).flexDirection).toBe('column');
      // Pins change near the top and the sticky compensation (B-21) moves scrollTop with them, so the
      // assertions use the settled position.
      await scrollTo(scroller, 96);
      await frames(3);
      expect(scroller.scrollTop).toBeLessThanOrEqual(96);
      expect(parts(host, 'scrollTopButton')).toHaveLength(0);
      await scrollTo(scroller, 400);
      await until(
        () => scroller.scrollTop > 96 && parts(host, 'scrollTopButton').length === 1,
        3000,
        'scroll-to-top button',
      );
      const button = part(host, 'scrollTopButton');
      const rect = button.getBoundingClientRect();
      expect([rect.width, rect.height]).toEqual([48, 48]);
      expect([Math.round(window.innerWidth - rect.right), Math.round(window.innerHeight - rect.bottom)]).toEqual([
        16, 16,
      ]);
      await userEvent.click(button);
      await until(() => scroller.scrollTop === 0, 3000, 'scroll to top');
    } finally {
      await page.viewport(1440, 900);
    }
  });

  it('[BR-L09] many pinned chips: mandatory x snap and edge fades only where the strip can scroll', async () => {
    const pinnedMany = fixtures['pinnedMany'] as NonNullable<(typeof fixtures)['pinnedMany']>;
    const { host } = mount(
      <ListView items={pinnedMany.items} date={pinnedMany.date} now={pinnedMany.now} preset="classic" />,
    );
    await settled(host, 800);
    expect(parts(host, 'pinnedChip')).toHaveLength(6);
    const track = part(host, 'pinnedStripTrack');
    expect(getComputedStyle(track).scrollSnapType).toBe('x mandatory');
    const sides = (): string[] => parts(host, 'edgeFade').map((fade) => fade.dataset['rsSide'] ?? '');
    await until(() => sides().join() === 'end', 2000, 'end fade only');
    track.scrollLeft = 300;
    await until(() => sides().join() === 'start,end', 2000, 'both fades');
  });
});
