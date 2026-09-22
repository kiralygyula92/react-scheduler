import { describe, expect, it, vi } from 'vitest';
import { runMiddleware } from '../../src/core/middleware';
import { createStore } from '../../src/core/store';

describe('createStore', () => {
  it('reads, updates and notifies subscribers only on change', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState((state) => ({ count: state.count + 1 }));
    expect(store.getState()).toEqual({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    store.setState((state) => state);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setState(() => ({ count: 5 }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('lets a listener unsubscribe another during notification without skipping it this round', () => {
    const store = createStore(0);
    const calls: string[] = [];
    const offB = store.subscribe(() => calls.push('b'));
    store.subscribe(() => {
      calls.push('a');
      offB();
    });
    store.setState(() => 1);
    store.setState(() => 2);
    expect(calls).toEqual(['b', 'a', 'a']);
  });
});

describe('runMiddleware', () => {
  it('runs the default directly without middleware', () => {
    const run = vi.fn();
    runMiddleware(undefined, { id: 'x' }, run);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('runs the default only when next() is called, at most once', () => {
    const run = vi.fn();
    runMiddleware<{ id: string }>(
      (_ctx, next) => {
        next();
        next();
      },
      { id: 'x' },
      run,
    );
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('cancels the default when next() is not called', () => {
    const run = vi.fn();
    runMiddleware(() => undefined, { id: 'x' }, run);
    expect(run).not.toHaveBeenCalled();
  });

  it('passes a frozen copy of the context', () => {
    const ctx = { id: 'x' };
    runMiddleware<{ id: string }>(
      (received) => {
        expect(received).toEqual(ctx);
        expect(received).not.toBe(ctx);
        expect(Object.isFrozen(received)).toBe(true);
      },
      ctx,
      () => undefined,
    );
  });

  it('ignores an asynchronous next() once the owner is no longer active', async () => {
    const run = vi.fn();
    let active = true;
    let resume: () => void = () => undefined;
    runMiddleware<{ id: string }>(
      (_ctx, next) => {
        resume = next;
      },
      { id: 'x' },
      run,
      () => active,
    );
    active = false;
    await Promise.resolve();
    resume();
    expect(run).not.toHaveBeenCalled();
  });
});
