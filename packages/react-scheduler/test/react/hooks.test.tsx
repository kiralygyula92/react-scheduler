// @vitest-environment jsdom
import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import { type ReactElement, type RefObject, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { computeTimelineLayout } from '../../src/core/layout';
import {
  type SchedulerProps,
  useCompact,
  useControllableState,
  useNow,
  usePinOnPass,
  useScheduler,
  useShiftModel,
  useShiftNavigation,
  useTimelineLayout,
} from '../../src/index';
import { fixture, type ParityItem, parityLayoutOptions } from '../parity/adapter';
import { FakeIntersectionObserver, FakeResizeObserver, mockTop, setLayout } from '../support/dom-fakes';
import { renderUi, settle, setupComponentEnvironment } from '../support/react';

// The headless hooks (Feature Dossier 04 §7, 05 F-27): each concern on its own, and useScheduler's
// state and prop getters rebuilding a view with custom markup.
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const now = '2031-03-12T10:41:00';

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('useControllableState', () => {
  it('keeps its own value when uncontrolled and reports changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<number | undefined>(undefined, 1, onChange));
    expect(result.current[0]).toBe(1);
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);
    act(() => result.current[1](2));
    expect(onChange.mock.calls).toEqual([[2]]);
  });

  it('follows the given value when controlled and only reports a request', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(({ value }) => useControllableState(value, 1, onChange), {
      initialProps: { value: 5 },
    });
    act(() => result.current[1](6));
    expect(result.current[0]).toBe(5);
    expect(onChange.mock.calls).toEqual([[6]]);
    rerender({ value: 6 });
    expect(result.current[0]).toBe(6);
  });
});

describe('useNow', () => {
  it('returns a fixed time as epoch ms', () => {
    const { result } = renderHook(() => useNow({ now: '2031-03-12T10:41:00Z' }));
    expect(result.current).toBe(Date.parse('2031-03-12T10:41:00Z'));
  });

  it('ticks every interval and pauses while the document is hidden (F-11)', () => {
    const { result } = renderHook(() => useNow({ interval: 1_000 }));
    const start = result.current;
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(result.current).toBe(start + 3_000);
    setHidden(true);
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current).toBe(start + 3_000);
    setHidden(false);
    // Showing the document catches up at once, then ticks again.
    expect(result.current).toBe(start + 63_000);
    expect(vi.getTimerCount()).toBe(1);
    Reflect.deleteProperty(document, 'hidden');
  });
});

describe('useCompact', () => {
  function Probe(props: { compact?: boolean | 'auto'; onValue: (value: boolean) => void }): ReactElement {
    const ref = useRef<HTMLDivElement>(null);
    props.onValue(useCompact(ref, props.compact === undefined ? {} : { compact: props.compact }));
    return <div ref={ref} />;
  }

  it('follows the content width against the 900 px breakpoint (B-16), or a forced value', () => {
    const values: boolean[] = [];
    renderUi(<Probe onValue={(value) => values.push(value)} />);
    const [observer] = FakeResizeObserver.instances;
    act(() => observer?.trigger(600));
    act(() => observer?.trigger(1200));
    expect(values.at(-1)).toBe(false);
    expect(values).toContain(true);
    const forced: boolean[] = [];
    renderUi(<Probe compact onValue={(value) => forced.push(value)} />);
    expect(forced.at(-1)).toBe(true);
  });
});

describe('useShiftModel and useTimelineLayout', () => {
  it('buckets the items into the day’s shifts, with the current one at offset 0', () => {
    const { result } = renderHook(() => useShiftModel({ items: baseline.items, date: baseline.date }));
    const { shifts, segments, current } = result.current;
    expect(current.offset).toBe(0);
    expect(segments.map((segment) => segment.shift)).toEqual(shifts);
    expect(segments.flatMap((segment) => segment.items.map((item) => item.id)).sort()).toEqual(
      baseline.items.map((item) => item.id).sort(),
    );
  });

  it('accepts ready-made segments', () => {
    const { result: bucketed } = renderHook(() => useShiftModel({ items: baseline.items, date: baseline.date }));
    const given = bucketed.current.segments.map(({ shift, items }) => ({
      role: shift.role,
      offset: shift.offset,
      key: shift.key,
      start: shift.start,
      end: shift.end,
      items,
    }));
    const { result } = renderHook(() => useShiftModel({ segments: given, date: baseline.date }));
    expect(result.current.shifts).toEqual(bucketed.current.shifts);
  });

  it('returns the engine’s layout, memoized on its inputs', () => {
    const options = parityLayoutOptions(baseline.date, false);
    const { result, rerender } = renderHook(() => useTimelineLayout(baseline.items, options));
    expect(result.current).toEqual(computeTimelineLayout(baseline.items, options));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe('usePinOnPass', () => {
  it('pins registered sentinels once they pass the line, from observer entries', () => {
    const line = 100;
    const tops = new Map([['a', 400]]);
    let pinned: readonly string[] = [];
    function Strip(): ReactElement {
      const scrollRef = useRef<HTMLDivElement>(null);
      const pins = usePinOnPass({ scrollRef, getLine: () => line, edge: 'top', epsilon: 0, hysteresis: 0 });
      pinned = pins.pinnedKeys;
      return (
        <div
          ref={(node) => {
            if (node) mockTop(node, () => 0);
            scrollRef.current = node;
          }}
        >
          <span
            data-testid="a"
            ref={(node) => {
              if (node) mockTop(node, () => tops.get('a') ?? 0);
              pins.register('a', ['item-a'])(node);
            }}
          />
        </div>
      );
    }
    renderUi(<Strip />);
    const sentinel = screen.getByTestId('a');
    tops.set('a', line - 50);
    act(() => FakeIntersectionObserver.active()[0]?.trigger([sentinel]));
    expect(pinned).toEqual(['item-a']);
    tops.set('a', line + 50);
    act(() => FakeIntersectionObserver.active()[0]?.trigger([sentinel]));
    expect(pinned).toEqual([]);
  });
});

describe('useShiftNavigation', () => {
  it('scrolls to the target the consumer computes, instantly when smooth is off', () => {
    const getTarget = vi.fn((offset: number) => 1000 + offset * 500);
    const onDone = vi.fn();
    let navigate: ((target: number, options?: { smooth?: boolean }) => void) | undefined;
    function Nav(): ReactElement {
      const scrollRef: RefObject<HTMLDivElement | null> = useRef(null);
      navigate = useShiftNavigation({ scrollRef, getTarget, onDone }).scrollTo;
      return (
        <div
          data-testid="scroller"
          ref={(node) => {
            if (node) setLayout(node, { scrollTop: 0 });
            scrollRef.current = node;
          }}
        />
      );
    }
    renderUi(<Nav />);
    act(() => navigate?.(1, { smooth: false }));
    settle();
    expect(getTarget).toHaveBeenCalledWith(1, { extraOffset: 0, align: 'start' });
    expect(screen.getByTestId('scroller').scrollTop).toBe(1500);
    expect(onDone).toHaveBeenCalled();
  });
});

describe('useScheduler', () => {
  function Custom(props: SchedulerProps<ParityItem>): ReactElement {
    const scheduler = useScheduler(props);
    return (
      <div {...scheduler.getRootProps()} aria-label="Custom agenda">
        <div {...scheduler.getStickyTopProps()}>
          <button {...scheduler.getNavButtonProps('top')}>{`top ${String(scheduler.navigation.top.disabled)}`}</button>
        </div>
        <div {...scheduler.getScrollerProps()}>
          {scheduler.segments.map((segment) => (
            <section key={segment.shift.offset} {...scheduler.getSectionProps(segment)}>
              {segment.items.map((item) => (
                <button key={item.id} {...scheduler.getItemProps(item)}>
                  {item.title}
                </button>
              ))}
            </section>
          ))}
        </div>
        <output data-testid="state">
          {JSON.stringify({ view: scheduler.view, open: scheduler.openItem?.id ?? null })}
        </output>
      </div>
    );
  }

  it('rebuilds the list with custom markup: state, sections and item activation', () => {
    renderUi(<Custom items={baseline.items} date={baseline.date} now={now} />);
    settle();
    const state = (): { view: string; open: string | null } =>
      JSON.parse(screen.getByTestId('state').textContent ?? '{}') as { view: string; open: string | null };
    expect(state()).toEqual({ view: 'list', open: null });
    expect(document.querySelectorAll('[data-rs-part="shiftSection"]').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Server room alert/ }));
    expect(state().open).toBe(baseline.items.find((item) => item.title === 'Server room alert')?.id);
  });
});
