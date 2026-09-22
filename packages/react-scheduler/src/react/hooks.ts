// SPDX-License-Identifier: MIT
// Headless hooks (Feature Dossier 04 §7, 05 F-27): `useScheduler` exposes everything <Scheduler> uses,
// with prop getters, so both views can be rebuilt with custom markup; the focused hooks expose one
// concern each.
import { type MouseEvent, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bucketItems, segmentsFromInput } from '../core/bucketing';
import { computeTimelineLayout } from '../core/layout';
import { classicLevels } from '../core/levels';
import { interpolate } from '../core/localization';
import { isPinnable } from '../core/pinning';
import { getShiftWindows } from '../core/shifts';
import { toMs } from '../core/time';
import type {
  DateInput,
  LevelDefinition,
  OverflowGroup,
  SchedulerItem,
  SegmentInput,
  ShiftOptions,
  ShiftSegment,
  ShiftWindow,
  TimelineLayout,
  TimelineLayoutOptions,
} from '../core/types';
import { createNavigator, type Navigator } from '../dom/navigator';
import { observeCompact } from '../dom/observers';
import { createPinEngine, type PinEngine } from '../dom/pin-engine';
import { activatorProps, cardData, sentinelProps } from './components/card';
import { createHandle } from './scheduler';
import type { ItemProps, PinSentinelProps, SchedulerProps, SchedulerState } from './types';
import { useSchedulerSetup } from './use-setup';
import { useViewSetup } from './use-view';

/** Controlled when `value` is given, otherwise internal state starting at `defaultValue`. */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      if (!Object.is(next, current)) onChange?.(next);
    },
    [controlled, current, onChange],
  );
  return [current, set];
}

/** Epoch ms of `now`, or an internal clock ticking every `interval` ms, paused while the document is hidden. */
export function useNow(input: { now?: DateInput; interval?: number } = {}): number {
  const fixed = input.now === undefined ? undefined : toMs(input.now);
  const interval = input.interval ?? 60_000;
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (fixed !== undefined || typeof document === 'undefined') return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = (): void => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const start = (): void => {
      stop();
      timer = setInterval(() => setClock(Date.now()), interval);
    };
    const onVisibility = (): void => {
      if (document.hidden) stop();
      else {
        setClock(Date.now());
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fixed, interval]);
  return fixed ?? clock;
}

/** Compact mode from the element's content width (B-16); a boolean forces it. False on the server. */
export function useCompact(
  ref: RefObject<HTMLElement | null>,
  options: { compact?: boolean | 'auto'; breakpoint?: number } = {},
): boolean {
  const setting = options.compact ?? 'auto';
  const breakpoint = options.breakpoint ?? 900;
  const [measured, setMeasured] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (setting !== 'auto' || !element) return;
    return observeCompact(element, { breakpoint, onChange: setMeasured });
  }, [ref, setting, breakpoint]);
  return setting === 'auto' ? measured : setting;
}

/** Shift windows and segments for a date (Feature Dossier 05 F-01, F-02). */
export function useShiftModel<TItem extends SchedulerItem>(input: {
  items?: readonly TItem[];
  segments?: readonly SegmentInput<TItem>[];
  date: DateInput;
  shifts?: ShiftOptions;
  levels?: readonly LevelDefinition[];
  compareItems?: (a: TItem, b: TItem) => number;
  defaultDuration?: number;
}): { shifts: readonly ShiftWindow[]; segments: readonly ShiftSegment<TItem>[]; current: ShiftWindow } {
  const { items, segments: given, date, shifts: shiftOptions, levels, compareItems } = input;
  const time = toMs(date);
  return useMemo(() => {
    const options = { levels: levels ?? classicLevels, ...(compareItems ? { compareItems } : {}) };
    const segments = given
      ? segmentsFromInput(given, options)
      : bucketItems(items ?? [], getShiftWindows(time, shiftOptions), options);
    const shifts = segments.map((segment) => segment.shift);
    const current = shifts.find((shift) => shift.offset === 0) ?? shifts[0];
    if (!current) throw new RangeError('[react-scheduler] useShiftModel: no shift windows.');
    return { shifts, segments, current };
  }, [items, given, time, shiftOptions, levels, compareItems]);
}

/** The timeline layout of `items` (Feature Dossier 05 F-06), memoized on its inputs. */
export function useTimelineLayout<TItem extends SchedulerItem>(
  items: readonly TItem[],
  options: TimelineLayoutOptions<TItem>,
): TimelineLayout<TItem> {
  return useMemo(() => computeTimelineLayout(items, options), [items, options]);
}

/** Pin-on-pass for custom markup (Feature Dossier 05 F-07): register sentinels, read the pinned keys. */
export function usePinOnPass(options: {
  scrollRef: RefObject<HTMLElement | null>;
  getLine: () => number;
  edge: 'top' | 'bottom';
  epsilon: number;
  hysteresis: number;
  resetKey?: unknown;
  enabled?: boolean;
}): {
  pinnedKeys: readonly string[];
  register: (key: string, ids: readonly string[]) => (node: HTMLElement | null) => void;
  refresh: (options?: { force?: boolean }) => void;
  pause: () => void;
  resume: () => void;
} {
  const { scrollRef, epsilon, hysteresis, resetKey, enabled = true } = options;
  const getLine = useRef(options.getLine);
  useEffect(() => {
    getLine.current = options.getLine;
  });
  const [pinnedKeys, setPinnedKeys] = useState<readonly string[]>([]);
  const [registry] = useState(() => ({
    engine: null as PinEngine | null,
    nodes: new Map<string, { node: HTMLElement; ids: readonly string[] }>(),
    refs: new Map<string, (node: HTMLElement | null) => void>(),
  }));
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !enabled) return;
    const engine = createPinEngine({
      scroller,
      getLine: () => getLine.current(),
      epsilon,
      hysteresis,
      onChange: setPinnedKeys,
    });
    registry.engine = engine;
    for (const [key, entry] of registry.nodes) engine.register(key, entry.ids)(entry.node);
    return () => {
      engine.destroy();
      registry.engine = null;
    };
  }, [scrollRef, enabled, epsilon, hysteresis, registry]);
  useEffect(() => {
    registry.engine?.reset();
  }, [resetKey, registry]);
  const register = useCallback(
    (key: string, ids: readonly string[]) => {
      const cacheKey = `${key}\u0000${ids.join('\u0000')}`;
      let ref = registry.refs.get(cacheKey);
      if (!ref) {
        ref = (node) => {
          if (node) registry.nodes.set(key, { node, ids });
          else if (registry.nodes.get(key)?.ids === ids) registry.nodes.delete(key);
          registry.engine?.register(key, ids)(node);
        };
        registry.refs.set(cacheKey, ref);
      }
      return ref;
    },
    [registry],
  );
  return {
    pinnedKeys,
    register,
    refresh: useCallback(
      (refreshOptions?: { force?: boolean }) => registry.engine?.refresh(refreshOptions),
      [registry],
    ),
    pause: useCallback(() => registry.engine?.pause(), [registry]),
    resume: useCallback(() => registry.engine?.resume(), [registry]),
  };
}

/** Programmatic shift navigation for custom markup (Feature Dossier 05 F-08). */
export function useShiftNavigation(options: {
  scrollRef: RefObject<HTMLElement | null>;
  /** Scroll position of a shift offset. */
  getTarget: (offset: number, options: { extraOffset: number; align: 'start' | 'nearBottom'; time?: number }) => number;
  onStart?: () => void;
  onSettle?: () => void;
  onDone?: () => void;
}): {
  scrollTo: (
    target: number,
    options?: { smooth?: boolean; extraOffset?: number; align?: 'start' | 'nearBottom'; time?: number },
  ) => void;
} {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const { scrollRef } = options;
  const [holder] = useState(() => ({ navigator: null as Navigator | null }));
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    holder.navigator = createNavigator({
      scroller,
      onStart: () => latest.current.onStart?.(),
      onSettle: () => latest.current.onSettle?.(),
      onDone: () => latest.current.onDone?.(),
    });
    return () => {
      holder.navigator?.destroy();
      holder.navigator = null;
    };
  }, [scrollRef, holder]);
  return {
    scrollTo: useCallback(
      (target, scrollOptions = {}) => {
        const { smooth = true, extraOffset = 0, align = 'start', time } = scrollOptions;
        holder.navigator?.scrollTo(
          () =>
            latest.current.getTarget(
              target,
              time === undefined ? { extraOffset, align } : { extraOffset, align, time },
            ),
          { smooth },
        );
      },
      [holder],
    ),
  };
}

/** Everything <Scheduler> uses, without markup (Feature Dossier 04 §7). */
export function useScheduler<TItem extends SchedulerItem>(props: SchedulerProps<TItem>): SchedulerState<TItem> {
  const ctx = useSchedulerSetup(props);
  const { controller, model } = ctx;
  const kind = model.view;
  const list = useViewSetup(ctx, 'list', kind === 'list');
  const timeline = useViewSetup(ctx, 'timeline', kind === 'timeline');
  const setup = kind === 'list' ? list : timeline;
  const { runtime, viewModel } = setup.view;
  const env = setup.cardEnv;
  const handle = useMemo(() => createHandle(controller, ctx.views, ctx.focus), [controller, ctx.views, ctx.focus]);
  const layout = kind === 'timeline' && model.currentIndex >= 0 ? controller.getLayout() : null;

  const itemProps = (item: TItem): ItemProps =>
    activatorProps(env, cardData(env, item), kind === 'list' ? 'listCard' : 'timelineCard');

  return {
    view: kind,
    compact: model.compact,
    shifts: model.shifts,
    segments: model.segments,
    activeShift: viewModel.activeShift,
    pinned: viewModel.pinned.map((entry) => entry.item),
    carriedOverCount: model.carriedOverCount,
    headerExpanded: model.headerExpanded,
    layout,
    now: model.now,
    nowVisible: model.nowVisible,
    openItem: model.openItem,
    openOverflow: controller.getOverflowGroup(model.openOverflowId),
    navigation: viewModel.navigation,
    localization: model.localization,
    formatters: model.formatters,
    actions: handle,
    getRootProps: () => ({
      ref: setup.setRoot,
      role: 'region',
      'data-rs-view': kind,
      'data-rs-compact': model.compact ? '' : undefined,
    }),
    getScrollerProps: () => ({ ref: setup.setScroller, tabIndex: -1, 'data-rs-part': 'scroller' }),
    getStickyTopProps: () => ({ ref: setup.setSticky, 'data-rs-part': 'stickyTop' }),
    getNavButtonProps: (position) => {
      const nav = viewModel.navigation[position];
      return {
        type: 'button',
        'aria-disabled': nav.disabled ? true : undefined,
        'data-rs-position': position,
        onClick: (event: MouseEvent<HTMLButtonElement>) => {
          if (!nav.disabled) runtime.navigate(position, event);
        },
      } as ReturnType<SchedulerState<TItem>['getNavButtonProps']>;
    },
    getSectionProps: (segment) =>
      ({
        ref: runtime.sectionRef(segment.shift.offset),
        'data-rs-part': 'shiftSection',
        'data-rs-offset': segment.shift.offset,
      }) as ReturnType<SchedulerState<TItem>['getSectionProps']>,
    getItemProps: (item) => itemProps(item),
    getPinSentinelProps: (item) => sentinelProps(env, { ...cardData(env, item), pinnable: true }) as PinSentinelProps,
    getPinnedChipProps: (item) => ({
      type: 'button',
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        ctx.focus.remember('item', event.currentTarget);
        controller.activateItem(item, 'pinnedChip', event);
      },
    }),
    getMoreChipProps: (group: OverflowGroup<TItem>) => {
      const ids = env.pinning
        ? group.items.filter((item) => isPinnable(item, env.levels.get(item.level))).map((item) => item.id)
        : [];
      return {
        type: 'button',
        ref: runtime.sentinelRef(`more:${group.id}`, ids),
        'aria-label': interpolate(
          model.localization.more.ariaLabel,
          { count: group.items.length, time: model.formatters.clockTime(new Date(group.anchor)) },
          model.localization.locale,
        ),
        onClick: (event: MouseEvent<HTMLButtonElement>) => {
          ctx.focus.remember('overflow', event.currentTarget);
          controller.activateMore(group, event);
        },
      };
    },
    getScrollTopButtonProps: () => ({
      type: 'button',
      'aria-label': model.localization.scrollTop,
      onClick: (event: MouseEvent<HTMLButtonElement>) => runtime.scrollToTop(event),
    }),
  };
}
