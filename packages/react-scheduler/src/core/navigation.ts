// SPDX-License-Identifier: MIT
// Shift navigation (Feature Dossier 05 F-08). The choice of target depends only on the scroll
// position, never on the consumer's header state (B-22); the carried-over count has one definition
// in both views and shows only when the top button targets an earlier shift (B-06).
import { isPinnable } from './pinning';
import { interpolate, type SchedulerLocalization } from './localization';
import type { LevelDefinition, SchedulerItem, ShiftSegment, ShiftWindow, ViewKind } from './types';

export interface NavState {
  visible: boolean;
  disabled: boolean;
  target: ShiftWindow | null;
  /** Visible label; also the accessible name (B-26). */
  label: string;
  /** Tooltip and accessible description. */
  hint: string;
  /** Top button only. */
  carriedOverCount: number;
}

type LabelKey = 'viewPrevious' | 'viewCurrent' | 'viewNext' | 'viewEarlier' | 'viewLater';
type HintKey = 'toPreviousHint' | 'toCurrentHint' | 'toNextHint' | 'toEarlierHint' | 'toLaterHint';

function keysFor(offset: number): [LabelKey, HintKey] {
  if (offset === 0) return ['viewCurrent', 'toCurrentHint'];
  if (offset === -1) return ['viewPrevious', 'toPreviousHint'];
  if (offset === 1) return ['viewNext', 'toNextHint'];
  return offset < 0 ? ['viewEarlier', 'toEarlierHint'] : ['viewLater', 'toLaterHint'];
}

/** Section header title of a shift: previous / current / next, or "N shifts earlier / later". */
export function shiftTitle(offset: number, localization: SchedulerLocalization): string {
  const titles = localization.shiftHeader;
  if (offset === 0) return titles.current;
  if (offset === -1) return titles.previous;
  if (offset === 1) return titles.next;
  return interpolate(offset < 0 ? titles.earlier : titles.later, { count: Math.abs(offset) }, localization.locale);
}

/** Number of pinnable items in the shifts before the current one (all earlier rendered shifts, Q-06). */
export function carriedOverCount<TItem extends SchedulerItem>(
  segments: readonly ShiftSegment<TItem>[],
  levels: ReadonlyMap<string, LevelDefinition>,
): number {
  let count = 0;
  for (const segment of segments) {
    if (segment.shift.offset >= 0) continue;
    for (const item of segment.items) if (isPinnable(item, levels.get(item.level))) count++;
  }
  return count;
}

export interface NavInput {
  view: ViewKind;
  /** Rendered shifts in offset order. */
  shifts: readonly ShiftWindow[];
  activeIndex: number;
  /** Whether the view sits at the start of the shift at `index` (list/timeline `atStart` rules). */
  atStart: (index: number) => boolean;
  /** List only: the section of the shift with offset +1 is visible below the fold. */
  nextOffsetVisible?: boolean;
  /** List only: some shift has at least `navigationThreshold` items. The timeline always navigates. */
  navigationAllowed: boolean;
  /** 0 when the count is disabled. */
  carriedOverCount: number;
  localization: SchedulerLocalization;
}

const hidden: NavState = { visible: false, disabled: false, target: null, label: '', hint: '', carriedOverCount: 0 };

function toTarget(input: NavInput, target: ShiftWindow | undefined, withCount: boolean): NavState {
  if (!target) return hidden;
  const [labelKey, hintKey] = keysFor(target.offset);
  return {
    visible: input.view === 'timeline' || input.navigationAllowed,
    disabled: false,
    target,
    label: input.localization.nav[labelKey],
    hint: input.localization.nav[hintKey],
    carriedOverCount: withCount && target.offset < 0 ? input.carriedOverCount : 0,
  };
}

/** At the edge: the list hides the button; the timeline disables it and shows that shift's title. */
function atEdge(input: NavInput, shift: ShiftWindow | undefined, hint: string): NavState {
  if (input.view === 'list' || !shift) return hidden;
  return {
    visible: true,
    disabled: true,
    target: null,
    label: shiftTitle(shift.offset, input.localization),
    hint,
    carriedOverCount: 0,
  };
}

export function topNavState(input: NavInput): NavState {
  const { shifts, activeIndex: index } = input;
  const active = shifts[index];
  if (!active) return hidden;
  const current = shifts.find((shift) => shift.offset === 0);
  const atStart = input.atStart(index);
  if (active.offset > 0 || (active.offset === 0 && !atStart)) return toTarget(input, current, true);
  if (atStart && index === 0) return atEdge(input, active, input.localization.nav.noPrevious);
  if (active.offset < 0 && !atStart) return toTarget(input, active, true);
  return toTarget(input, shifts[index - 1], true);
}

export function bottomNavState(input: NavInput): NavState {
  const { shifts, activeIndex: index } = input;
  const active = shifts[index];
  if (!active) return hidden;
  if (index === shifts.length - 1) return atEdge(input, active, input.localization.nav.noNext);
  if (input.view === 'list' && active.offset < 0 && input.nextOffsetVisible) {
    return toTarget(
      input,
      shifts.find((shift) => shift.offset === 1),
      false,
    );
  }
  return toTarget(input, shifts[index + 1], false);
}
