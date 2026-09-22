// SPDX-License-Identifier: MIT
// Handler middleware (Feature Dossier 04 §5.11, 05 F-22): for each interaction the consumer's
// handler runs first; calling `next()` runs the default behaviour (and, after it, the callbacks);
// not calling it cancels both. `next(override)` alters the context the default receives (F-09:
// "can alter or veto"; docs pack 09 §4.3); the context object itself is read-only.

export type Middleware<C> = (ctx: C, next: (override?: Partial<C>) => void) => void | Promise<void>;

/**
 * Runs `middleware` with a frozen copy of `ctx`, or `defaultBehaviour` directly when there is none.
 * `next()` runs the default at most once, and only while `isActive()` holds (for example, while the
 * component is mounted), so an asynchronous `next()` after unmount is ignored.
 */
export function runMiddleware<C extends object>(
  middleware: Middleware<C> | undefined,
  ctx: C,
  defaultBehaviour: (ctx: C) => void,
  isActive: () => boolean = () => true,
): void {
  if (!middleware) {
    defaultBehaviour(ctx);
    return;
  }
  const frozen = Object.freeze({ ...ctx });
  let called = false;
  // An asynchronous middleware's promise is the consumer's; a rejection surfaces to them unchanged.
  void middleware(frozen, (override) => {
    if (called || !isActive()) return;
    called = true;
    defaultBehaviour(override ? { ...frozen, ...override } : frozen);
  });
}
