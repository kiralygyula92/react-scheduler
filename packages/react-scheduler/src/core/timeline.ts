// SPDX-License-Identifier: MIT
// Timeline geometry and scroll rules (Feature Dossier 05 F-05, F-09, F-10). Positions are CSS px in
// the scroller's content, where the grid starts after its top padding.
import { HOUR } from './time';
import type { LandingTarget, ShiftWindow } from './types';

/** The time grid's top padding (Feature Dossier 02 §1.5). */
export const GRID_PAD_TOP = 8;

export interface TimelineGeometry {
  /** First rendered shift start. */
  rangeStart: number;
  /** Last rendered shift end. */
  rangeEnd: number;
  hourHeight: number;
  /** leadMinutes in px. */
  lead: number;
}

export function timelineGeometry(
  shifts: readonly ShiftWindow[],
  hourHeight: number,
  leadMinutes: number,
): TimelineGeometry {
  return {
    rangeStart: shifts[0]?.start ?? 0,
    rangeEnd: shifts[shifts.length - 1]?.end ?? 0,
    hourHeight,
    lead: (leadMinutes * hourHeight) / 60,
  };
}

/** px from the grid top to an instant. */
export function timeToPx(time: number, geometry: TimelineGeometry): number {
  return ((time - geometry.rangeStart) / HOUR) * geometry.hourHeight;
}

/** Scroll position of a shift's start: its grid position plus the grid's top padding. */
export function shiftAnchor(shift: ShiftWindow, geometry: TimelineGeometry): number {
  return timeToPx(shift.start, geometry) + GRID_PAD_TOP;
}

/** One mark per real elapsed hour from the range start, both ends included (37 for 36 h). */
export function hourMarks(geometry: TimelineGeometry): readonly number[] {
  const marks: number[] = [];
  for (let time = geometry.rangeStart; time <= geometry.rangeEnd; time += HOUR) marks.push(time);
  return marks;
}

/** Every shift boundary strictly inside the range, by timestamp (B-07: not by hour of day). */
export function boundaryTimes(shifts: readonly ShiftWindow[]): readonly number[] {
  return shifts.slice(1).map((shift) => shift.start);
}

/** Indexes of the hour rows whose start lies outside the current window (the off-shift bands). */
export function offShiftRows(geometry: TimelineGeometry, current: ShiftWindow): readonly number[] {
  const rows: number[] = [];
  const count = Math.round((geometry.rangeEnd - geometry.rangeStart) / HOUR);
  for (let row = 0; row < count; row++) {
    const start = geometry.rangeStart + row * HOUR;
    if (start < current.start || start >= current.end) rows.push(row);
  }
  return rows;
}

/** Index of the active shift: the one whose [anchor − lead, next anchor − lead) contains scrollTop. */
export function timelineActiveIndex(
  scrollTop: number,
  shifts: readonly ShiftWindow[],
  geometry: TimelineGeometry,
): number {
  let active = 0;
  shifts.forEach((shift, index) => {
    if (scrollTop >= shiftAnchor(shift, geometry) - geometry.lead) active = index;
  });
  return active;
}

/** At the start of a shift: `scrollTop ≤ 0` for the first shift, otherwise `≤ anchor − lead + 2`. */
export function timelineAtStart(
  index: number,
  scrollTop: number,
  shifts: readonly ShiftWindow[],
  geometry: TimelineGeometry,
): boolean {
  const shift = shifts[index];
  if (!shift) return false;
  return index === 0 ? scrollTop <= 0 : scrollTop <= shiftAnchor(shift, geometry) - geometry.lead + 2;
}

/** Header-expanded rule of the timeline: expanded until the current shift's landing line is passed. */
export function timelineHeaderExpanded(scrollTop: number, current: ShiftWindow, geometry: TimelineGeometry): boolean {
  return scrollTop <= shiftAnchor(current, geometry) - geometry.lead + 2;
}

/** Scroll target of a navigation to `shift`. */
export function timelineNavTarget(shift: ShiftWindow, geometry: TimelineGeometry): number {
  return shiftAnchor(shift, geometry) - geometry.lead;
}

export interface TimelineLandingInput {
  current: ShiftWindow;
  geometry: TimelineGeometry;
  /** The selected date-time, epoch ms. */
  date: number;
  clientHeight: number;
  /** nearBottomGutterMinutes in px. */
  nearBottomGutter: number;
}

/** Scroll target of a landing (Feature Dossier 05 F-10), or `null` for 'none'. */
export function timelineLandingTarget(target: LandingTarget, input: TimelineLandingInput): number | null {
  const { current, geometry, date, clientHeight, nearBottomGutter } = input;
  const anchor = shiftAnchor(current, geometry);
  const pxPerMs = geometry.hourHeight / HOUR;
  switch (target) {
    case 'none':
      return null;
    case 'shiftStart':
      return anchor - geometry.lead;
    case 'date':
      return anchor + (date - current.start) * pxPerMs - geometry.lead;
    case 'dateNearBottom': {
      const within = Math.min(Math.max(date - current.start, 0), current.end - current.start - 1);
      return anchor + within * pxPerMs - (clientHeight - nearBottomGutter);
    }
  }
}
