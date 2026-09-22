// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinEngine } from '../../src/dom/pin-engine';
import { FakeIntersectionObserver, installObservers, mockTop } from '../support/dom-fakes';

// Scroller at viewport top 0; the pin line (the sticky top's bottom) at 152 px.
const LINE = 152;

function setup(rule = { epsilon: 2, hysteresis: 24 }) {
  const scroller = document.createElement('div');
  mockTop(scroller, () => 0);
  const onChange = vi.fn();
  const engine = createPinEngine({ scroller, getLine: () => LINE, onChange, ...rule });
  const tops = new Map<string, number>();
  const sentinel = (key: string, ids: string[] = [key]): HTMLElement => {
    const node = document.createElement('span');
    tops.set(key, 1000);
    mockTop(node, () => tops.get(key) ?? 0);
    engine.register(key, ids)(node);
    return node;
  };
  return { scroller, engine, onChange, tops, sentinel };
}

beforeEach(() => {
  installObservers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createPinEngine', () => {
  it('observes the scroller with one observer at the pin edge and one at the release edge', () => {
    setup();
    expect(FakeIntersectionObserver.active().map((o) => o.options.rootMargin)).toEqual([
      '-151px 0px 100000px 0px',
      '-175px 0px 100000px 0px',
    ]);
  });

  it('pins with epsilon and releases with hysteresis, from observer entries only (BR-L05 rule)', () => {
    const { engine, onChange, tops, sentinel } = setup();
    const node = sentinel('c06');
    const [pinEdge] = FakeIntersectionObserver.active();
    const states: boolean[] = [];
    for (const offset of [5, -1, -3, 20, 23]) {
      tops.set('c06', LINE + offset);
      pinEdge!.trigger([node]);
      states.push(engine.getPinnedIds().includes('c06'));
    }
    expect(states).toEqual([false, false, true, true, false]);
    expect(onChange.mock.calls).toEqual([[['c06']], [[]]]);
  });

  it('[B-12] reads rects only for observer entries and on explicit refreshes', () => {
    const { engine, sentinel } = setup();
    const a = sentinel('a');
    const b = sentinel('b');
    const spyA = vi.spyOn(a, 'getBoundingClientRect');
    const spyB = vi.spyOn(b, 'getBoundingClientRect');
    FakeIntersectionObserver.active()[0]!.trigger([a]);
    expect([spyA.mock.calls.length, spyB.mock.calls.length]).toEqual([1, 0]);
    engine.refresh();
    expect([spyA.mock.calls.length, spyB.mock.calls.length]).toEqual([2, 1]);
  });

  it('maps one sentinel to several ids (a "+more" chip pins every pinnable item of its group)', () => {
    const { engine, tops, sentinel } = setup({ epsilon: 0, hysteresis: 0 });
    sentinel('group-9', ['c04', 'c05']);
    tops.set('group-9', LINE - 1);
    engine.refresh();
    expect(engine.getPinnedIds()).toEqual(['c04', 'c05']);
  });

  it('ignores entries while paused and refreshes on resume', () => {
    const { engine, tops, sentinel } = setup();
    const node = sentinel('x');
    engine.pause();
    tops.set('x', 0);
    FakeIntersectionObserver.active()[0]!.trigger([node]);
    engine.refresh();
    expect(engine.getPinnedIds()).toEqual([]);
    engine.resume();
    expect(engine.getPinnedIds()).toEqual(['x']);
  });

  it('resets to nothing pinned', () => {
    const { engine, onChange, tops, sentinel } = setup();
    sentinel('x');
    tops.set('x', 0);
    engine.refresh();
    engine.reset();
    expect(engine.getPinnedIds()).toEqual([]);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('keeps the pinned state when React re-mounts a sentinel (detach, then attach)', async () => {
    const { engine, onChange, tops, sentinel } = setup();
    const node = sentinel('x');
    tops.set('x', 0);
    engine.refresh();
    const replacement = document.createElement('span');
    mockTop(replacement, () => 0);
    engine.register('x', ['x'])(null);
    engine.register('x', ['x'])(replacement);
    await Promise.resolve();
    expect(engine.getPinnedIds()).toEqual(['x']);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(FakeIntersectionObserver.active()[0]!.targets.has(node)).toBe(false);
    expect(FakeIntersectionObserver.active()[0]!.targets.has(replacement)).toBe(true);
  });

  it('drops an unmounted sentinel’s items after a microtask', async () => {
    const { engine, tops, sentinel } = setup();
    sentinel('x');
    tops.set('x', 0);
    engine.refresh();
    engine.register('x', ['x'])(null);
    expect(engine.getPinnedIds()).toEqual(['x']);
    await Promise.resolve();
    expect(engine.getPinnedIds()).toEqual([]);
  });

  it('updates the ids of a sentinel registered again with the same node', () => {
    const { engine, tops, sentinel } = setup({ epsilon: 0, hysteresis: 0 });
    const node = sentinel('group', ['a']);
    engine.register('group', ['a', 'b'])(node);
    tops.set('group', 0);
    engine.refresh();
    expect(engine.getPinnedIds()).toEqual(['a', 'b']);
  });

  it('[B-13] re-creates observers only on relayout, and disconnects them on destroy', () => {
    const { engine } = setup();
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    engine.refresh();
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    engine.relayout();
    expect(FakeIntersectionObserver.active()).toHaveLength(2);
    engine.destroy();
    expect(FakeIntersectionObserver.active()).toHaveLength(0);
  });

  it('uses a single observer when epsilon and hysteresis put both edges on the line', () => {
    setup({ epsilon: 0, hysteresis: 0 });
    expect(FakeIntersectionObserver.active()).toHaveLength(1);
  });

  it('works without IntersectionObserver through refreshes', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { engine, tops, sentinel } = setup();
    sentinel('x');
    tops.set('x', 0);
    engine.refresh();
    expect(engine.getPinnedIds()).toEqual(['x']);
  });
});
