// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNavigator } from '../../src/dom/navigator';

function scrollerAt(initial = 0): HTMLElement & { scrollSpy: ReturnType<typeof vi.fn> } {
  const scrollSpy = vi.fn();
  const scroller = Object.assign(document.createElement('div'), { scrollSpy });
  let top = initial;
  Object.defineProperty(scroller, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = Math.max(0, value);
    },
  });
  scroller.scrollTo = scrollSpy;
  return scroller;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('createNavigator (instant path)', () => {
  it('sets scrollTop, re-sets it next frame, corrects, and signals start, settle and done', () => {
    const scroller = scrollerAt();
    const calls: string[] = [];
    const navigator = createNavigator({
      scroller,
      onStart: () => calls.push('start'),
      onSettle: () => calls.push('settle'),
      onDone: () => calls.push('done'),
    });
    let target = 452;
    navigator.scrollTo(() => target, { smooth: false });
    expect(scroller.scrollTop).toBe(452);
    expect(scroller.scrollSpy).not.toHaveBeenCalled();
    target = 580; // the pinned strip grew; the target moved
    vi.advanceTimersToNextFrame();
    expect(scroller.scrollTop).toBe(580);
    vi.advanceTimersToNextFrame();
    vi.advanceTimersByTime(179);
    expect(calls).toEqual(['start', 'settle']);
    vi.advanceTimersByTime(1);
    expect(calls).toEqual(['start', 'settle', 'done']);
  });
});

describe('createNavigator (smooth path)', () => {
  it('scrolls smoothly and corrects after scrollend', () => {
    const scroller = scrollerAt();
    const onSettle = vi.fn();
    const navigator = createNavigator({ scroller, onSettle });
    navigator.scrollTo(() => 4050);
    expect(scroller.scrollSpy).toHaveBeenCalledWith({ top: 4050, behavior: 'smooth' });
    scroller.scrollTop = 4047; // the smooth scroll ended 3 px short
    scroller.dispatchEvent(new Event('scrollend'));
    expect(onSettle).toHaveBeenCalledTimes(1);
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    expect(scroller.scrollTop).toBe(4050);
  });

  it('does not correct within 1 px', () => {
    const scroller = scrollerAt();
    createNavigator({ scroller }).scrollTo(() => 100);
    scroller.scrollTop = 101;
    scroller.dispatchEvent(new Event('scrollend'));
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    expect(scroller.scrollTop).toBe(101);
  });

  it('finishes after the settle delay when already at the target (no scrollend fires)', () => {
    const scroller = scrollerAt(1986);
    const onSettle = vi.fn();
    createNavigator({ scroller, onSettle }).scrollTo(() => 1986);
    vi.advanceTimersByTime(500);
    expect(onSettle).toHaveBeenCalledTimes(1);
    scroller.dispatchEvent(new Event('scrollend'));
    expect(onSettle).toHaveBeenCalledTimes(1);
  });

  it('replaces a pending navigation: the last call wins', () => {
    const scroller = scrollerAt();
    const onSettle = vi.fn();
    const navigator = createNavigator({ scroller, onSettle });
    navigator.scrollTo(() => 100);
    navigator.scrollTo(() => 200);
    scroller.scrollTop = 150;
    scroller.dispatchEvent(new Event('scrollend'));
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(scroller.scrollTop).toBe(200);
  });

  it('uses a settle timer after the last scroll event when scrollend is unsupported', () => {
    const scroller = scrollerAt();
    const onscrollend = Object.getOwnPropertyDescriptor(window, 'onscrollend');
    // @ts-expect-error -- simulate an engine without scrollend
    delete window.onscrollend;
    try {
      const onSettle = vi.fn();
      createNavigator({ scroller, onSettle }).scrollTo(() => 300);
      vi.advanceTimersByTime(400);
      scroller.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(400);
      expect(onSettle).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(onSettle).toHaveBeenCalledTimes(1);
    } finally {
      if (onscrollend) Object.defineProperty(window, 'onscrollend', onscrollend);
    }
  });

  it('cancel and destroy stop pending work', () => {
    const scroller = scrollerAt();
    const onSettle = vi.fn();
    const navigator = createNavigator({ scroller, onSettle });
    navigator.scrollTo(() => 50, { smooth: false });
    navigator.destroy();
    vi.advanceTimersByTime(1000);
    vi.advanceTimersToNextFrame();
    expect(onSettle).not.toHaveBeenCalled();
  });
});
