// Component-test helpers: jsdom has no layout, observers, scrolling or animation frames that tests can
// step. These helpers install the fakes, inject geometry the way the source's characterization suite
// did, and step frames and timers deterministically.
import { act, cleanup, render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { installObservers, setLayout } from './dom-fakes';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export interface ScrollCall {
  top: number | undefined;
  behavior: ScrollBehavior | undefined;
}

export const scrollCalls: ScrollCall[] = [];

/** Installs observers, fake timers (including animation frames) and a recording `scrollTo`. */
export function setupComponentEnvironment(): void {
  beforeEach(() => {
    installObservers();
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'Date',
      ],
      now: new Date('2031-03-12T10:30:00Z'),
    });
    scrollCalls.length = 0;
    const scrollTo = function scrollTo(this: HTMLElement, options?: ScrollToOptions | number): void {
      const call = typeof options === 'object' ? options : { top: undefined, behavior: undefined };
      scrollCalls.push({ top: call.top, behavior: call.behavior });
      if (call.top !== undefined) this.scrollTop = Math.max(0, call.top);
    };
    HTMLElement.prototype.scrollTo = scrollTo;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
  });
}

export function renderUi(ui: ReactElement): RenderResult {
  let result: RenderResult | undefined;
  act(() => {
    result = render(ui);
  });
  return result as RenderResult;
}

/** Runs `count` animation frames (and the timers due until then) inside act(). */
export function frames(count = 1): void {
  for (let index = 0; index < count; index++) {
    act(() => {
      vi.advanceTimersToNextFrame();
    });
  }
}

export function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Runs every pending timer and frame, a few rounds deep. */
export function settle(): void {
  for (let round = 0; round < 5; round++) {
    act(() => {
      vi.runOnlyPendingTimers();
    });
  }
}

/** A writable scroll position: assignments are clamped to [0, max] like a real scroller. */
export function scrollable(
  element: HTMLElement,
  layout: { clientHeight: number; scrollHeight: number; top?: number },
): void {
  let scrollTop = layout.top ?? 0;
  const max = Math.max(0, layout.scrollHeight - layout.clientHeight);
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = Math.min(max, Math.max(0, value));
    },
  });
  setLayout(element, { clientHeight: layout.clientHeight, scrollHeight: layout.scrollHeight });
}

/** Sets scrollTop and dispatches the scroll event, then runs the evaluation frame. */
export function scrollTo(element: HTMLElement, top: number): void {
  act(() => {
    element.scrollTop = top;
    element.dispatchEvent(new Event('scroll'));
  });
  frames(1);
}

export function part(container: ParentNode, name: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-rs-part="${name}"]`);
  if (!element) throw new Error(`no part ${name}`);
  return element;
}

export function parts(container: ParentNode, name: string): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(`[data-rs-part="${name}"]`)];
}
