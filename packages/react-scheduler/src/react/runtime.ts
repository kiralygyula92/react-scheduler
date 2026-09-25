// SPDX-License-Identifier: MIT
// The per-view runtime: DOM refs, the pin engine, the navigator, measurement, landing and the
// imperative API of one mounted view. It is plain TypeScript; the React hook (use-view-runtime)
// only calls its lifecycle methods from effects. Everything reads the controller's current model at
// call time, so no closure goes stale.
import type { KeyboardEvent, SyntheticEvent } from 'react';
import type { NavPosition, ScrollFacts, SchedulerController, SchedulerModel } from '../core/controller';
import {
  type ListCardMetrics,
  listActiveIndex,
  listAtStart,
  listHeaderExpanded,
  listLandingTarget,
  type ListMetrics,
  listSectionTarget,
  listSectionVisible,
  scrollTopButtonVisible,
} from '../core/list';
import {
  GRID_PAD_TOP,
  timelineActiveIndex,
  timelineAtStart,
  timelineHeaderExpanded,
  timelineLandingTarget,
  timelineNavTarget,
  timeToPx,
} from '../core/timeline';
import { toMs } from '../core/time';
import type {
  DateInput,
  HeaderReason,
  LandingTarget,
  SchedulerItem,
  ShiftRole,
  ShiftWindow,
  ViewKind,
} from '../core/types';
import { createNavigator, type Navigator } from '../dom/navigator';
import { compensateStickyGrowth } from '../dom/observers';
import { createPinEngine, type PinEngine } from '../dom/pin-engine';

type Controller<TItem extends SchedulerItem> = SchedulerController<TItem, SyntheticEvent, KeyboardEvent>;
type RefCallback = (node: HTMLElement | null) => void;

export interface ViewApi {
  scrollToShift(target: number | ShiftRole, options?: { smooth?: boolean; align?: 'start' | 'nearBottom' }): void;
  scrollToTime(time: DateInput, options?: { smooth?: boolean; align?: 'start' | 'center' | 'nearBottom' }): void;
  scrollToItem(id: string, options?: { smooth?: boolean }): void;
  refreshPinning(): void;
  getScrollElement(): HTMLElement | null;
  focusItem(id: string): void;
}

export interface ViewRuntime {
  readonly kind: ViewKind;
  sectionRef(offset: number): RefCallback;
  headerRef(offset: number): RefCallback;
  cardRef(id: string): RefCallback;
  activatorRef(id: string): RefCallback;
  sentinelRef(key: string, ids: readonly string[]): RefCallback;
  /** Creates the engines for a mounted scroller (and, in the list, its sticky top). */
  attach(scroller: HTMLElement, sticky: HTMLElement | null): void;
  detach(): void;
  /** An inactive view (kept mounted) has no listeners and a paused pin engine (B-14). */
  setActive(active: boolean): void;
  /** After the data changed: pin refresh and header rule next frame. */
  dataChanged(): void;
  /** Called on every render with the selected date: on a change, unpin everything, then land (F-10). */
  dateChanged(date: number): void;
  /**
   * The view has a scroller, data and no loading state: the first landing of this mount, or the
   * view-enter sequence when a switch brought it in.
   */
  ready(): void;
  /** The first landing, once per mount when the view first has data. */
  landInitial(): void;
  /** Entered through a view switch: land once, compute the header once after it settles (B-04). */
  enter(fresh: boolean): void;
  hasLanded(): boolean;
  navigate(position: NavPosition, event: SyntheticEvent): void;
  scrollToTop(event: SyntheticEvent): void;
  api: ViewApi;
}

function cachedRef<K>(cache: Map<K, RefCallback>, key: K, create: () => RefCallback): RefCallback {
  let ref = cache.get(key);
  if (!ref) {
    ref = create();
    cache.set(key, ref);
  }
  return ref;
}

/** Stores the node under `key` while mounted. */
function track<K>(map: Map<K, HTMLElement>, key: K): RefCallback {
  return (node) => {
    if (node) map.set(key, node);
    else map.delete(key);
  };
}

function scrollElementTo(element: HTMLElement, top: number, smooth: boolean): void {
  if (typeof element.scrollTo === 'function') element.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  else element.scrollTop = top;
}

export function createViewRuntime<TItem extends SchedulerItem>(
  controller: Controller<TItem>,
  kind: ViewKind,
): ViewRuntime {
  const sections = new Map<number, HTMLElement>();
  const headers = new Map<number, HTMLElement>();
  const cards = new Map<string, HTMLElement>();
  const activators = new Map<string, HTMLElement>();
  const sentinels = new Map<string, { node: HTMLElement; ids: readonly string[] }>();
  const refCaches = {
    section: new Map<number, RefCallback>(),
    header: new Map<number, RefCallback>(),
    card: new Map<string, RefCallback>(),
    activator: new Map<string, RefCallback>(),
    sentinel: new Map<string, RefCallback>(),
  };

  let scroller: HTMLElement | null = null;
  let sticky: HTMLElement | null = null;
  let pins: PinEngine | null = null;
  let navigator: Navigator | null = null;
  let disposers: (() => void)[] = [];
  let timers: (() => void)[] = [];
  let active = true;
  let navigating = false;
  let landed = false;
  let suppressHeader = false;
  let frame = 0;
  let frameReason: HeaderReason | null = null;
  let onNavigationDone: (() => void) | undefined;
  let lastScroller: HTMLElement | null = null;
  let lastDate: number | undefined;
  /** Whether this mount was entered through a view switch; decided once per mount. */
  let switched: boolean | undefined;

  const model = (): SchedulerModel<TItem> => controller.getModel();

  function teardown(): void {
    for (const dispose of disposers) dispose();
    for (const clear of timers) clear();
    disposers = [];
    timers = [];
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
    navigator?.destroy();
    navigator = null;
    const hadPins = pins !== null;
    pins?.destroy();
    pins = null;
    navigating = false;
    suppressHeader = false;
    onNavigationDone = undefined;
    scroller = null;
    sticky = null;
    if (hadPins) controller.setPinnedByPosition(kind, []);
  }

  const later = (callback: () => void, delay: number): void => {
    const id = setTimeout(callback, delay);
    timers.push(() => clearTimeout(id));
  };
  const nextFrame = (callback: () => void): void => {
    const id = requestAnimationFrame(callback);
    timers.push(() => cancelAnimationFrame(id));
  };
  const syncPause = (): void => {
    if (!pins) return;
    if (navigating || !active) pins.pause();
    else pins.resume();
  };

  // ---------------------------------------------------------------- measurement

  function listMetrics(): ListMetrics & { cards: ListCardMetrics[] } {
    const current = model();
    const element = scroller as HTMLElement;
    const segment = current.segments[current.currentIndex];
    const currentCards: ListCardMetrics[] = [];
    for (const item of segment?.items ?? []) {
      // Headless markup may register only activators (getItemProps); they measure the same.
      const card = cards.get(item.id) ?? activators.get(item.id);
      if (card) currentCards.push({ top: card.offsetTop, height: card.offsetHeight, start: toMs(item.start) });
    }
    return {
      scrollTop: element.scrollTop,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      stickyHeight: sticky?.offsetHeight ?? 0,
      sections: current.shifts.map((shift) => ({
        top: sections.get(shift.offset)?.offsetTop ?? 0,
        headerHeight: headers.get(shift.offset)?.offsetHeight ?? 0,
      })),
      cards: currentCards,
    };
  }

  function evaluate(reason: HeaderReason): void {
    if (!scroller) return;
    const current = model();
    if (current.currentIndex < 0) return;
    let facts: ScrollFacts;
    let expanded: boolean;
    if (kind === 'list') {
      const metrics = listMetrics();
      const epsilon = current.list.segmentEpsilon;
      const hasSections = sections.size > 0;
      const activeIndex = hasSections ? listActiveIndex(metrics, epsilon) : current.currentIndex;
      const nextIndex = current.shifts.findIndex((shift) => shift.offset === 1);
      facts = {
        activeIndex,
        atStart: hasSections ? listAtStart(activeIndex, metrics, epsilon, listTargetOf(0, metrics)) : true,
        nextVisible: hasSections && nextIndex >= 0 && listSectionVisible(nextIndex, metrics, epsilon),
        pastScrollTopThreshold: scrollTopButtonVisible(metrics.scrollTop, current.list.scrollTopThreshold),
      };
      expanded =
        !hasSections ||
        listHeaderExpanded({
          metrics,
          currentIndex: current.currentIndex,
          activeIndex,
          currentItemCount: current.segments[current.currentIndex]?.items.length ?? 0,
          currentCards: metrics.cards.slice(0, current.list.collapseAfterCards),
          options: current.list,
        });
    } else {
      const scrollTop = scroller.scrollTop;
      const activeIndex = timelineActiveIndex(scrollTop, current.shifts, current.geometry);
      facts = {
        activeIndex,
        atStart: timelineAtStart(activeIndex, scrollTop, current.shifts, current.geometry),
        nextVisible: false,
        pastScrollTopThreshold: false,
      };
      expanded = timelineHeaderExpanded(scrollTop, current.current as ShiftWindow, current.geometry);
    }
    controller.setScrollFacts(kind, facts);
    if (suppressHeader) return;
    if (!current.hasItems) controller.signalHeader(kind, true, 'empty');
    else controller.signalHeader(kind, expanded, reason);
  }

  /** At most one evaluation per animation frame (F-25). */
  function scheduleEvaluate(reason: HeaderReason): void {
    if (reason !== 'scroll' || frameReason === null) frameReason = reason;
    if (frame !== 0) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const pending = frameReason ?? 'scroll';
      frameReason = null;
      evaluate(pending);
    });
  }

  const onScroll = (): void => scheduleEvaluate('scroll');

  // ---------------------------------------------------------------- targets

  function shiftIndex(offset: number): number {
    return model().shifts.findIndex((shift) => shift.offset === offset);
  }

  /** Where a jump to the shift at `index` lands, measured from `metrics`. */
  function listTargetOf(index: number, metrics: ListMetrics): number {
    const current = model();
    const section = metrics.sections[index];
    const shift = current.shifts[index];
    if (!section || !shift) return 0;
    // The extra offset takes the jump to the first shift all the way to the top (01 §L.7, BR-L04).
    // On a later earlier shift it would land inside the shift before it, which stays active, and the
    // bottom button would offer the same jump again (DQ-10).
    const extra = shift.offset < 0 && index === 0 ? current.list.previousJumpExtraOffset : 0;
    return listSectionTarget(section.top, metrics.stickyHeight, current.list.alignOffset, extra);
  }

  function listShiftTarget(to: ShiftWindow): number {
    return listTargetOf(shiftIndex(to.offset), listMetrics());
  }

  function landingTarget(target: LandingTarget): number | null {
    const current = model();
    if (!scroller || current.currentIndex < 0) return null;
    if (kind === 'list') {
      const metrics = listMetrics();
      const section = metrics.sections[current.currentIndex];
      if (!section) return null;
      return listLandingTarget(target, {
        current: section,
        cards: metrics.cards,
        date: current.date,
        stickyHeight: metrics.stickyHeight,
        alignOffset: current.list.alignOffset,
      });
    }
    return timelineLandingTarget(target, {
      current: current.current as ShiftWindow,
      geometry: current.geometry,
      date: current.date,
      clientHeight: scroller.clientHeight,
      nearBottomGutter: (current.timeline.nearBottomGutterMinutes * current.timeline.hourHeight) / 60,
    });
  }

  /** Scrolls through the navigator; `done` runs after the final correction. A new call replaces it. */
  function scrollWith(target: () => number, smooth: boolean, done?: () => void): void {
    if (!navigator || !scroller) {
      done?.();
      return;
    }
    onNavigationDone = done;
    navigator.scrollTo(target, { smooth });
  }

  function land(target: LandingTarget, done?: () => void): void {
    if (target === 'none' || landingTarget(target) === null) {
      done?.();
      return;
    }
    scrollWith(() => landingTarget(target) ?? scroller?.scrollTop ?? 0, false, done);
  }

  // ---------------------------------------------------------------- lifecycle

  function createEngines(element: HTMLElement): void {
    const current = model();
    navigator = createNavigator({
      scroller: element,
      onStart: () => {
        // The list pauses pinning during programmatic scrolls; the timeline does not (01 §T.10).
        if (kind === 'list') {
          navigating = true;
          syncPause();
        }
      },
      onSettle: () => pins?.refresh({ force: true }),
      onDone: () => {
        if (kind === 'list') {
          navigating = false;
          syncPause();
        }
        evaluate('scroll');
        const done = onNavigationDone;
        onNavigationDone = undefined;
        done?.();
      },
    });
    if (current.flags.enablePinning) {
      const rule = current.pinRules[kind];
      pins = createPinEngine({
        scroller: element,
        // List: the sticky top's bottom edge. Timeline: the scroller's visible top, since the sticky
        // top sits outside the scroller (B-05).
        getLine: () =>
          kind === 'list' && sticky ? sticky.getBoundingClientRect().bottom : element.getBoundingClientRect().top,
        epsilon: rule.epsilon,
        hysteresis: rule.hysteresis,
        onChange: (ids) => controller.setPinnedByPosition(kind, ids),
      });
      for (const [key, sentinel] of sentinels) pins.register(key, sentinel.ids)(sentinel.node);
      syncPause();
    }
  }

  const runtime: ViewRuntime = {
    kind,
    sectionRef: (offset) => cachedRef(refCaches.section, offset, () => track(sections, offset)),
    headerRef: (offset) => cachedRef(refCaches.header, offset, () => track(headers, offset)),
    cardRef: (id) => cachedRef(refCaches.card, id, () => track(cards, id)),
    activatorRef: (id) => cachedRef(refCaches.activator, id, () => track(activators, id)),
    sentinelRef(key, ids) {
      // The ids are part of the cache key: new ids give a new callback, so React re-registers the node.
      return cachedRef(refCaches.sentinel, `${key}\u0000${ids.join('\u0000')}`, () => (node) => {
        if (node) sentinels.set(key, { node, ids });
        else if (sentinels.get(key)?.ids === ids) sentinels.delete(key);
        pins?.register(key, ids)(node);
      });
    },

    attach(element, stickyElement) {
      teardown();
      // A new scroller element (the content re-mounted) has no position yet: it lands again.
      if (element !== lastScroller) landed = false;
      lastScroller = element;
      scroller = element;
      sticky = stickyElement;
      createEngines(element);
      if (active) element.addEventListener('scroll', onScroll, { passive: true });
      disposers.push(() => element.removeEventListener('scroll', onScroll));
      if (typeof ResizeObserver !== 'undefined') {
        const resize = new ResizeObserver(() => scheduleEvaluate('resize'));
        resize.observe(element);
        disposers.push(() => resize.disconnect());
        if (kind === 'list' && stickyElement) {
          // Keep content still when the sticky top grows (B-21), then move the pin line with it. A
          // navigation corrects its own target instead: compensating first would flash the content.
          disposers.push(compensateStickyGrowth(element, stickyElement, () => navigating));
          const relayout = new ResizeObserver(() => {
            pins?.relayout();
            scheduleEvaluate('resize');
          });
          relayout.observe(stickyElement);
          disposers.push(() => relayout.disconnect());
        }
      }
      // The listener's first evaluation (01 §5: attaching evaluates once).
      if (active) scheduleEvaluate('scroll');
    },
    detach() {
      teardown();
    },
    setActive(next) {
      if (active === next) return;
      active = next;
      if (scroller) {
        if (active) scroller.addEventListener('scroll', onScroll, { passive: true });
        else scroller.removeEventListener('scroll', onScroll);
      }
      if (!active) navigator?.cancel();
      syncPause();
      // A kept-mounted view that becomes active again is entered through a switch (F-03).
      if (active && landed && scroller) {
        controller.noteViewShown(kind);
        runtime.enter(false);
      }
    },
    ready() {
      if (!scroller || landed || !active) return;
      switched ??= controller.noteViewShown(kind);
      if (switched) runtime.enter(true);
      else runtime.landInitial();
    },
    dataChanged() {
      if (!scroller) return;
      nextFrame(() => {
        pins?.refresh();
        evaluate('dataChange');
      });
    },
    dateChanged(date) {
      const previous = lastDate;
      lastDate = date;
      if (previous === undefined || previous === date || !scroller || !landed) return;
      pins?.reset();
      nextFrame(() => {
        const target = kind === 'list' ? model().list.landing.onDateChange : model().timeline.landing.onDateChange;
        land(target, () => evaluate('dataChange'));
      });
    },
    landInitial() {
      if (!scroller || landed) return;
      landed = true;
      nextFrame(() => {
        const target = kind === 'list' ? model().list.landing.initial : model().timeline.landing.initial;
        land(target);
      });
    },
    enter(fresh) {
      if (!scroller) return;
      landed = true;
      suppressHeader = true;
      const finish = (): void => {
        suppressHeader = false;
        controller.resetHeader(kind);
        evaluate('viewEnter');
      };
      nextFrame(() => {
        const current = model();
        const options = kind === 'list' ? current.list : current.timeline;
        const onEnter = options.landing.onViewEnter;
        const previous = controller.getViewModel(kind).facts;
        controller.setScrollFacts(kind, { ...previous, activeIndex: Math.max(0, current.currentIndex) });
        // A view mounted by the switch has no position to keep: it lands like a first mount first.
        const first = onEnter === 'none' ? (fresh ? options.landing.initial : 'none') : onEnter;
        const realign = kind === 'timeline' && onEnter !== 'none';
        land(first, realign ? undefined : finish);
        if (realign) later(() => land(onEnter, finish), current.timeline.viewEnterRealignDelay);
      });
    },
    hasLanded: () => landed,
    navigate(position, event) {
      controller.navigate(kind, position, event, (to) => scrollToShiftWindow(to, model().animate));
    },
    scrollToTop(event) {
      controller.scrollToTop(event, () => {
        if (!scroller) return;
        // A smooth scroll goes through the navigator: pinning pauses on the way up, so no sticky
        // compensation writes scrollTop mid-flight (which would stop a smooth scroll in Firefox).
        if (model().animate) scrollWith(() => 0, true);
        else scrollElementTo(scroller, 0, false);
      });
    },
    api: {
      scrollToShift(target, options = {}) {
        const current = model();
        const offset = typeof target === 'number' ? target : target === 'previous' ? -1 : target === 'next' ? 1 : 0;
        const shift = current.shifts.find((candidate) => candidate.offset === offset);
        if (!shift) return;
        const smooth = options.smooth ?? current.animate;
        if (options.align === 'nearBottom' && kind === 'timeline') {
          scrollToTimeline(shift.start, 'nearBottom', smooth);
          return;
        }
        controller.navigateTo(kind, shift, (to) => scrollToShiftWindow(to, smooth));
      },
      scrollToTime(time, options = {}) {
        const current = model();
        const ms = toMs(time);
        if (Number.isNaN(ms)) return;
        const smooth = options.smooth ?? current.animate;
        if (kind === 'timeline') {
          scrollToTimeline(ms, options.align ?? 'start', smooth);
          return;
        }
        const items = current.segments.flatMap((segment) => segment.items);
        const item = items.find((candidate) => toMs(candidate.start) >= ms) ?? items[items.length - 1];
        if (item) runtime.api.scrollToItem(item.id, { smooth });
      },
      scrollToItem(id, options = {}) {
        const current = model();
        const smooth = options.smooth ?? current.animate;
        if (kind === 'list') {
          if (!cards.has(id)) return;
          scrollWith(() => {
            const card = cards.get(id);
            return card ? listSectionTarget(card.offsetTop, sticky?.offsetHeight ?? 0, current.list.alignOffset) : 0;
          }, smooth);
          return;
        }
        const card = controller.getLayout()?.cards.find((placed) => placed.item.id === id);
        if (card) scrollWith(() => card.top + GRID_PAD_TOP - current.geometry.lead, smooth);
      },
      refreshPinning: () => pins?.refresh({ force: true }),
      getScrollElement: () => scroller,
      focusItem: (id) => activators.get(id)?.focus(),
    },
  };

  function scrollToShiftWindow(to: ShiftWindow, smooth: boolean): void {
    if (kind === 'list') scrollWith(() => listShiftTarget(to), smooth);
    else scrollWith(() => timelineNavTarget(to, model().geometry), smooth);
  }

  function scrollToTimeline(ms: number, align: 'start' | 'center' | 'nearBottom', smooth: boolean): void {
    scrollWith(() => {
      const current = model();
      const top = timeToPx(ms, current.geometry) + GRID_PAD_TOP;
      const height = scroller?.clientHeight ?? 0;
      if (align === 'center') return top - height / 2;
      if (align === 'nearBottom') {
        return top - (height - (current.timeline.nearBottomGutterMinutes * current.timeline.hourHeight) / 60);
      }
      return top - current.geometry.lead;
    }, smooth);
  }

  return runtime;
}
