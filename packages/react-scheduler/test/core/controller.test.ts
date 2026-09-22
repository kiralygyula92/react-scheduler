import { describe, expect, it, vi } from 'vitest';
import { createScheduler, type SchedulerOptions } from '../../src/core/controller';
import { deepEqual, shallowEqual, stabilizer } from '../../src/core/equal';
import { fixture, type ParityItem } from '../parity/adapter';

const baseline = fixture('baseline-day');

function create(options: Partial<SchedulerOptions<ParityItem>> = {}) {
  const all: SchedulerOptions<ParityItem> = {
    items: baseline.items,
    date: baseline.date,
    now: baseline.now,
    ...options,
  };
  return createScheduler<ParityItem>(all);
}

const item = (id: string): ParityItem => baseline.items.find((candidate) => candidate.id === id) as ParityItem;

describe('createScheduler: model', () => {
  it('derives shifts, segments and the current shift from items and date', () => {
    const model = create().getModel();
    expect(model.shifts.map((shift) => shift.offset)).toEqual([-1, 0, 1]);
    expect(model.currentIndex).toBe(1);
    expect(model.segments.map((segment) => segment.items.length)).toEqual([4, 10, 3]);
    expect(model.hasItems).toBe(true);
    expect(model.view).toBe('list');
    expect(model.compact).toBe(false);
    expect(model.size).toBe('lg');
    expect(model.nowVisible).toBe(true);
    expect(model.carriedOverCount).toBe(2);
  });

  it('keeps the model while inline option objects are structurally equal', () => {
    const controller = create({ shifts: { before: 1 }, timeline: { hourHeight: 172 } });
    const first = controller.getModel();
    const layout = controller.getLayout();
    controller.setOptions({ ...controller.getOptions(), shifts: { before: 1 }, timeline: { hourHeight: 172 } });
    expect(controller.getModel()).toBe(first);
    expect(controller.getLayout()).toBe(layout);
    controller.setOptions({ ...controller.getOptions(), timeline: { hourHeight: 100 } });
    expect(controller.getModel()).not.toBe(first);
    expect(controller.getLayout()?.height).toBe(36 * 100);
  });

  it('derives compact mode, chip size and the list-only view from the measured root width (B-16)', () => {
    const controller = create({ view: 'timeline', listOnlyBreakpoint: 600 });
    controller.setWidth(1000);
    expect([controller.getModel().compact, controller.getModel().size, controller.getModel().view]).toEqual([
      false,
      'lg',
      'timeline',
    ]);
    controller.setWidth(700);
    expect([controller.getModel().compact, controller.getModel().size, controller.getModel().view]).toEqual([
      true,
      'md',
      'timeline',
    ]);
    controller.setWidth(390);
    expect([controller.getModel().compact, controller.getModel().size, controller.getModel().view]).toEqual([
      true,
      'sm',
      'list',
    ]);
  });

  it('forces compact mode and reduced motion when booleans are given', () => {
    const controller = create({ compact: true, reducedMotion: true });
    expect(controller.getModel().compact).toBe(true);
    expect(controller.getModel().animate).toBe(false);
    const auto = create();
    auto.setPrefersReducedMotion(true);
    expect(auto.getModel().reducedMotion).toBe(true);
  });

  it('uses the density defaults for hour height and card height unless given (06 §4)', () => {
    expect(create({ density: 'comfortable' }).getModel().timeline).toMatchObject({
      hourHeight: 200,
      minCardHeight: 96,
    });
    expect(create({ density: 'dense' }).getModel().timeline).toMatchObject({ hourHeight: 120, minCardHeight: 56 });
    expect(create({ density: 'dense', timeline: { hourHeight: 150 } }).getModel().timeline.hourHeight).toBe(150);
  });

  it('captures an absent date once, from defaultDate (B-23)', () => {
    const controller = createScheduler<ParityItem>({ items: baseline.items, defaultDate: baseline.date });
    const date = controller.getModel().date;
    controller.setClock(date + 5 * 3_600_000);
    expect(controller.getModel().date).toBe(date);
  });

  it('has no current shift with segments lacking one (LV-10)', () => {
    const controller = createScheduler<ParityItem>({
      segments: [{ role: 'previous', start: '2031-03-11T20:00', end: '2031-03-12T08:00', items: [] }],
    });
    expect(controller.getModel().currentIndex).toBe(-1);
    expect(controller.getLayout()).toBeNull();
  });
});

describe('createScheduler: detail view', () => {
  it('opens an item in the order middleware → state → onOpenItemIdChange → onItemOpen (F-25)', () => {
    const calls: string[] = [];
    const controller = create({
      handlers: {
        onItemActivate: (ctx, next) => {
          calls.push(`middleware:${ctx.item.id}:${ctx.source}`);
          next();
          calls.push(`state:${controller.getModel().openItemId}`);
        },
      },
      onOpenItemIdChange: (id) => calls.push(`change:${id}`),
      onItemOpen: (opened, info) => calls.push(`open:${opened.id}:${info.source}`),
    });
    controller.activateItem(item('c01'), 'listCard');
    expect(calls).toEqual(['middleware:c01:listCard', 'change:c01', 'open:c01:listCard', 'state:c01']);
    expect(controller.getModel().openItem?.id).toBe('c01');
  });

  it('cancels activation when the middleware does not call next()', () => {
    const onItemOpen = vi.fn();
    const controller = create({ handlers: { onItemActivate: () => undefined }, onItemOpen });
    controller.activateItem(item('c01'), 'listCard');
    expect(onItemOpen).not.toHaveBeenCalled();
    expect(controller.getModel().openItemId).toBeNull();
  });

  it('never opens disabled items; with enableItemDetail false only onItemOpen fires', () => {
    const onItemOpen = vi.fn();
    const onOpenItemIdChange = vi.fn();
    const controller = create({ onItemOpen, onOpenItemIdChange, enableItemDetail: false });
    controller.activateItem({ ...item('c01'), disabled: true }, 'listCard');
    expect(onItemOpen).not.toHaveBeenCalled();
    controller.activateItem(item('c01'), 'timelineCard');
    expect(onItemOpen).toHaveBeenCalledWith(item('c01'), { source: 'timelineCard' });
    expect(onOpenItemIdChange).not.toHaveBeenCalled();
    expect(controller.getModel().openItemId).toBeNull();
  });

  it('leaves a controlled open id to the consumer', () => {
    const onOpenItemIdChange = vi.fn();
    const controller = create({ openItemId: null, onOpenItemIdChange });
    controller.activateItem(item('c02'), 'listCard');
    expect(onOpenItemIdChange).toHaveBeenCalledWith('c02');
    expect(controller.getModel().openItemId).toBeNull();
    controller.setOptions({ ...controller.getOptions(), openItemId: 'c02' });
    expect(controller.getModel().openItem?.id).toBe('c02');
  });

  it('closes through onDetailClose, then onOpenItemIdChange(null) and onItemClose', () => {
    const calls: string[] = [];
    const controller = create({
      defaultOpenItemId: 'c01',
      handlers: { onDetailClose: (ctx, next) => (calls.push(`middleware:${ctx.reason}`), next()) },
      onOpenItemIdChange: (id) => calls.push(`change:${id}`),
      onItemClose: (closed, info) => calls.push(`close:${closed.id}:${info.reason}`),
    });
    controller.closeItem('escape');
    expect(calls).toEqual(['middleware:escape', 'change:null', 'close:c01:escape']);
    expect(controller.getModel().openItem).toBeNull();
  });

  it('[B-03] closes with itemRemoved when the open item leaves the data and never reopens by itself', () => {
    const onItemClose = vi.fn();
    const controller = create({ defaultOpenItemId: 'c01', onItemClose });
    expect(controller.getModel().openItem?.id).toBe('c01');
    const without = baseline.items.filter((candidate) => candidate.id !== 'c01');
    controller.setOptions({ ...controller.getOptions(), items: without });
    expect(controller.getModel().openItemMissing).toBe(true);
    controller.reconcileOpenItem();
    expect(onItemClose).toHaveBeenCalledWith(item('c01'), { reason: 'itemRemoved' });
    controller.setOptions({ ...controller.getOptions(), items: baseline.items });
    expect(controller.getModel().openItem).toBeNull();
  });

  it('[B-03] ignores a controlled id whose item was removed until the consumer changes it', () => {
    const onOpenItemIdChange = vi.fn();
    const controller = create({ openItemId: 'c01', onOpenItemIdChange });
    controller.setOptions({ ...controller.getOptions(), items: baseline.items.filter((i) => i.id !== 'c01') });
    controller.reconcileOpenItem();
    expect(onOpenItemIdChange).toHaveBeenCalledWith(null);
    // The consumer did not clear the id; the item returns: the view stays closed.
    controller.setOptions({ ...controller.getOptions(), items: baseline.items });
    expect(controller.getModel().openItem).toBeNull();
    controller.setOptions({ ...controller.getOptions(), openItemId: null });
    controller.getModel();
    controller.setOptions({ ...controller.getOptions(), openItemId: 'c01' });
    expect(controller.getModel().openItem?.id).toBe('c01');
  });
});

describe('createScheduler: overflow dialog', () => {
  const group = () => {
    const controller = create({ view: 'timeline' });
    const found = controller.getLayout()?.overflow[0];
    if (!found) throw new Error('baseline has an overflow group');
    return found;
  };

  it('opens through onMoreActivate and resets sort and page on each open', () => {
    const calls: string[] = [];
    const controller = create({
      view: 'timeline',
      defaultOverflowSort: { column: 'time', direction: 'asc' },
      onOpenOverflowIdChange: (id) => calls.push(`change:${id}`),
      onOverflowOpen: (opened) => calls.push(`open:${opened.items.length}`),
    });
    const target = group();
    controller.activateMore(target, 'click');
    controller.sortOverflow('title', 'click');
    expect(controller.getModel().overflowSort).toEqual({ column: 'title', direction: 'asc' });
    controller.closeOverflow('closeButton');
    controller.activateMore(target, 'click');
    expect(controller.getModel().overflowSort).toEqual({ column: 'time', direction: 'asc' });
    expect(calls).toEqual([`change:${target.id}`, 'open:2', 'change:null', `change:${target.id}`, 'open:2']);
  });

  it('with enableOverflowDialog false only onOverflowOpen fires', () => {
    const onOpenOverflowIdChange = vi.fn();
    const onOverflowOpen = vi.fn();
    const controller = create({
      view: 'timeline',
      enableOverflowDialog: false,
      onOpenOverflowIdChange,
      onOverflowOpen,
    });
    controller.activateMore(group(), 'click');
    expect(onOverflowOpen).toHaveBeenCalledTimes(1);
    expect(onOpenOverflowIdChange).not.toHaveBeenCalled();
    expect(controller.getModel().openOverflowId).toBeNull();
  });

  it('toggles the direction on the active column, starts others ascending and resets the page', () => {
    const onOverflowSortChange = vi.fn();
    const onOverflowPageChange = vi.fn();
    const controller = create({ view: 'timeline', onOverflowSortChange, onOverflowPageChange });
    controller.setOverflowPage(1, 'click');
    controller.sortOverflow('title', 'click');
    controller.sortOverflow('title', 'click');
    expect(onOverflowSortChange.mock.calls).toEqual([
      [{ column: 'title', direction: 'asc' }],
      [{ column: 'title', direction: 'desc' }],
    ]);
    expect(onOverflowPageChange.mock.calls).toEqual([[1], [0]]);
    expect(controller.getModel().overflowPage).toBe(0);
  });

  it('lets onOverflowSort alter the sort through next(override)', () => {
    const controller = create({
      view: 'timeline',
      handlers: { onOverflowSort: (_ctx, next) => next({ sort: { column: 'level', direction: 'desc' } }) },
    });
    controller.sortOverflow('title', 'click');
    expect(controller.getModel().overflowSort).toEqual({ column: 'level', direction: 'desc' });
  });
});

describe('createScheduler: header signal', () => {
  it('emits only on change, with the view and reason (F-09)', () => {
    const onHeaderExpandedChange = vi.fn();
    const controller = create({ onHeaderExpandedChange });
    controller.signalHeader('list', true, 'scroll');
    controller.signalHeader('list', false, 'scroll');
    controller.signalHeader('list', false, 'scroll');
    controller.signalHeader('list', true, 'resize');
    expect(onHeaderExpandedChange.mock.calls).toEqual([
      [false, { view: 'list', reason: 'scroll' }],
      [true, { view: 'list', reason: 'resize' }],
    ]);
  });

  it('does not repeat a value a controlling consumer ignored, and ignores the inactive view', () => {
    const onHeaderExpandedChange = vi.fn();
    const controller = create({ headerExpanded: true, onHeaderExpandedChange });
    controller.signalHeader('list', false, 'scroll');
    controller.signalHeader('list', false, 'scroll');
    controller.signalHeader('timeline', false, 'scroll');
    expect(onHeaderExpandedChange).toHaveBeenCalledTimes(1);
    controller.resetHeader('list');
    controller.signalHeader('list', false, 'viewEnter');
    expect(onHeaderExpandedChange).toHaveBeenCalledTimes(2);
  });

  it('can be altered or vetoed by onHeaderSignal, or disabled with enableHeaderSignal', () => {
    const onHeaderExpandedChange = vi.fn();
    const controller = create({
      onHeaderExpandedChange,
      handlers: { onHeaderSignal: (ctx, next) => (ctx.reason === 'scroll' ? next({ expanded: true }) : undefined) },
    });
    controller.signalHeader('list', false, 'resize');
    expect(onHeaderExpandedChange).not.toHaveBeenCalled();
    const off = create({ onHeaderExpandedChange, enableHeaderSignal: false });
    off.signalHeader('list', false, 'scroll');
    expect(onHeaderExpandedChange).not.toHaveBeenCalled();
  });
});

describe('createScheduler: scroll facts, navigation and pinning', () => {
  it('fires onActiveShiftChange only when the active shift changes', () => {
    const onActiveShiftChange = vi.fn();
    const controller = create({ onActiveShiftChange });
    const facts = { activeIndex: 1, atStart: true, nextVisible: false, pastScrollTopThreshold: false };
    controller.setScrollFacts('list', facts);
    controller.setScrollFacts('list', { ...facts, atStart: false });
    controller.setScrollFacts('list', { ...facts, activeIndex: 2 });
    expect(onActiveShiftChange.mock.calls.map((call) => (call[0] as { offset: number }).offset)).toEqual([0, 1]);
  });

  it('derives the navigation state from the facts (F-08)', () => {
    const controller = create({ view: 'timeline' });
    controller.setScrollFacts('timeline', {
      activeIndex: 2,
      atStart: false,
      nextVisible: false,
      pastScrollTopThreshold: false,
    });
    const { top, bottom } = controller.getViewModel('timeline').navigation;
    expect(top).toMatchObject({ visible: true, label: 'View current shift', carriedOverCount: 0 });
    expect(bottom).toMatchObject({ visible: true, disabled: true, label: 'Next shift' });
  });

  it('navigates through onNavigate middleware, performs, then calls onNavigate', () => {
    const calls: string[] = [];
    const controller = create({
      handlers: { onNavigate: (ctx, next) => (calls.push(`middleware:${ctx.to.offset}`), next()) },
      onNavigate: (info) => calls.push(`event:${info.from.offset}>${info.to.offset}:${info.position}`),
    });
    controller.navigate('list', 'bottom', 'click', (to) => calls.push(`perform:${to.offset}`));
    expect(calls).toEqual(['middleware:1', 'perform:1', 'event:0>1:bottom']);
    const hidden = create({ enableNavigation: false });
    const perform = vi.fn();
    hidden.navigate('list', 'bottom', 'click', perform);
    expect(perform).not.toHaveBeenCalled();
  });

  it('builds the pinned strip in placement order with the carried-over tag appended (B-25)', () => {
    const controller = create();
    controller.setPinnedByPosition('list', ['p03', 'p02']);
    const { pinned, pinnedIds } = controller.getViewModel('list');
    expect(pinnedIds).toEqual(['p02', 'p03']);
    expect(pinned[0]).toMatchObject({ carriedOver: true, tags: ['carriedOver'] });
  });

  it('lets onPin veto a change, and reports the strip once per change through flushPinned', () => {
    const onPinnedChange = vi.fn();
    const controller = create({
      onPinnedChange,
      handlers: { onPin: (ctx, next) => (ctx.item.id === 'p03' ? undefined : next()) },
    });
    controller.setPinnedByPosition('list', ['p02', 'p03']);
    controller.flushPinned('list');
    controller.flushPinned('list');
    controller.setPinnedByPosition('list', []);
    controller.flushPinned('list');
    expect(onPinnedChange.mock.calls).toEqual([
      [['p02'], { added: ['p02'], removed: [] }],
      [[], { added: [], removed: ['p02'] }],
    ]);
  });

  it('keeps items with pinned: true in the strip without a sentinel', () => {
    const items = baseline.items.map((candidate) =>
      candidate.id === 'c07' ? { ...candidate, pinned: true } : candidate,
    );
    expect(create({ items }).getViewModel('list').pinnedIds).toEqual(['c07']);
    expect(create({ items, enablePinning: false }).getViewModel('list').pinnedIds).toEqual([]);
  });

  it('shows the scroll-to-top button only in the compact list past the threshold', () => {
    const controller = create({ compact: true });
    const facts = { activeIndex: 1, atStart: false, nextVisible: false, pastScrollTopThreshold: true };
    controller.setScrollFacts('list', facts);
    expect(controller.getViewModel('list').scrollTopVisible).toBe(true);
    expect(create({ compact: false }).getViewModel('list').scrollTopVisible).toBe(false);
  });

  it('runs onScrollTop middleware before performing and the event', () => {
    const calls: string[] = [];
    const controller = create({
      handlers: { onScrollTop: (_ctx, next) => (calls.push('middleware'), next()) },
      onScrollTop: () => calls.push('event'),
    });
    controller.scrollToTop('click', () => calls.push('perform'));
    expect(calls).toEqual(['middleware', 'perform', 'event']);
  });

  it('ignores an asynchronous next() after unmount (F-22)', async () => {
    const onItemOpen = vi.fn();
    let resume: () => void = () => undefined;
    const controller = create({ handlers: { onItemActivate: (_ctx, next) => void (resume = next) }, onItemOpen });
    controller.activateItem(item('c01'), 'api');
    controller.setMounted(false);
    await Promise.resolve();
    resume();
    expect(onItemOpen).not.toHaveBeenCalled();
  });
});

describe('createScheduler: view and date', () => {
  it('switches an uncontrolled view and date, and reports both', () => {
    const onViewChange = vi.fn();
    const onDateChange = vi.fn();
    const controller = create({ date: undefined, defaultDate: baseline.date, onViewChange, onDateChange });
    controller.setView('timeline');
    controller.setDate('2031-03-13T10:00:00');
    expect(controller.getModel().view).toBe('timeline');
    expect(controller.getModel().current?.start).toBe(new Date('2031-03-13T08:00:00').getTime());
    expect(onViewChange).toHaveBeenCalledWith('timeline');
    expect(onDateChange).toHaveBeenCalledWith(new Date('2031-03-13T10:00:00'));
  });
});

describe('equal helpers', () => {
  it('compares plain data structurally and everything else by identity', () => {
    const fn = (): number => 1;
    expect(deepEqual({ a: [1, { b: 2 }], fn }, { a: [1, { b: 2 }], fn })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual([1], { 0: 1 })).toBe(false);
    expect(deepEqual(new Date(0), new Date(0))).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
    const stable = stabilizer<{ a: number }>();
    const first = stable({ a: 1 });
    expect(stable({ a: 1 })).toBe(first);
    expect(stable({ a: 2 })).not.toBe(first);
  });
});
