// SPDX-License-Identifier: MIT
// Handler middleware (Feature Dossier 04 §5.11, 05 F-22): for each interaction the consumer's
// handler runs first; calling `next()` runs the default behaviour (and, after it, the callbacks);
// not calling it cancels both.

export type Middleware<C> = (ctx: C, next: () => void) => void;

/**
 * Runs `middleware` with a frozen copy of `ctx`, or `defaultBehaviour` directly when there is none.
 * `next()` runs the default at most once, and only while `isActive()` holds (for example, while the
 * component is mounted), so an asynchronous `next()` after unmount is ignored.
 */
export function runMiddleware<C extends object>(
  middleware: Middleware<C> | undefined,
  ctx: C,
  defaultBehaviour: () => void,
  isActive: () => boolean = () => true,
): void {
  if (!middleware) {
    defaultBehaviour();
    return;
  }
  let called = false;
  middleware(Object.freeze({ ...ctx }), () => {
    if (called || !isActive()) return;
    called = true;
    defaultBehaviour();
  });
}
