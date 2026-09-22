// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compensateStickyGrowth, observeCompact, observeWidth, prefersReducedMotion } from '../../src/dom/observers';
import { FakeResizeObserver, installObservers, setLayout } from '../support/dom-fakes';

beforeEach(() => {
  installObservers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('observeWidth and observeCompact', () => {
  it('reports the initial width, then every change', () => {
    const element = document.createElement('div');
    setLayout(element, { clientWidth: 1440 });
    const widths: number[] = [];
    const stop = observeWidth(element, (width) => widths.push(width));
    FakeResizeObserver.instances[0]!.trigger(800);
    stop();
    expect(widths).toEqual([1440, 800]);
  });

  it('[B-16] is compact below the breakpoint of the root width, whatever the user agent', () => {
    const element = document.createElement('div');
    setLayout(element, { clientWidth: 1000 });
    const changes: boolean[] = [];
    observeCompact(element, { breakpoint: 900, onChange: (compact) => changes.push(compact) });
    const observer = FakeResizeObserver.instances[0]!;
    observer.trigger(950);
    observer.trigger(899);
    observer.trigger(390);
    observer.trigger(900);
    expect(changes).toEqual([false, true, false]);
  });

  it('reports only the initial width without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const element = document.createElement('div');
    setLayout(element, { clientWidth: 390 });
    const onChange = vi.fn();
    observeCompact(element, { breakpoint: 900, onChange })();
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('prefersReducedMotion', () => {
  it('follows the media query and notifies subscribers', () => {
    const listeners = new Set<() => void>();
    const query = {
      matches: true,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    };
    const view = { matchMedia: vi.fn(() => query) } as unknown as Window;
    const motion = prefersReducedMotion(view);
    expect(motion.matches()).toBe(true);
    const listener = vi.fn();
    const stop = motion.subscribe(listener);
    for (const notify of listeners) notify();
    stop();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  });

  it('is false without matchMedia', () => {
    const motion = prefersReducedMotion(null);
    expect(motion.matches()).toBe(false);
    motion.subscribe(() => undefined)();
  });
});

describe('[B-21] compensateStickyGrowth', () => {
  it('moves the scroller by the sticky top’s growth in the same frame', () => {
    const scroller = document.createElement('div');
    const sticky = document.createElement('div');
    setLayout(scroller, { scrollTop: 600 });
    setLayout(sticky, { offsetHeight: 24 });
    const stop = compensateStickyGrowth(scroller, sticky);
    setLayout(sticky, { offsetHeight: 152 });
    FakeResizeObserver.instances[0]!.trigger();
    expect(scroller.scrollTop).toBe(728);
    setLayout(sticky, { offsetHeight: 24 });
    FakeResizeObserver.instances[0]!.trigger();
    expect(scroller.scrollTop).toBe(600);
    stop();
  });

  it('leaves a scroller at the very top alone', () => {
    const scroller = document.createElement('div');
    const sticky = document.createElement('div');
    setLayout(scroller, { scrollTop: 0 });
    setLayout(sticky, { offsetHeight: 24 });
    compensateStickyGrowth(scroller, sticky);
    setLayout(sticky, { offsetHeight: 152 });
    FakeResizeObserver.instances[0]!.trigger();
    expect(scroller.scrollTop).toBe(0);
  });

  it('only notes a change while suspended (a navigation corrects its own target)', () => {
    const scroller = document.createElement('div');
    const sticky = document.createElement('div');
    setLayout(scroller, { scrollTop: 600 });
    setLayout(sticky, { offsetHeight: 152 });
    let navigating = true;
    compensateStickyGrowth(scroller, sticky, () => navigating);
    setLayout(sticky, { offsetHeight: 24 });
    FakeResizeObserver.instances[0]!.trigger();
    expect(scroller.scrollTop).toBe(600);
    navigating = false;
    setLayout(sticky, { offsetHeight: 152 });
    FakeResizeObserver.instances[0]!.trigger();
    expect(scroller.scrollTop).toBe(728);
  });

  it('does nothing without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    compensateStickyGrowth(document.createElement('div'), document.createElement('div'))();
  });
});
