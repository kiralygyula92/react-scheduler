// SPDX-License-Identifier: MIT
// Native modal dialogs (Feature Dossier 05 F-13, F-14): `showModal()` gives focus containment, the
// Escape key and the backdrop; closing is controlled by the scheduler state, so Escape is reported and
// the element closes when React unmounts it.
import { type MouseEvent, type RefCallback, type SyntheticEvent, useCallback } from 'react';
import type { CloseReason } from '../../core/types';

export interface ModalProps {
  ref: RefCallback<HTMLDialogElement>;
  onCancel: (event: SyntheticEvent<HTMLDialogElement>) => void;
  onClick: (event: MouseEvent<HTMLDialogElement>) => void;
}

/** Props that open a <dialog> modally on mount and report Escape and backdrop clicks. */
export function useModal(onClose: (reason: CloseReason) => void): ModalProps {
  const ref = useCallback((dialog: HTMLDialogElement | null) => {
    if (!dialog || dialog.open) return;
    try {
      dialog.showModal();
    } catch {
      // Not connected yet or unsupported: the open attribute still shows it.
      dialog.setAttribute('open', '');
    }
  }, []);
  return {
    ref,
    onCancel: (event) => {
      event.preventDefault();
      onClose('escape');
    },
    onClick: (event) => {
      // A click on the backdrop targets the dialog itself, outside its box.
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside || (rect.width === 0 && rect.height === 0)) onClose('backdrop');
    },
  };
}
