// SPDX-License-Identifier: MIT
// A small tooltip (Feature Dossier 02 §4.9): shown on hover and keyboard focus, centered above its
// anchor with a 14 px gap, at whole-pixel positions. The element always exists, visually hidden while
// closed, so the anchor's aria-describedby keeps working with tooltips disabled.
import { type FocusEvent, type KeyboardEvent, type ReactElement, type ReactNode, useCallback, useState } from 'react';
import { useViewContext } from '../context';
import { renderPart } from '../parts';
import { VISUALLY_HIDDEN } from './shared';

const GAP = 14;

/** Where the tooltip points: the anchor's horizontal center and top edge, in viewport pixels. */
export interface TooltipAnchor {
  center: number;
  top: number;
}

export interface TooltipAnchorProps {
  'aria-describedby': string;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  ref: (node: HTMLElement | null) => void;
}

export function useTooltip(
  id: string,
  enabled: boolean,
): { anchor: TooltipAnchorProps; position: TooltipAnchor | null } {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<TooltipAnchor | null>(null);
  const show = useCallback(() => {
    if (!enabled || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPosition({ center: rect.left + rect.width / 2, top: rect.top });
  }, [anchor, enabled]);
  const hide = useCallback(() => setPosition(null), []);
  return {
    anchor: {
      'aria-describedby': id,
      ref: setAnchor,
      onPointerEnter: show,
      onPointerLeave: hide,
      onFocus: (event) => {
        // Keyboard focus only: a pointer click focuses too, and hover already shows the tooltip.
        let keyboard = true;
        try {
          keyboard = event.currentTarget.matches(':focus-visible');
        } catch {
          // Engines without :focus-visible show the tooltip on every focus.
        }
        if (keyboard) show();
      },
      onBlur: hide,
      onKeyDown: (event) => {
        if (event.key === 'Escape') hide();
      },
    },
    position,
  };
}

/** The tooltip part; `position` comes from `useTooltip` (null while closed). */
export function Tooltip({
  id,
  position,
  children,
}: {
  /** The id the described element points at. */
  id: string;
  /** Where the tooltip is anchored, or `null` while it is not shown. */
  position: TooltipAnchor | null;
  /** The text of the tooltip. */
  children: ReactNode;
}): ReactElement {
  const { custom } = useViewContext();
  // Centered on the anchor from the tooltip's own measured size, rounded to whole pixels as a popper
  // positions it. A new position is a new ref, so React places it again at commit, before paint.
  const place = useCallback(
    (node: HTMLElement | null) => {
      if (!node || !position) return;
      const { width, height } = node.getBoundingClientRect();
      node.style.left = `${Math.round(position.center - width / 2)}px`;
      node.style.top = `${Math.round(position.top - GAP - height)}px`;
    },
    [position],
  );
  return renderPart(custom, 'tooltip', 'div', {
    id,
    ref: place,
    role: 'tooltip',
    className: position ? undefined : VISUALLY_HIDDEN,
    children,
  });
}
