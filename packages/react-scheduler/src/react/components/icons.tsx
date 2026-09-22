// SPDX-License-Identifier: MIT
// Hand-drawn icons. All are decorative (aria-hidden); the controls they sit in carry the names.
import type { ReactElement, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

/**
 * The pill marker: a 4 × 4 square rotated −45° about (0, 2.828) inside a 6 × 6 box (Feature Dossier
 * 02 §4.5), filled with the current text color.
 */
export function DiamondIcon(props: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 6 6" width="6" height="6" aria-hidden="true" focusable="false" {...props}>
      <rect x="0" y="2.828" width="4" height="4" transform="rotate(-45 0 2.828)" />
    </svg>
  );
}

export function ChevronUpIcon(props: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M6.5 14.5 12 9l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon(props: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon(props: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

/** Sort direction arrow: points up for ascending, down for descending. */
export function SortArrowIcon({ direction, ...props }: IconProps & { direction: 'asc' | 'desc' }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
      <path
        d={direction === 'asc' ? 'M12 19V5m0 0-6 6m6-6 6 6' : 'M12 5v14m0 0-6-6m6 6 6-6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The indeterminate progress indicator of the loading state. */
export function Spinner(props: IconProps): ReactElement {
  return (
    <svg className="rs-spinner" viewBox="22 22 44 44" aria-hidden="true" focusable="false" {...props}>
      <circle cx="44" cy="44" r="20.2" />
    </svg>
  );
}
