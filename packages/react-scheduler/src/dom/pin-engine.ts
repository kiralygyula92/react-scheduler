// SPDX-License-Identifier: MIT
// Pin engine (Feature Dossier 05 F-07). Sentinels are observed with two IntersectionObservers on the
// scroller: one at the pin line (pin), one at the release line (unpin, hysteresis). Rects are read
// only for observer entries and on explicit refreshes, never for every card on every frame (B-12);
// observers are created once per line position, not per render (B-13).
import { nextPinned } from '../core/pinning';

/**
 * What the pin engine needs: the scroller, the rule and the items it may pin.
 *
 * @category DOM
 * @since 1.0.0
 */
export interface PinEngineOptions {
  /** The element whose top edge the pin line is measured from. */
  scroller: HTMLElement;
  /** The pin line in viewport coordinates. List: the sticky top's bottom; timeline: the scroller's top (B-05). */
  getLine: () => number;
  /** Moves the pin line, in pixels; a positive value pins earlier. */
  epsilon: number;
  /** How far back, in pixels, an item must travel before it unpins. */
  hysteresis: number;
  /** Called with the pinned ids whenever they change. */
  onChange: (ids: readonly string[]) => void;
}

/**
 * Watches the scroller and reports which items are pinned by position.
 *
 * @category DOM
 * @since 1.0.0
 */
export interface PinEngine {
  /** Registers a sentinel for `ids` under `key`; returns a ref callback. */
  register(key: string, ids: readonly string[]): (node: HTMLElement | null) => void;
  /**
   * Re-reads every sentinel once (after programmatic scrolls, data changes and mounts). Skipped while
   * paused unless `force` is set (the settle step of a programmatic scroll, 01 §L.7).
   */
  refresh(options?: { force?: boolean }): void;
  /** Re-creates the observers after the pin line moved (for example, the sticky top resized). */
  relayout(): void;
  /** Stops observing, for a view that is mounted but hidden. */
  pause(): void;
  /** Starts observing again after a pause. */
  resume(): void;
  /** Unpins everything (the selected date changed). */
  reset(): void;
  /** The ids pinned right now, in document order. */
  getPinnedIds(): readonly string[];
  /** Detaches the observer; call it when the scroller goes away. */
  destroy(): void;
}

interface Sentinel {
  node: HTMLElement;
  ids: readonly string[];
  pinned: boolean;
}

/** How far below the viewport the observed root extends (px). */
const BELOW = 100_000;

/**
 * Creates the pin engine for one scroller.
 *
 * @category DOM
 * @since 1.0.0
 * @param options The scroller, the pin line and the callback that reports the pinned ids.
 */
export function createPinEngine(options: PinEngineOptions): PinEngine {
  const { scroller, getLine, epsilon, hysteresis, onChange } = options;
  const sentinels = new Map<string, Sentinel>();
  const byNode = new Map<Element, string>();
  const detached = new Map<string, Sentinel>();
  let pinnedIds: readonly string[] = [];
  let paused = false;
  let observers: IntersectionObserver[] = [];

  const emit = (): void => {
    const next = [...new Set([...sentinels.values()].filter((s) => s.pinned).flatMap((s) => s.ids))];
    if (next.length === pinnedIds.length && next.every((id, index) => id === pinnedIds[index])) return;
    pinnedIds = next;
    onChange(next);
  };

  /** A sentinel without a box (not laid out, or display: none) keeps its state. */
  const apply = (sentinel: Sentinel, rect: DOMRectReadOnly, line: number): boolean => {
    if (rect.width === 0 && rect.height === 0) return false;
    const top = rect.top;
    const pinned = nextPinned(sentinel.pinned, top, line, { epsilon, hysteresis });
    if (pinned === sentinel.pinned) return false;
    sentinel.pinned = pinned;
    return true;
  };

  const onEntries = (entries: IntersectionObserverEntry[]): void => {
    if (paused) return;
    const line = getLine();
    let changed = false;
    for (const entry of entries) {
      const key = byNode.get(entry.target);
      const sentinel = key === undefined ? undefined : sentinels.get(key);
      if (sentinel) changed = apply(sentinel, entry.boundingClientRect, line) || changed;
    }
    if (changed) emit();
  };

  const observe = (): void => {
    for (const observer of observers) observer.disconnect();
    observers = [];
    if (typeof IntersectionObserver === 'undefined') return;
    const offset = getLine() - scroller.getBoundingClientRect().top;
    // The pin edge sits at line − epsilon, the release edge at line + hysteresis − epsilon. Each edge
    // is placed 1 px lower: a 1 px sentinel whose top is exactly on a rule's boundary then lies fully
    // outside the root, so the observer reports it and the rect check decides (≤ versus >).
    for (const edge of new Set([offset - epsilon + 1, offset + hysteresis - epsilon + 1])) {
      const observer = new IntersectionObserver(onEntries, {
        root: scroller,
        // The root reaches far below the viewport: everything under the edge counts as intersecting,
        // so a jump across the edge (from above it to below the fold) is still reported.
        rootMargin: `${-Math.round(edge)}px 0px ${BELOW}px 0px`,
        threshold: [0, 1],
      });
      for (const sentinel of sentinels.values()) observer.observe(sentinel.node);
      observers.push(observer);
    }
  };

  const refresh = (options: { force?: boolean } = {}): void => {
    if (paused && options.force !== true) return;
    const line = getLine();
    let changed = false;
    for (const sentinel of sentinels.values()) {
      changed = apply(sentinel, sentinel.node.getBoundingClientRect(), line) || changed;
    }
    if (changed) emit();
  };

  observe();

  return {
    register(key, ids) {
      return (node) => {
        const current = sentinels.get(key);
        if (current && current.node === node) {
          current.ids = ids;
          return;
        }
        if (current) {
          for (const observer of observers) observer.unobserve(current.node);
          byNode.delete(current.node);
          sentinels.delete(key);
        }
        if (!node) {
          // React detaches a ref before attaching its replacement; keep the pinned state for a
          // microtask so a re-mounted sentinel does not make its chip flicker.
          if (current?.pinned) {
            detached.set(key, current);
            queueMicrotask(() => {
              if (detached.get(key) === current) {
                detached.delete(key);
                emit();
              }
            });
          }
          return;
        }
        const previous = current ?? detached.get(key);
        detached.delete(key);
        sentinels.set(key, { node, ids, pinned: previous?.pinned ?? false });
        byNode.set(node, key);
        for (const observer of observers) observer.observe(node);
      };
    },
    refresh,
    relayout: observe,
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      refresh();
    },
    reset() {
      for (const sentinel of sentinels.values()) sentinel.pinned = false;
      emit();
    },
    getPinnedIds: () => pinnedIds,
    destroy() {
      for (const observer of observers) observer.disconnect();
      observers = [];
      sentinels.clear();
      byNode.clear();
      detached.clear();
    },
  };
}
