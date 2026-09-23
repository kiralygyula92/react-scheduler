// SPDX-License-Identifier: MIT
// Size and media observers (Feature Dossier 05 F-07, F-16, F-17). Globals are touched only when a
// function runs, never at import (F-28).

/**
 * Calls `onWidth` with the element's content-box width now and whenever it changes. Compact mode and
 * `listOnlyBreakpoint` use the root's width, not the viewport or the user agent (B-16).
 */
export function observeWidth(element: HTMLElement, onWidth: (width: number) => void): () => void {
  onWidth(element.clientWidth);
  if (typeof ResizeObserver === 'undefined') return () => undefined;
  const observer = new ResizeObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (entry) onWidth(entry.contentRect.width);
  });
  observer.observe(element);
  return () => observer.disconnect();
}

/** `onChange(compact)` with compact = width below `breakpoint`, now and on every change. */
export function observeCompact(
  element: HTMLElement,
  options: { breakpoint: number; onChange: (compact: boolean) => void },
): () => void {
  let last: boolean | undefined;
  return observeWidth(element, (width) => {
    const compact = width < options.breakpoint;
    if (compact === last) return;
    last = compact;
    options.onChange(compact);
  });
}

/**
 * Whether motion is reduced, and a way to subscribe to that changing.
 *
 * @category DOM
 * @since 1.0.0
 */
export interface ReducedMotion {
  matches(): boolean;
  subscribe(listener: () => void): () => void;
}

/** The `prefers-reduced-motion: reduce` media query; false when media queries are unavailable. */
export function prefersReducedMotion(
  view: Window | null = typeof window === 'undefined' ? null : window,
): ReducedMotion {
  const query = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  return {
    matches: () => query?.matches ?? false,
    subscribe(listener) {
      if (!query) return () => undefined;
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    },
  };
}

/**
 * Keeps visible content still when `sticky` (inside the scroller) changes height: the scroller moves
 * by the same amount in the same frame, in every engine (B-21). The scroller sets
 * `overflow-anchor: none`, so browser scroll anchoring never adds a second shift. While
 * `suspended()` holds (a programmatic scroll that corrects its own target), a change is only noted.
 */
export function compensateStickyGrowth(
  scroller: HTMLElement,
  sticky: HTMLElement,
  suspended: () => boolean = () => false,
): () => void {
  if (typeof ResizeObserver === 'undefined') return () => undefined;
  let height = sticky.offsetHeight;
  const observer = new ResizeObserver(() => {
    const next = sticky.offsetHeight;
    const delta = next - height;
    height = next;
    if (delta !== 0 && scroller.scrollTop > 0 && !suspended()) scroller.scrollTop += delta;
  });
  observer.observe(sticky);
  return () => observer.disconnect();
}
