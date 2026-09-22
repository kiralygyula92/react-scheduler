// SPDX-License-Identifier: MIT
// A small tooltip (Feature Dossier 02 §4.9): shown on hover and keyboard focus, above its anchor with
// a 14 px gap. The element always exists, visually hidden while closed, so the anchor's
// aria-describedby keeps working with tooltips disabled.
import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import { useViewContext } from '../context';
import { renderPart } from '../parts';
import { VISUALLY_HIDDEN } from './shared';

const GAP = 14;

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
): { anchor: TooltipAnchorProps; position: CSSProperties | null } {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const show = useCallback(() => {
    if (!enabled || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPosition({ left: rect.left + rect.width / 2, top: rect.top - GAP, transform: 'translate(-50%, -100%)' });
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
  id: string;
  position: CSSProperties | null;
  children: ReactNode;
}): ReactElement {
  const { custom } = useViewContext();
  return renderPart(custom, 'tooltip', 'div', {
    id,
    role: 'tooltip',
    className: position ? undefined : VISUALLY_HIDDEN,
    style: position ?? undefined,
    children,
  });
}
