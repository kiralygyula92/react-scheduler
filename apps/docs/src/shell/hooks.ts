// SPDX-License-Identifier: MIT
// The behaviour `11/components.md` names but does not place: session state for the sidebar, Esc
// handling, the body scroll lock, the focus trap and the close-on-navigation of the overlays.
// Shared by the drawer, the two menus and the search dialog (EXCEPTIONS.md #6).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

/** Elements a dialog or menu can move focus to. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * State that survives navigation inside the tab but not the tab itself (docs pack 02 §6.3). Reads
 * once on mount, so the prerendered HTML and the first client render agree.
 */
export function useSessionState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // A blocked or full storage is not worth a broken sidebar.
    }
  }, [key]);
  const store = useCallback(
    (next: T) => {
      setValue(next);
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        // As above.
      }
    },
    [key],
  );
  return [value, store];
}

export function useEscape(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [active, onEscape]);
}

/** Keeps the page behind a modal from scrolling, without the width jump a scrollbar would cause. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${String(gap)}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [active]);
}

/**
 * Moves focus into the element when it opens, keeps Tab inside it, and returns focus to whatever
 * had it before (docs pack 07 §2). The returned ref goes on the dialog or drawer.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (container === null) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = (): HTMLElement[] => [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
    (focusables()[0] ?? container).focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items.at(-1);
      if (first === undefined || last === undefined) return;
      const active_ = document.activeElement;
      if (event.shiftKey && (active_ === first || active_ === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active_ === last) {
        event.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [active]);
  return ref;
}

/** Overlays close when the route changes, so a link inside one never leaves it open. */
export function useCloseOnRouteChange(onClose: () => void): void {
  const { pathname, hash } = useLocation();
  const first = useRef(true);
  // The route is what should trigger this, not a new `onClose` identity on every render of the owner.
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    latest.current();
  }, [pathname, hash]);
}

/** Closes a menu when the pointer goes down anywhere outside it. */
export function useDismissOnOutside(active: boolean, onDismiss: () => void): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!active) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (ref.current !== null && target instanceof Node && !ref.current.contains(target)) onDismiss();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [active, onDismiss]);
  return ref;
}
