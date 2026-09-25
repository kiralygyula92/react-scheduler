// SPDX-License-Identifier: MIT
// List view scroll rules (Feature Dossier 01 §L.5–§L.9, 05 F-04, F-08, F-09, F-10) as functions of
// measured offsets, so they run and test without a DOM.
import type { ResolvedListOptions } from './options';
import type { LandingTarget } from './types';

export interface ListSectionMetrics {
  /** offsetTop of the section in the scroller content. */
  top: number;
  /** Height of the section header. */
  headerHeight: number;
}

export interface ListCardMetrics {
  top: number;
  height: number;
  /** Item start, epoch ms. */
  start: number;
}

export interface ListMetrics {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  /** offsetHeight of the sticky top. */
  stickyHeight: number;
  /** Rendered sections in shift order. */
  sections: readonly ListSectionMetrics[];
}

const visibleTopOf = (metrics: ListMetrics): number => metrics.scrollTop + metrics.stickyHeight;
const maxScrollOf = (metrics: ListMetrics): number => Math.max(0, metrics.scrollHeight - metrics.clientHeight);

/**
 * Index of the active section: the last section whose top − epsilon ≤ the visible top (the first
 * section when none qualifies); at the end of the scroll range, the last section.
 */
export function listActiveIndex(metrics: ListMetrics, epsilon: number): number {
  const last = metrics.sections.length - 1;
  if (last < 0) return -1;
  if (metrics.scrollTop >= maxScrollOf(metrics) - epsilon) return last;
  const visibleTop = visibleTopOf(metrics);
  let active = 0;
  metrics.sections.forEach((section, index) => {
    if (section.top - epsilon <= visibleTop) active = index;
  });
  return active;
}

/**
 * At the start of a section: its top has reached the visible top. The first section is at its start
 * while the list is no further down than a jump to it lands (`firstLanding`), within `epsilon`. With
 * the source's three shifts that landing is the top of the list, so the rule is `scrollTop ≤ epsilon`
 * exactly; with the current shift first it is 16 px down, where `scrollTop ≤ epsilon` alone never
 * held and the top button offered the same jump again (DQ-11).
 */
export function listAtStart(index: number, metrics: ListMetrics, epsilon: number, firstLanding = 0): boolean {
  const section = metrics.sections[index];
  if (!section) return false;
  return index === 0 ? metrics.scrollTop <= Math.max(0, firstLanding) + epsilon : visibleTopOf(metrics) <= section.top;
}

/** The section after `index` (list-only bottom rule) is visible below the fold. */
export function listSectionVisible(index: number, metrics: ListMetrics, epsilon: number): boolean {
  const section = metrics.sections[index];
  return section !== undefined && metrics.scrollTop + metrics.clientHeight > section.top + epsilon;
}

export interface ListHeaderInput {
  metrics: ListMetrics;
  /** Index of the current section (offset 0). */
  currentIndex: number;
  activeIndex: number;
  currentItemCount: number;
  /** Cards of the current section, in order. Only cards: pin sentinels never count (B-08). */
  currentCards: readonly Pick<ListCardMetrics, 'top' | 'height'>[];
  options: Pick<ResolvedListOptions, 'segmentEpsilon' | 'collapseMinItems' | 'collapseAfterCards' | 'collapseMargin'>;
}

/**
 * Header-expanded rule of the list (01 §L.8 with the B-08 fix). Expanded unless the current shift has
 * more than `collapseMinItems` items and the view has scrolled past both the current header (with a
 * `collapseMargin` allowance) and the `collapseAfterCards`-th card of the current shift.
 */
export function listHeaderExpanded(input: ListHeaderInput): boolean {
  const { metrics, currentIndex, activeIndex, currentItemCount, currentCards, options } = input;
  const current = metrics.sections[currentIndex];
  if (!current || currentItemCount <= options.collapseMinItems) return true;
  const epsilon = options.segmentEpsilon;
  const visibleTop = visibleTopOf(metrics);
  const visibleBottom = metrics.scrollTop + metrics.clientHeight;
  const previous = metrics.sections[currentIndex - 1];
  const next = metrics.sections[currentIndex + 1];

  const allVisible =
    previous !== undefined &&
    next !== undefined &&
    visibleTop < current.top - epsilon &&
    visibleBottom >= next.top - epsilon;
  const headerBottom = current.top + current.headerHeight;
  const dividerSeen = headerBottom + options.collapseMargin >= visibleTop && current.top <= visibleBottom;
  const card = currentCards[options.collapseAfterCards - 1];
  const threshold = card ? card.top + card.height : headerBottom + options.collapseMargin;

  return (
    allVisible ||
    activeIndex < currentIndex ||
    visibleTop <= current.top ||
    dividerSeen ||
    metrics.scrollTop <= threshold + epsilon
  );
}

/** Scroll target of a section: its top below the sticky top and `alignOffset`, plus `extra` when jumping earlier. */
export function listSectionTarget(sectionTop: number, stickyHeight: number, alignOffset: number, extra = 0): number {
  return sectionTop - stickyHeight - alignOffset - extra;
}

/**
 * Scroll target of a landing (05 F-10) in the current section, or `null` for 'none'. 'date' and
 * 'dateNearBottom' land on the first card starting at or after `date` (else the section top).
 */
export function listLandingTarget(
  target: LandingTarget,
  input: {
    current: ListSectionMetrics;
    cards: readonly ListCardMetrics[];
    date: number;
    stickyHeight: number;
    alignOffset: number;
  },
): number | null {
  if (target === 'none') return null;
  const card = target === 'shiftStart' ? undefined : input.cards.find((candidate) => candidate.start >= input.date);
  return listSectionTarget(card ? card.top : input.current.top, input.stickyHeight, input.alignOffset);
}

/** The compact scroll-to-top button shows once the list has scrolled past the threshold. */
export function scrollTopButtonVisible(scrollTop: number, threshold: number): boolean {
  return scrollTop > threshold;
}
