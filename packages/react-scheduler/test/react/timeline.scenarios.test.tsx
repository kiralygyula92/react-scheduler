// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { type ReactElement, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Scheduler, type SchedulerProps, TimelineView } from '../../src/index';
import type { SchedulerItem } from '../../src/core/types';
import { fixture, type ParityItem } from '../parity/adapter';
import { injectTimelineLayout } from '../support/layout';
import {
  advance,
  frames,
  part,
  parts,
  renderUi,
  scrollCalls,
  scrollTo,
  settle,
  setupComponentEnvironment,
} from '../support/react';

// The timeline-view DOM scenarios (TL-*) of the characterization suite, rendered through the
// components with injected layout (Feature Dossier 07 §3).
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const base = { items: baseline.items, date: baseline.date, now: baseline.now };

async function flushLazy(): Promise<void> {
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

function nav(container: ParentNode, position: 'top' | 'bottom'): HTMLElement {
  return parts(container, 'navButton').find((button) => button.dataset['rsPosition'] === position) as HTMLElement;
}

function description(element: HTMLElement): string {
  return document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent ?? '';
}

/** A consumer storing the header value, as the source's consumer did (07 §3: compare values only). */
function HeaderOwner(props: SchedulerProps<ParityItem> & { record: (value: boolean) => void }): ReactElement {
  const { record, ...rest } = props;
  const [expanded, setExpanded] = useState(true);
  return (
    <Scheduler
      {...rest}
      headerExpanded={expanded}
      onHeaderExpandedChange={(value) => {
        record(value);
        setExpanded(value);
      }}
    />
  );
}

/** Renders a landed timeline over an injected 36 h grid. */
function landed(
  props: Partial<SchedulerProps<ParityItem>> = {},
  clientHeight = 800,
): { container: HTMLElement; scroller: HTMLElement } {
  const { container } = renderUi(<TimelineView {...base} {...props} />);
  const scroller = injectTimelineLayout(container, clientHeight);
  settle();
  return { container, scroller };
}

describe('timeline scenarios', () => {
  it('[TL-01] loading shows the progress indicator and nothing else', () => {
    const { container } = renderUi(<TimelineView {...base} loading />);
    const root = part(container, 'root');
    expect([...root.children].map((child) => child.getAttribute('data-rs-part'))).toEqual(['loadingState']);
    expect(screen.getByRole('progressbar', { name: 'Loading…' })).toBeDefined();
  });

  it('[TL-02] 37 hour labels over 36 hours from the previous shift start', () => {
    const { container } = landed();
    const labels = parts(container, 'hourLabel');
    expect(labels).toHaveLength(37);
    expect([0, 12, 24, 36].map((index) => labels[index]?.textContent)).toEqual(['8PM', '8AM', '8PM', '8AM']);
    expect(
      labels.filter((label) => label.dataset['rsBoundary'] !== undefined).map((label) => label.textContent),
    ).toEqual(['8AM', '8PM']);
  });

  it('[TL-03] a timeline card is a native button named by its title, holding phrasing content (fixed: B-18)', () => {
    const { container } = landed();
    const button = screen.getByRole('button', { name: 'Delivery delay' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.querySelectorAll('div, p, ul, li')).toHaveLength(0);
    expect(description(button)).toBe('Watch, 9:00 AM – 10:30 AM');
    const card = button.closest('[data-rs-part="timelineCard"]') as HTMLElement;
    expect(part(card, 'cardTitle').textContent).toBe('Delivery delay');
    expect(part(card, 'cardDescription').textContent).toBe('Short description for delivery delay.');
    expect(part(card, 'cardTimeLabel').textContent).toBe('9:00 AM – 10:30 AM');
    expect(part(card, 'levelPill').textContent).toBe('Watch');
    expect(part(card, 'referencePill').textContent).toBe('Ref: 1042');
    expect(part(card, 'cardSuggestion').textContent).toBe('Suggested next step.');
    const pinnedLevel = parts(container, 'timelineCard').filter(
      (candidate) => candidate.dataset['rsLevel'] === 'critical',
    );
    expect(pinnedLevel.every((candidate) => part(candidate, 'pinSentinel').dataset['rsEdge'] === 'bottom')).toBe(true);
  });

  it('[TL-04] the now indicator shows only for today, inside the current shift', () => {
    const { container } = landed({ now: '2031-03-12T10:41:00' });
    expect(part(container, 'nowLabel').textContent).toBe('10:41 AM');
    expect(screen.getByRole('separator', { name: 'Now: 10:41 AM' })).toBe(part(container, 'nowLine'));
    act(() => {
      container.remove();
    });

    const past = fixture('past-date');
    const pastView = renderUi(<TimelineView items={past.items} date={past.date} now={past.now} />);
    expect(parts(pastView.container, 'nowLine')).toHaveLength(0);

    const outside = renderUi(<TimelineView {...base} now="2031-03-12T21:05:00" />);
    expect(parts(outside.container, 'nowLine')).toHaveLength(0);
  });

  it('[TL-05] the pinned strip exists and is empty; the count follows the earlier shifts (fixed: B-06)', () => {
    const { container } = landed();
    const strip = part(container, 'pinnedStrip');
    expect(strip.dataset['rsEmpty']).toBe('');
    expect(parts(strip, 'pinnedChip')).toHaveLength(0);
    // The source counted currently pinned items only (0 here); the count is now the pinnable items of
    // earlier shifts, shown while the top button targets one.
    expect(nav(container, 'top').textContent).toBe('View previous shift(2 inherited)');
  });

  it('[TL-06] "+more" opens the overflow dialog; the table sorts; a row opens the detail view', async () => {
    const { container } = landed();
    const chip = screen.getByRole('button', { name: '2 more items from 9:00 AM' });
    expect(chip.tagName).toBe('BUTTON');
    expect(chip.textContent).toBe('More');
    expect(part(container, 'laneEndPad').contains(chip)).toBe(true);
    fireEvent.click(chip);
    await flushLazy();
    const dialog = screen.getByRole('dialog', { name: 'More overlapping items (2)' });
    const titles = (): string[] =>
      within(dialog)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.querySelector('.rs-overflow-table__title')?.textContent ?? '');
    expect(titles()).toEqual(['Inventory count', 'Equipment check']);
    const titleHeader = within(dialog).getByRole('button', { name: 'Title' });
    fireEvent.click(titleHeader);
    expect(titles()).toEqual(['Equipment check', 'Inventory count']);
    expect(titleHeader.closest('th')?.getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Title' }));
    expect(titles()).toEqual(['Inventory count', 'Equipment check']);
    const action = within(dialog).getAllByRole('button', { name: 'View details' })[0] as HTMLElement;
    action.focus();
    fireEvent.click(action);
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'Inventory count' })).toBeDefined();
    // The overflow dialog stays open underneath.
    expect(screen.getByRole('dialog', { name: 'More overlapping items (2)' })).toBeDefined();
  });

  it('[TL-07] overflow pagination: 13 items, 10 per page; Close dismisses the dialog', async () => {
    const items: SchedulerItem[] = Array.from({ length: 16 }, (_, index) => ({
      id: `k${String(index).padStart(2, '0')}`,
      level: 'routine',
      title: `Item ${index}`,
      start: '2031-03-12T09:00:00',
      end: '2031-03-12T10:30:00',
    }));
    renderUi(<TimelineView items={items} date={baseline.date} now={baseline.now} />);
    fireEvent.click(screen.getByRole('button', { name: /more items from/ }));
    await flushLazy();
    const dialog = screen.getByRole('dialog', { name: 'More overlapping items (13)' });
    expect(within(dialog).getAllByRole('row')).toHaveLength(11);
    const pager = within(dialog).getByRole('navigation', { name: 'Pagination' });
    fireEvent.click(within(pager).getByRole('button', { name: 'Page 2' }));
    expect(within(dialog).getAllByRole('row')).toHaveLength(4);
    // The icon button and the text button are both named Close; the text button is the last.
    const closeButtons = within(dialog).getAllByRole('button', { name: 'Close' });
    expect(closeButtons).toHaveLength(2);
    fireEvent.click(closeButtons[1] as HTMLElement);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('[TL-08] the first landing is the current shift start minus the lead, for everyone (fixed: B-09)', () => {
    const { scroller } = landed({}, 900);
    expect(scroller.scrollTop).toBe(1986);
  });

  it('[TL-09] a date change lands the selected time near the bottom', () => {
    const { container, rerender } = renderUi(<TimelineView {...base} />);
    const scroller = injectTimelineLayout(container, 800);
    settle();
    act(() => rerender(<TimelineView {...base} date="2031-03-12T14:00:00" />));
    settle();
    expect(scroller.scrollTop).toBe(2072 + 6 * 172 - (800 - 86));
  });

  it('[TL-10] after a list → timeline switch: one header value, near-bottom landing, realigned 280 ms later (fixed: B-04)', () => {
    const record = vi.fn();
    const { container, rerender } = renderUi(<HeaderOwner {...base} view="list" record={record} />);
    settle();
    record.mockClear();
    act(() => rerender(<HeaderOwner {...base} view="timeline" record={record} />));
    const scroller = injectTimelineLayout(container, 800);
    // Step frame by frame to the landing, which happens one frame after the switch.
    for (let frame = 0; frame < 5 && scroller.scrollTop === 0; frame++) frames(1);
    expect(scroller.scrollTop).toBe(2072 + 2.5 * 172 - (800 - 86));
    const landedAt = Date.now();
    // The instant path re-applies and corrects over the next two frames.
    frames(2);
    act(() => {
      scroller.scrollTop = 0;
    });
    advance(280 - (Date.now() - landedAt) - 1);
    expect(scroller.scrollTop).toBe(0);
    advance(1);
    expect(scroller.scrollTop).toBe(1788);
    settle();
    // The source emitted false, then true (flicker); the value is now computed once: expanded at 1788.
    expect(record.mock.calls.filter(([value]) => value === false)).toHaveLength(0);
  });

  it('[TL-11] scroll thresholds: labels, disabled edges and the header signal (fixed: B-26)', () => {
    const record = vi.fn();
    const { container } = renderUi(<HeaderOwner {...base} view="timeline" record={record} />);
    const scroller = injectTimelineLayout(container, 800);
    settle();
    scrollTo(scroller, 1985);
    expect(nav(container, 'top').textContent).toBe('View previous shift(2 inherited)');
    const bottom = screen.getByRole('button', { name: 'View current shift' });
    expect(description(bottom)).toBe('Scroll to current shift start');
    scrollTo(scroller, 1989);
    expect(record).toHaveBeenLastCalledWith(false);
    scrollTo(scroller, 1988);
    expect(record).toHaveBeenLastCalledWith(true);
    expect(nav(container, 'bottom').textContent).toBe('View next shift');

    scrollTo(scroller, 4050);
    expect(nav(container, 'top').textContent).toBe('View current shift');
    const disabledBottom = nav(container, 'bottom');
    expect(disabledBottom.getAttribute('aria-disabled')).toBe('true');
    expect(disabledBottom.textContent).toBe('Next shiftMar 12, 8 PM - Mar 13, 8 AM');
    expect(description(disabledBottom)).toBe('No next shift available.');

    scrollTo(scroller, 0);
    const disabledTop = nav(container, 'top');
    expect(disabledTop.getAttribute('aria-disabled')).toBe('true');
    expect(disabledTop.textContent).toBe('Previous shiftMar 11, 8 PM - Mar 12, 8 AM');
    expect(description(disabledTop)).toBe('No previous shift available.');
  });

  it('[TL-12] the top button follows the scroll position, not the header state (fixed: B-22)', () => {
    const { container, scroller } = landed({ headerExpanded: false });
    scrollTo(scroller, 2500);
    const top = nav(container, 'top');
    expect(top.textContent).toBe('View current shift');
    expect(description(top)).toBe('Scroll to current shift start');
  });

  it('[TL-13] navigation targets; instant under reduced motion (fixed: B-22)', () => {
    const { container, scroller } = landed();
    scrollTo(scroller, 2500);
    scrollCalls.length = 0;
    fireEvent.click(nav(container, 'top'));
    expect(scrollCalls[0]).toEqual({ top: 1986, behavior: 'smooth' });
    settle();
    scrollTo(scroller, 2500);
    scrollCalls.length = 0;
    fireEvent.click(nav(container, 'bottom'));
    expect(scrollCalls[0]).toEqual({ top: 4050, behavior: 'smooth' });
    settle();
    scrollTo(scroller, 1000);
    scrollCalls.length = 0;
    fireEvent.click(nav(container, 'bottom'));
    expect(scrollCalls[0]).toEqual({ top: 1986, behavior: 'smooth' });
    settle();

    const reduced = landed({ reducedMotion: true });
    scrollTo(reduced.scroller, 1000);
    scrollCalls.length = 0;
    fireEvent.click(nav(reduced.container, 'bottom'));
    expect(scrollCalls.filter((call) => call.behavior === 'smooth')).toHaveLength(0);
    expect(reduced.scroller.scrollTop).toBe(1986);
  });

  it('[TL-14] activating a timeline card opens its detail view', async () => {
    const onItemOpen = vi.fn();
    landed({ onItemOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Safety inspection' }));
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'Safety inspection' })).toBeDefined();
    expect(onItemOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'c06' }), { source: 'timelineCard' });
  });
});
