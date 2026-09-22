// SPDX-License-Identifier: MIT
// Creates and wires the controller of one <Scheduler> / standalone view: options are synced during
// render (without notification, the owner re-renders anyway), the store is read through
// useSyncExternalStore, and the scheduler-level effects run here once, whatever views are mounted.
import {
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react';
import { createScheduler } from '../core/controller';
import type { ColorScheme, SchedulerItem, ViewKind } from '../core/types';
import { prefersReducedMotion } from '../dom/observers';
import { createFocusMemory, type FocusMemory, type SchedulerContextValue } from './context';
import type { ViewApi } from './runtime';
import type { SchedulerProps } from './types';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function matchQuery(query: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
}

/** The resolved color scheme; `system` follows `prefers-color-scheme` (light on the server). */
function useColorScheme(setting: ColorScheme): 'light' | 'dark' {
  const system = setting === 'system';
  const subscribe = useCallback(
    (listener: () => void) => {
      const query = system ? matchQuery(DARK_QUERY) : null;
      if (!query) return () => undefined;
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    },
    [system],
  );
  const dark = useSyncExternalStore(
    subscribe,
    () => system && (matchQuery(DARK_QUERY)?.matches ?? false),
    () => false,
  );
  return system ? (dark ? 'dark' : 'light') : setting;
}

/** A DOM-safe id prefix from React's generated id. */
function idPrefix(generated: string): string {
  return `rs-${generated.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export function useSchedulerSetup<TItem extends SchedulerItem>(
  props: SchedulerProps<TItem>,
  fixedView?: ViewKind,
): SchedulerContextValue<TItem> {
  const options = fixedView ? { ...props, view: fixedView } : props;
  const [controller] = useState(() => createScheduler<TItem, SyntheticEvent, KeyboardEvent>(options));
  controller.setOptions(options);
  useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const model = controller.getModel();
  const generatedId = useId();
  const scheme = useColorScheme(props.colorScheme ?? 'light');
  const [focus] = useState<FocusMemory>(createFocusMemory);
  const [views] = useState(() => new Map<ViewKind, ViewApi>());

  useEffect(() => {
    controller.setMounted(true);
    return () => controller.setMounted(false);
  }, [controller]);

  // The internal clock ticks while mounted and pauses while the document is hidden (F-11). It only
  // feeds the now indicator, so the indicator's flag turns it off too (F-24).
  const internalClock = props.now === undefined && props.enableNowIndicator !== false;
  const interval = props.nowTickInterval ?? 60_000;
  useEffect(() => {
    if (!internalClock || typeof document === 'undefined') return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = (): void => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const start = (): void => {
      stop();
      controller.setClock(Date.now());
      timer = setInterval(() => controller.setClock(Date.now()), interval);
    };
    const onVisibility = (): void => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [controller, internalClock, interval]);

  useEffect(() => {
    const query = prefersReducedMotion();
    controller.setPrefersReducedMotion(query.matches());
    return query.subscribe(() => controller.setPrefersReducedMotion(query.matches()));
  }, [controller]);

  // A detail view whose item left the data closes with 'itemRemoved' (B-03).
  const openItemMissing = model.openItemMissing;
  useEffect(() => {
    if (openItemMissing) controller.reconcileOpenItem();
  }, [controller, openItemMissing]);

  // First shift start to last shift end, on mount and whenever it changes (F-31).
  const { rangeStart, rangeEnd } = model.geometry;
  const hasShifts = model.shifts.length > 0;
  useEffect(() => {
    if (!hasShifts) return;
    controller.getOptions().onVisibleRangeChange?.({ start: new Date(rangeStart), end: new Date(rangeEnd) });
  }, [controller, hasShifts, rangeStart, rangeEnd]);

  return {
    controller,
    props,
    model,
    baseId: props.id ?? idPrefix(generatedId),
    preset: props.preset ?? 'default',
    scheme,
    focus,
    views,
  };
}
