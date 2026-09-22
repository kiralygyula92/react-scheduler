// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListView, Scheduler, TimelineView } from '../../src/index';
import { fixture } from '../parity/adapter';
import { FakeIntersectionObserver, FakeResizeObserver, mockTop, setLayout } from '../support/dom-fakes';
import { injectListLayout, injectTimelineLayout } from '../support/layout';
import { frames, part, parts, renderUi, scrollTo, settle, setupComponentEnvironment } from '../support/react';

// Regression tests for the M2 fixes (Feature Dossier 07 §4) that no scenario covers directly.
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const base = { items: baseline.items, date: baseline.date, now: baseline.now };

describe('bug regressions', () => {
  it('[B-05] the timeline pin line is the scroller top: one observer with no sticky offset', () => {
    const { container } = renderUi(<TimelineView {...base} />);
    mockTop(part(container, 'scroller'), () => 100);
    settle();
    const margins = FakeIntersectionObserver.active().map((observer) => observer.options.rootMargin);
    expect(margins).toEqual(['-1px 0px 0px 0px']);
  });

  it('[B-12] [B-13] listeners attach once per mount; scrolling reads no card rects', () => {
    const add = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const { container, rerender } = renderUi(<ListView {...base} />);
    const scroller = injectListLayout(container, {
      sticky: 24,
      client: 700,
      scroll: 4000,
      sections: [0, 612, 2400],
      header: 60,
      cards: (index) => ({ top: 672 + index * 110, height: 100 }),
    });
    settle();
    const scrollListeners = (): number =>
      add.mock.calls.filter((call, index) => call[0] === 'scroll' && add.mock.contexts[index] === scroller).length;
    expect(scrollListeners()).toBe(1);
    for (let index = 0; index < 5; index++) {
      act(() => rerender(<ListView {...base} now={`2031-03-12T10:3${index}:00`} />));
    }
    expect(scrollListeners()).toBe(1);
    const rects = vi.fn(() => new DOMRect());
    for (const card of parts(container, 'listCard')) card.getBoundingClientRect = rects;
    for (const top of [100, 200, 300, 400]) scrollTo(scroller, top);
    expect(rects).not.toHaveBeenCalled();
    add.mockRestore();
  });

  it('[B-14] only the active view is mounted; a kept view is hidden and paused', () => {
    const { container, rerender } = renderUi(<Scheduler {...base} view="list" />);
    expect(parts(container, 'scroller')).toHaveLength(1);
    expect(parts(container, 'root')).toHaveLength(1);
    act(() => rerender(<Scheduler {...base} view="list" keepInactiveViewMounted />));
    const roots = parts(container, 'root');
    expect(roots.map((root) => [root.dataset['rsView'], root.hidden])).toEqual([
      ['list', false],
      ['timeline', true],
    ]);
    // The hidden view's scroller has no scroll listener.
    const timelineScroller = part(roots[1] as HTMLElement, 'scroller');
    const add = vi.spyOn(timelineScroller, 'addEventListener');
    act(() => rerender(<Scheduler {...base} view="list" keepInactiveViewMounted />));
    expect(add).not.toHaveBeenCalledWith('scroll', expect.anything(), expect.anything());
    act(() => rerender(<Scheduler {...base} view="timeline" keepInactiveViewMounted />));
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('[B-16] compact mode follows the root width, never the user agent', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; Mobile)');
    const { container } = renderUi(<ListView {...base} />);
    const root = part(container, 'root');
    expect(root.dataset['rsCompact']).toBeUndefined();
    act(() => {
      for (const observer of FakeResizeObserver.instances) if (observer.targets.has(root)) observer.trigger(700);
    });
    expect(root.dataset['rsCompact']).toBe('');
    expect(root.dataset['rsSize']).toBe('md');
    act(() => {
      for (const observer of FakeResizeObserver.instances) if (observer.targets.has(root)) observer.trigger(1000);
    });
    expect(root.dataset['rsCompact']).toBeUndefined();
    expect(root.dataset['rsSize']).toBe('lg');
  });

  it('[B-21] when the sticky top grows, scrollTop moves by the same amount in the same frame', () => {
    const { container } = renderUi(<ListView {...base} list={{ landing: { initial: 'none' } }} />);
    const scroller = injectListLayout(container, {
      sticky: 24,
      client: 700,
      scroll: 4000,
      sections: [0, 612, 2400],
      header: 60,
      cards: (index) => ({ top: 672 + index * 110, height: 100 }),
    });
    const sticky = part(container, 'stickyTop');
    const resizeSticky = (): void =>
      act(() => {
        for (const observer of FakeResizeObserver.instances) if (observer.targets.has(sticky)) observer.trigger(1440);
      });
    // Observers deliver the initial size when observation starts.
    resizeSticky();
    settle();
    scrollTo(scroller, 600);
    setLayout(sticky, { offsetHeight: 152 });
    resizeSticky();
    expect(scroller.scrollTop).toBe(728);
    frames(1);
  });

  it('[B-04] entering the timeline computes the header once, after the landing settles', () => {
    const onHeaderExpandedChange = vi.fn();
    const props = { ...base, headerExpanded: true, onHeaderExpandedChange };
    const { container, rerender } = renderUi(<Scheduler {...props} view="list" />);
    settle();
    act(() => rerender(<Scheduler {...props} view="timeline" />));
    injectTimelineLayout(container, 712);
    settle();
    // Landing at 1876 is above the collapse threshold (1988): the value stays expanded, no flicker.
    expect(part(container, 'scroller').scrollTop).toBe(1876);
    expect(onHeaderExpandedChange).not.toHaveBeenCalled();
  });
});
