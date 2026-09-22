// SPDX-License-Identifier: MIT
// Internal store (docs pack 09 §3.4): framework-agnostic state exposed to React through
// useSyncExternalStore. No state library.

export interface Store<S> {
  getState: () => S;
  /** Replaces the state with `updater(state)`; listeners run only when the result differs (Object.is). */
  setState: (updater: (state: S) => S) => void;
  /** Returns the unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
}

export function createStore<S>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState(updater) {
      const next = updater(state);
      if (Object.is(next, state)) return;
      state = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
