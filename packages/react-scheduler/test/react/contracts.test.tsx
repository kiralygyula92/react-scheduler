// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ListView, Scheduler, type SchedulerHandle, type SchedulerProps, TimelineView } from '../../src/index';
import { computeTimelineLayout } from '../../src/core/layout';
import type { TimelineLayout, TimelineLayoutOptions } from '../../src/core/types';
import { fixture, type ParityItem, parityLayoutOptions } from '../parity/adapter';
import { FakeIntersectionObserver, mockTop } from '../support/dom-fakes';
import { injectListLayout, injectTimelineLayout } from '../support/layout';
import {
  advance,
  frames,
  part,
  parts,
  renderUi,
  scrollCalls,
  scrollTo,
  settle,
  setupComponentEnvironment,
} from '../support/react';

// Component contracts (Feature Dossier 04 §5–§7, 05 F-14…F-26): controlled state, middleware, render
// props, flags, events and the imperative handle.
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const base = { items: baseline.items, date: baseline.date, now: baseline.now };

async function flushLazy(): Promise<void> {
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

const listLayout = {
  sticky: 24,
  client: 700,
  scroll: 4000,
  sections: [0, 612, 2400],
  header: 60,
  cards: (index: number) => ({ top: 672 + index * 110, height: 100 }),
};

function nav(container: ParentNode, position: 'top' | 'bottom'): HTMLElement {
  return parts(container, 'navButton').find((button) => button.dataset['rsPosition'] === position) as HTMLElement;
}

/** Places the timeline pin line at the scroller top (0) and critical sentinels above or below it. */
function pinTimeline(container: HTMLElement, above: readonly string[]): void {
  mockTop(part(container, 'scroller'), () => 0);
  for (const card of parts(container, 'timelineCard')) {
    const sentinel = card.querySelector<HTMLElement>('[data-rs-part="pinSentinel"]');
    const title = card.querySelector('[data-rs-part="cardTitle"]')?.textContent ?? '';
    if (sentinel) mockTop(sentinel, () => (above.includes(title) ? -5 : 400));
  }
  act(() => {
    for (const observer of FakeIntersectionObserver.active()) observer.trigger();
  });
}

describe('controlled and uncontrolled state', () => {
  it('opens and closes a controlled detail view only through the prop', async () => {
    const onOpenItemIdChange = vi.fn();
    const { rerender } = renderUi(<ListView {...base} openItemId="c02" onOpenItemIdChange={onOpenItemIdChange} />);
    await flushLazy();
    const dialog = screen.getByRole('dialog', { name: 'Delivery delay' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onOpenItemIdChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('dialog', { name: 'Delivery delay' })).toBeDefined();
    act(() => rerender(<ListView {...base} openItemId={null} onOpenItemIdChange={onOpenItemIdChange} />));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a controlled overflow dialog and keeps a controlled sort until the prop changes', async () => {
    const onOverflowSortChange = vi.fn();
    const ref = createRef<SchedulerHandle<ParityItem>>();
    const probe = renderUi(<TimelineView {...base} ref={ref} />);
    const groupId = ref.current?.getLayout()?.overflow[0]?.id ?? '';
    probe.unmount();
    const sort = { column: 'time', direction: 'asc' as const };
    const { rerender } = renderUi(
      <TimelineView
        {...base}
        openOverflowId={groupId}
        overflowSort={sort}
        onOverflowSortChange={onOverflowSortChange}
      />,
    );
    await flushLazy();
    const dialog = screen.getByRole('dialog', { name: 'More overlapping items (2)' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Title' }));
    expect(onOverflowSortChange).toHaveBeenCalledWith({ column: 'title', direction: 'asc' });
    const firstTitle = (): string | null | undefined =>
      within(dialog).getAllByRole('row')[1]?.querySelector('.rs-overflow-table__title')?.textContent;
    expect(firstTitle()).toBe('Inventory count');
    act(() =>
      rerender(
        <TimelineView
          {...base}
          openOverflowId={groupId}
          overflowSort={{ column: 'title', direction: 'asc' }}
          onOverflowSortChange={onOverflowSortChange}
        />,
      ),
    );
    expect(firstTitle()).toBe('Equipment check');
  });

  it('[B-23] an absent date is captured once: re-renders do not land again', () => {
    const { container, rerender } = renderUi(
      <ListView items={baseline.items} defaultDate={baseline.date} now={baseline.now} />,
    );
    const scroller = injectListLayout(container, listLayout);
    settle();
    scrollTo(scroller, 900);
    for (let index = 0; index < 3; index++) {
      act(() => rerender(<ListView items={baseline.items} defaultDate={baseline.date} now={baseline.now} />));
      settle();
    }
    expect(scroller.scrollTop).toBe(900);
  });

  it('shows the default view and switches an uncontrolled one through the handle-less state', () => {
    const { container } = renderUi(<Scheduler {...base} defaultView="timeline" />);
    expect(part(container, 'root').dataset['rsView']).toBe('timeline');
  });
});

describe('middleware (F-22) and event order (F-25)', () => {
  it('runs onItemActivate first; not calling next() cancels the detail view and its callbacks', async () => {
    const calls: string[] = [];
    const { rerender } = renderUi(
      <ListView
        {...base}
        handlers={{ onItemActivate: (ctx, next) => (calls.push(`middleware:${ctx.source}`), next()) }}
        onOpenItemIdChange={(id) => calls.push(`change:${id}`)}
        onItemOpen={(item) => calls.push(`open:${item.id}`)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delivery delay' }));
    expect(calls).toEqual(['middleware:listCard', 'change:c02', 'open:c02']);
    await flushLazy();
    act(() => rerender(<ListView {...base} handlers={{ onItemActivate: () => undefined }} />));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Staff briefing' }));
    await flushLazy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('runs the default when an asynchronous middleware calls next() later', async () => {
    let resume: () => void = () => undefined;
    renderUi(<ListView {...base} handlers={{ onItemActivate: (_ctx, next) => void (resume = next) }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delivery delay' }));
    await flushLazy();
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => resume());
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'Delivery delay' })).toBeDefined();
  });

  it('cancels navigation, scroll-to-top and "+more" when their middleware does not call next()', () => {
    const onNavigate = vi.fn();
    const list = renderUi(
      <ListView
        {...base}
        compact
        handlers={{ onNavigate: () => undefined, onScrollTop: () => undefined }}
        onNavigate={onNavigate}
      />,
    );
    const scroller = injectListLayout(list.container, listLayout);
    settle();
    scrollTo(scroller, 900);
    scrollCalls.length = 0;
    fireEvent.click(nav(list.container, 'bottom'));
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }));
    expect(scrollCalls).toHaveLength(0);
    expect(scroller.scrollTop).toBe(900);
    expect(onNavigate).not.toHaveBeenCalled();
    list.unmount();

    const onOverflowOpen = vi.fn();
    renderUi(<TimelineView {...base} handlers={{ onMoreActivate: () => undefined }} onOverflowOpen={onOverflowOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /more items from/ }));
    expect(onOverflowOpen).not.toHaveBeenCalled();
  });

  it('lets onItemKeyDown cancel keyboard activation', () => {
    const onItemKeyDown = vi.fn();
    renderUi(<ListView {...base} handlers={{ onItemKeyDown }} />);
    const card = screen.getByRole('button', { name: 'Delivery delay' });
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    act(() => {
      card.dispatchEvent(event);
    });
    const [ctx] = onItemKeyDown.mock.calls[0] as [{ item: { id: string } }];
    expect(ctx.item.id).toBe('c02');
    expect(event.defaultPrevented).toBe(true);
  });

  it('calls onNavigate after scrolling, and the handle navigates with position api', () => {
    const onNavigate = vi.fn();
    const ref = createRef<SchedulerHandle<ParityItem>>();
    const { container } = renderUi(<TimelineView {...base} ref={ref} onNavigate={onNavigate} />);
    injectTimelineLayout(container, 800);
    settle();
    fireEvent.click(nav(container, 'bottom'));
    expect(onNavigate).toHaveBeenLastCalledWith(expect.objectContaining({ position: 'bottom', view: 'timeline' }));
    act(() => ref.current?.scrollToShift('previous'));
    expect(onNavigate).toHaveBeenLastCalledWith(expect.objectContaining({ position: 'api' }));
  });
});

describe('render props (F-23)', () => {
  it('renderItem replaces cards; its activator works through getItemProps; defaultRender keeps the default', () => {
    const onItemOpen = vi.fn();
    const { container } = renderUi(
      <ListView
        {...base}
        onItemOpen={onItemOpen}
        renderItem={(item, ctx) =>
          item.id === 'c02' ? (
            <li key={item.id} className="custom">
              <button {...ctx.getItemProps()}>
                <span id={ctx.getItemProps()['aria-labelledby']}>{item.title}</span>
              </button>
            </li>
          ) : (
            ctx.defaultRender()
          )
        }
      />,
    );
    expect(container.querySelectorAll('.custom')).toHaveLength(1);
    expect(parts(container, 'listCard')).toHaveLength(16);
    fireEvent.click(screen.getByRole('button', { name: 'Delivery delay' }));
    expect(onItemOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'c02' }), { source: 'listCard' });
  });

  it('renders the content, label, header, empty, loading, error and header render props', () => {
    const onRetry = vi.fn();
    const { container, rerender } = renderUi(
      <ListView
        {...base}
        aria-label={undefined}
        renderCardContent={(item) => <span className="content">{item.title}</span>}
        renderShiftHeader={(segment, ctx) => (
          <span className="head">{`${ctx.defaultTitle} / ${segment.items.length}`}</span>
        )}
        renderNavLabel={(ctx) => <span className="nav">{ctx.position}</span>}
        renderHeader={(ctx) => <span className="header">{String(ctx.expanded)}</span>}
      />,
    );
    expect(container.querySelectorAll('.content')).toHaveLength(17);
    expect([...container.querySelectorAll('.head')].map((node) => node.textContent)).toEqual([
      'Previous shift / 4',
      'Current shift / 10',
      'Next shift / 3',
    ]);
    expect(container.querySelector('.nav')?.textContent).toMatch(/top|bottom/);
    expect(part(container, 'header').textContent).toBe('true');
    expect(part(container, 'root').getAttribute('aria-labelledby')).toBe(part(container, 'header').id);

    act(() => rerender(<ListView {...base} items={[]} renderEmpty={(ctx) => <em>{ctx.scope}</em>} />));
    expect(part(container, 'emptyState').textContent).toBe('all');
    act(() => rerender(<ListView {...base} loading renderLoading={() => <em>wait</em>} />));
    expect(part(container, 'body').textContent).not.toBe('');
    act(() => rerender(<ListView {...base} error={new Error('x')} onRetry={onRetry} />));
    fireEvent.click(within(part(container, 'errorState')).getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
    act(() => rerender(<ListView {...base} error="x" renderError={(ctx) => <em>{String(ctx.error)}</em>} />));
    expect(part(container, 'errorState').textContent).toBe('x');
  });

  it('renders renderTimeLabel, renderMoreLabel and renderItemDetail', async () => {
    renderUi(
      <TimelineView
        {...base}
        renderTimeLabel={(_item, ctx) => `[${ctx.defaultLabel}]`}
        renderMoreLabel={(group) => `+${group.items.length}`}
        renderItemDetail={(ctx) => (
          <div role="dialog" aria-label={ctx.item.title}>
            <button type="button" onClick={ctx.close}>
              {ctx.source}
            </button>
          </div>
        )}
      />,
    );
    expect(screen.getByText('[9:00 AM – 10:30 AM]')).toBeDefined();
    expect(screen.getByRole('button', { name: /more items from/ }).textContent).toBe('+2');
    fireEvent.click(screen.getByRole('button', { name: 'Delivery delay' }));
    const dialog = screen.getByRole('dialog', { name: 'Delivery delay' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'timelineCard' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await flushLazy();
  });
});

describe('pinning, the pinned strip and the handle', () => {
  it('pins critical cards that passed the line, reports them and opens their detail from a chip (BR-L06)', async () => {
    const onPinnedChange = vi.fn();
    const ref = createRef<SchedulerHandle<ParityItem>>();
    const { container } = renderUi(<TimelineView {...base} ref={ref} onPinnedChange={onPinnedChange} />);
    injectTimelineLayout(container, 800);
    settle();
    pinTimeline(container, ['Backup verification', 'Network follow-up']);
    settle();
    const chips = parts(container, 'pinnedChip');
    expect(chips.map((chip) => part(chip, 'cardTitle').textContent)).toEqual([
      'Backup verification',
      'Network follow-up',
    ]);
    expect(onPinnedChange).toHaveBeenLastCalledWith(['p02', 'p03'], { added: ['p02', 'p03'], removed: [] });
    expect(ref.current?.getPinnedIds()).toEqual(['p02', 'p03']);
    // Carried-over chips keep their tags and gain the carried-over one (B-25).
    expect(parts(chips[0] as HTMLElement, 'tagPill').map((pill) => pill.textContent)).toEqual(['Inherited']);
    fireEvent.click(within(part(container, 'pinnedStrip')).getByRole('button', { name: 'Backup verification' }));
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'Backup verification' })).toBeDefined();
  });

  it('[B-17] the strip is a labeled region with a list; a separate live region announces the count, throttled', () => {
    const { container } = renderUi(<TimelineView {...base} />);
    injectTimelineLayout(container, 800);
    settle();
    const strip = screen.getByRole('region', { name: 'Pinned items' });
    expect(strip.getAttribute('aria-live')).toBeNull();
    expect(part(strip, 'pinnedStripTrack').getAttribute('role')).toBe('list');
    pinTimeline(container, ['Backup verification']);
    advance(10);
    const live = part(container, 'liveRegion');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('1 item pinned');
    pinTimeline(container, ['Backup verification', 'Network follow-up']);
    advance(100);
    expect(live.textContent).toBe('1 item pinned');
    advance(1000);
    expect(live.textContent).toBe('2 items pinned');
  });

  it('exposes the imperative handle (F-26)', async () => {
    const ref = createRef<SchedulerHandle<ParityItem>>();
    const { container } = renderUi(<TimelineView {...base} ref={ref} />);
    injectTimelineLayout(container, 800);
    settle();
    const handle = ref.current as SchedulerHandle<ParityItem>;
    expect(handle.getScrollElement()).toBe(part(container, 'scroller'));
    expect(handle.getActiveShift()?.offset).toBe(0);
    expect(handle.getLayout()?.cards.length).toBeGreaterThan(0);
    act(() => handle.scrollToTime('2031-03-12T12:00:00', { smooth: false }));
    frames(3);
    expect(part(container, 'scroller').scrollTop).toBe(2072 + 4 * 172 - 86);
    act(() => handle.scrollToItem('c06', { smooth: false }));
    frames(3);
    act(() => handle.focusItem('c06'));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Safety inspection' }));
    act(() => handle.openItem('c06'));
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'Safety inspection' })).toBeDefined();
    act(() => handle.closeItem());
    expect(screen.queryByRole('dialog')).toBeNull();
    const group = handle.getLayout()?.overflow[0];
    act(() => handle.openOverflow(group?.id ?? ''));
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'More overlapping items (2)' })).toBeDefined();
    act(() => handle.closeOverflow());
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => handle.refreshPinning());
  });
});

describe('feature flags (F-24)', () => {
  it('removes the DOM of each disabled feature', () => {
    const { container } = renderUi(
      <TimelineView
        {...base}
        now="2031-03-12T10:41:00"
        enablePinning={false}
        enableNavigation={false}
        enableNowIndicator={false}
        enableOffShiftBands={false}
      />,
    );
    for (const name of ['pinnedStrip', 'pinSentinel', 'navButton', 'nowLine', 'offShiftBand']) {
      expect(parts(container, name), name).toHaveLength(0);
    }
  });

  it('turns off the count, the scroll-to-top button, animations, the dialogs and the header signal', () => {
    const onHeaderExpandedChange = vi.fn();
    const onOverflowOpen = vi.fn();
    const onItemOpen = vi.fn();
    const list = renderUi(
      <ListView
        {...base}
        compact
        enableCarriedOverCount={false}
        enableScrollTopButton={false}
        enableAnimations={false}
        enableHeaderSignal={false}
        onHeaderExpandedChange={onHeaderExpandedChange}
      />,
    );
    const scroller = injectListLayout(list.container, listLayout);
    settle();
    scrollTo(scroller, 200);
    expect(nav(list.container, 'top').textContent).toBe('View previous shift');
    expect(parts(list.container, 'scrollTopButton')).toHaveLength(0);
    scrollCalls.length = 0;
    fireEvent.click(nav(list.container, 'bottom'));
    expect(scrollCalls.filter((call) => call.behavior === 'smooth')).toHaveLength(0);
    scrollTo(scroller, 2000);
    expect(onHeaderExpandedChange).not.toHaveBeenCalled();
    list.unmount();

    renderUi(
      <TimelineView
        {...base}
        enableOverflowDialog={false}
        enableItemDetail={false}
        onOverflowOpen={onOverflowOpen}
        onItemOpen={onItemOpen}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more items from/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Delivery delay' }));
    expect(onOverflowOpen).toHaveBeenCalledTimes(1);
    expect(onItemOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps tooltips off with enableTooltips false while the hint stays the description', () => {
    const { container } = renderUi(<TimelineView {...base} enableTooltips={false} />);
    const bottom = nav(container, 'bottom');
    fireEvent.pointerEnter(bottom);
    const tooltip = document.getElementById(bottom.getAttribute('aria-describedby') ?? '') as HTMLElement;
    expect(tooltip.className).toContain('rs-visually-hidden');
    expect(tooltip.textContent).toBe('Scroll to next shift start');
  });

  it('[BR-T08/jsdom] shows the hint as a tooltip on hover (the browser test measures it)', () => {
    const { container } = renderUi(<TimelineView {...base} />);
    const bottom = nav(container, 'bottom');
    fireEvent.pointerEnter(bottom);
    const tooltip = document.getElementById(bottom.getAttribute('aria-describedby') ?? '') as HTMLElement;
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(tooltip.className).not.toContain('rs-visually-hidden');
    expect(tooltip.textContent).toBe('Scroll to next shift start');
    fireEvent.pointerLeave(bottom);
    expect(tooltip.className).toContain('rs-visually-hidden');
  });
});

describe('overflow table columns', () => {
  it('fixes the actions column at 92 px in classic and 96 px in the default preset (GAPS G11)', async () => {
    for (const [preset, width] of [
      ['classic', '92px'],
      ['default', '96px'],
    ] as const) {
      const { unmount } = renderUi(<TimelineView {...base} preset={preset} />);
      settle();
      fireEvent.click(document.querySelector('[data-rs-part="moreChip"]') as HTMLElement);
      await flushLazy();
      const header = screen.getByRole('columnheader', { name: 'Actions' });
      expect([header.style.width, header.style.minWidth, header.style.maxWidth]).toEqual([width, width, width]);
      unmount();
    }
  });
});

describe('ordering (F-02)', () => {
  // Reverse alphabetical: unlike the placement order in every respect that matters here.
  const byTitleDescending = (a: ParityItem, b: ParityItem): number => b.title.localeCompare(a.title);
  const titles = (root: ParentNode, name: string): string[] =>
    parts(root, name).map((card) => part(card, 'cardTitle').textContent ?? '');
  const sorted = (values: readonly string[]): string[] => [...values].sort((a, b) => b.localeCompare(a));

  it('a consumer compareItems orders the list, the timeline placement and the pinned strip together', () => {
    const list = renderUi(<ListView {...base} compareItems={byTitleDescending} />);
    settle();
    for (const section of parts(list.container, 'shiftSection')) {
      const own = titles(section, 'listCard');
      expect(own).toEqual(sorted(own));
    }
    list.unmount();

    // The placement sequence decides the columns (time placement, crowded day): the component's are
    // the engine's for this comparator, and differ from the default order's.
    const crowded = fixture('crowded');
    const ref = createRef<SchedulerHandle<ParityItem>>();
    const timeline = renderUi(
      <TimelineView
        items={crowded.items}
        date={crowded.date}
        now={crowded.now}
        timeline={{ columnPlacement: 'time' }}
        ref={ref}
        compareItems={byTitleDescending}
      />,
    );
    settle();
    const columns = (layout: TimelineLayout<ParityItem> | null): Record<string, number[]> =>
      Object.fromEntries((layout?.cards ?? []).map((card) => [card.item.id, [card.column, card.columns]]));
    const options = parityLayoutOptions(crowded.date, false, {
      columnPlacement: 'time',
    }) as TimelineLayoutOptions<ParityItem>;
    const placed = columns(ref.current?.getLayout() ?? null);
    const engine = (extra: Partial<TimelineLayoutOptions<ParityItem>>): Record<string, number[]> =>
      columns(computeTimelineLayout(crowded.items, { ...options, ...extra }));
    expect(placed).toEqual(engine({ compareItems: byTitleDescending }));
    expect(placed).not.toEqual(engine({}));
    timeline.unmount();

    const { container } = renderUi(<TimelineView {...base} compareItems={byTitleDescending} />);
    injectTimelineLayout(container, 800);
    settle();
    pinTimeline(container, ['Backup verification', 'Network follow-up']);
    settle();
    const chips = titles(part(container, 'pinnedStrip'), 'pinnedChip');
    expect(chips).toEqual(['Network follow-up', 'Backup verification']);
  });
});

describe('middleware cancels every interaction (F-22)', () => {
  // Each interaction twice: a middleware that does not call next() cancels the default and its
  // callbacks; one that does lets both run (the control).
  const cases = [
    ['cancelled', false],
    ['passed on', true],
  ] as const;
  const middleware =
    (runs: boolean) =>
    (_ctx: unknown, next: () => void): void => {
      if (runs) next();
    };

  it.each(cases)('onOverflowSort, onOverflowPage and onOverflowClose (%s)', async (_name, runs) => {
    const onOverflowSortChange = vi.fn();
    const onOverflowPageChange = vi.fn();
    const onOpenOverflowIdChange = vi.fn();
    renderUi(
      <TimelineView
        {...base}
        overflowPageSize={1}
        handlers={{
          onOverflowSort: middleware(runs),
          onOverflowPage: middleware(runs),
          onOverflowClose: middleware(runs),
        }}
        onOverflowSortChange={onOverflowSortChange}
        onOverflowPageChange={onOverflowPageChange}
        onOpenOverflowIdChange={onOpenOverflowIdChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more items from/ }));
    await flushLazy();
    onOpenOverflowIdChange.mockClear();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Severity' }));
    expect(onOverflowSortChange).toHaveBeenCalledTimes(runs ? 1 : 0);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(onOverflowPageChange).toHaveBeenCalledTimes(runs ? 1 : 0);
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1) as HTMLElement);
    expect(onOpenOverflowIdChange).toHaveBeenCalledTimes(runs ? 1 : 0);
    expect(screen.queryByRole('dialog') !== null).toBe(!runs);
  });

  it.each(cases)('onDetailClose (%s)', async (_name, runs) => {
    const onOpenItemIdChange = vi.fn();
    renderUi(
      <ListView {...base} handlers={{ onDetailClose: middleware(runs) }} onOpenItemIdChange={onOpenItemIdChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delivery delay' }));
    await flushLazy();
    onOpenItemIdChange.mockClear();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    expect(onOpenItemIdChange).toHaveBeenCalledTimes(runs ? 1 : 0);
    expect(screen.queryByRole('dialog') !== null).toBe(!runs);
  });

  it.each(cases)('onPin (%s)', (_name, runs) => {
    const onPinnedChange = vi.fn();
    const { container } = renderUi(
      <TimelineView {...base} handlers={{ onPin: middleware(runs) }} onPinnedChange={onPinnedChange} />,
    );
    injectTimelineLayout(container, 800);
    settle();
    pinTimeline(container, ['Backup verification']);
    settle();
    expect(parts(container, 'pinnedChip')).toHaveLength(runs ? 1 : 0);
    expect(onPinnedChange).toHaveBeenCalledTimes(runs ? 1 : 0);
  });

  it.each(cases)('onHeaderSignal (%s)', (_name, runs) => {
    const onHeaderExpandedChange = vi.fn();
    const { container } = renderUi(
      <ListView
        {...base}
        compact
        handlers={{ onHeaderSignal: middleware(runs) }}
        onHeaderExpandedChange={onHeaderExpandedChange}
      />,
    );
    const scroller = injectListLayout(container, listLayout);
    settle();
    onHeaderExpandedChange.mockClear();
    scrollTo(scroller, 2000);
    expect(onHeaderExpandedChange.mock.calls.length > 0).toBe(runs);
  });
});

describe('feature flags remove listeners and computations (F-24)', () => {
  it('enablePinning false creates no pin observers', () => {
    for (const view of ['list', 'timeline'] as const) {
      const props = { ...base, enablePinning: false };
      const { container, unmount } = renderUi(view === 'list' ? <ListView {...props} /> : <TimelineView {...props} />);
      if (view === 'list') injectListLayout(container, listLayout);
      else injectTimelineLayout(container, 800);
      settle();
      expect(FakeIntersectionObserver.active(), view).toHaveLength(0);
      unmount();
    }
  });

  it('enableNowIndicator false stops the internal clock', () => {
    const clocked = renderUi(<ListView items={baseline.items} date={baseline.date} />);
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(vi.getTimerCount()).toBe(1);
    clocked.unmount();
    renderUi(<ListView items={baseline.items} date={baseline.date} enableNowIndicator={false} />);
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('data modes (F-31)', () => {
  it('reports the rendered range on mount and whenever it changes, not on other renders', () => {
    const ranges: string[] = [];
    const onVisibleRangeChange = ({ start, end }: { start: Date; end: Date }): number =>
      ranges.push(`${start.toISOString()}…${end.toISOString()}`);
    const view = (props: Partial<SchedulerProps<ParityItem>>): ReactElement => (
      <ListView {...base} onVisibleRangeChange={onVisibleRangeChange} {...props} />
    );
    const { rerender } = renderUi(view({}));
    expect(ranges).toHaveLength(1);
    act(() => rerender(view({ loading: true })));
    act(() => rerender(view({ now: '2031-03-12T11:00:00' })));
    expect(ranges).toHaveLength(1);
    act(() => rerender(view({ date: '2031-03-13T10:30:00' })));
    expect(ranges).toHaveLength(2);
    act(() => rerender(view({ date: '2031-03-13T10:30:00', shifts: { before: 2 } })));
    expect(ranges).toHaveLength(3);
    // Each range spans the rendered shifts: one earlier, the current and one later by default.
    const [first] = ranges;
    const [start, end] = (first ?? '').split('…').map((iso) => Date.parse(iso));
    expect(((end ?? 0) - (start ?? 0)) / 3_600_000).toBe(36);
  });
});
