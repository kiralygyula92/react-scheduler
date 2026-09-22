// SPDX-License-Identifier: MIT
// Programmatic scrolling (Feature Dossier 01 §L.7, §T.10, 05 F-08). Targets are re-measured at every
// step, so late layout changes (for example, the pinned strip growing) are corrected.

export interface NavigatorHooks {
  /** Called before a navigation starts (the list pauses pinning). */
  onStart?: () => void;
  /** Called when the scroll settled, before the final correction frame (force a pin refresh). */
  onSettle?: () => void;
  /** Called `resumeDelay` ms after the final correction (the list resumes pinning). */
  onDone?: () => void;
}

export interface NavigatorOptions extends NavigatorHooks {
  scroller: HTMLElement;
  /** ms after the final correction before onDone. Default 180. */
  resumeDelay?: number;
  /** ms without scroll events that count as settled when `scrollend` is not supported. Default 500. */
  settleDelay?: number;
}

export interface Navigator {
  /** Scrolls to `target()`; smooth unless `smooth` is false. A new call replaces a pending one. */
  scrollTo(target: () => number, options?: { smooth?: boolean }): void;
  cancel(): void;
  destroy(): void;
}

const CORRECTION_TOLERANCE = 1;

export function createNavigator(options: NavigatorOptions): Navigator {
  const { scroller, onStart, onSettle, onDone } = options;
  const resumeDelay = options.resumeDelay ?? 180;
  const settleDelay = options.settleDelay ?? 500;
  const view = scroller.ownerDocument.defaultView;
  const supportsScrollEnd = view !== null && 'onscrollend' in view;
  let cleanup: (() => void)[] = [];
  let generation = 0;

  const cancel = (): void => {
    for (const dispose of cleanup) dispose();
    cleanup = [];
  };
  const frame = (callback: () => void): void => {
    const id = requestAnimationFrame(callback);
    cleanup.push(() => cancelAnimationFrame(id));
  };
  const timeout = (callback: () => void, delay: number): void => {
    const id = setTimeout(callback, delay);
    cleanup.push(() => clearTimeout(id));
  };
  const correct = (target: () => number): void => {
    const top = target();
    if (Math.abs(scroller.scrollTop - top) > CORRECTION_TOLERANCE) scroller.scrollTop = top;
  };
  const finish = (target: () => number, run: number): void => {
    onSettle?.();
    frame(() =>
      frame(() => {
        if (run !== generation) return;
        correct(target);
        timeout(() => onDone?.(), resumeDelay);
      }),
    );
  };

  return {
    scrollTo(target, { smooth = true } = {}) {
      cancel();
      const run = ++generation;
      onStart?.();
      if (!smooth) {
        // Instant path: set, set again next frame, then correct.
        scroller.scrollTop = target();
        frame(() => {
          scroller.scrollTop = target();
          onSettle?.();
          frame(() => {
            correct(target);
            timeout(() => onDone?.(), resumeDelay);
          });
        });
        return;
      }
      if (typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: target(), behavior: 'smooth' });
      else scroller.scrollTop = target();
      let finished = false;
      const finishOnce = (): void => {
        if (finished) return;
        finished = true;
        finish(target, run);
      };
      if (supportsScrollEnd) {
        const onEnd = (): void => finishOnce();
        scroller.addEventListener('scrollend', onEnd, { once: true });
        cleanup.push(() => scroller.removeEventListener('scrollend', onEnd));
        // A smooth scroll that does not move (already at the target) fires no scrollend.
        timeout(() => {
          if (Math.abs(scroller.scrollTop - target()) <= CORRECTION_TOLERANCE) finishOnce();
        }, settleDelay);
      } else {
        // Settle timer: settleDelay after the last scroll event.
        let timer: ReturnType<typeof setTimeout> | undefined;
        const arm = (): void => {
          if (timer !== undefined) clearTimeout(timer);
          timer = setTimeout(finishOnce, settleDelay);
        };
        scroller.addEventListener('scroll', arm, { passive: true });
        cleanup.push(() => {
          scroller.removeEventListener('scroll', arm);
          if (timer !== undefined) clearTimeout(timer);
        });
        arm();
      }
    },
    cancel,
    destroy: cancel,
  };
}
