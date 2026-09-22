// SPDX-License-Identifier: MIT
// The timeline grid (Feature Dossier 01 §T.3, 05 F-05): hour labels per real elapsed hour, off-shift
// bands, hour lines with boundaries at every shift boundary by timestamp (B-07), the now line, the
// card lane and the "+more" chips.
import { memo, type MouseEvent, type ReactElement } from 'react';
import { interpolate } from '../../core/localization';
import { isPinnable } from '../../core/pinning';
import { boundaryTimes, hourMarks, offShiftRows, timeToPx } from '../../core/timeline';
import type { OverflowGroup, SchedulerItem } from '../../core/types';
import { useCardEnv, useSchedulerContext, useViewContext } from '../context';
import { renderPart } from '../parts';
import { TimelineCard } from './card';

const HOUR_LABEL_OFFSET = 6;

export const MoreChip = memo(function MoreChip<TItem extends SchedulerItem>({
  group,
  top,
}: {
  group: OverflowGroup<TItem>;
  top: number;
}): ReactElement {
  const env = useCardEnv<TItem>();
  const { props } = useSchedulerContext<TItem>();
  const pinnable = env.pinning
    ? group.items.filter((item) => isPinnable(item, env.levels.get(item.level))).map((item) => item.id)
    : [];
  const time = env.formatters.clockTime(new Date(group.anchor));
  return renderPart(env.custom, 'moreChip', 'button', {
    type: 'button',
    ref: pinnable.length > 0 ? env.runtime.sentinelRef(`more:${group.id}`, pinnable) : undefined,
    style: { top },
    'aria-label': interpolate(
      env.localization.more.ariaLabel,
      { count: group.items.length, time },
      env.localization.locale,
    ),
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      env.focus.remember('overflow', event.currentTarget);
      env.controller.activateMore(group, event);
    },
    children: (
      <span className="rs-more-chip__label">
        {props.renderMoreLabel ? props.renderMoreLabel(group) : env.localization.more.label}
      </span>
    ),
  });
}) as <TItem extends SchedulerItem>(props: { group: OverflowGroup<TItem>; top: number }) => ReactElement;

/** Consecutive off-shift rows merged into bands. */
function bandRuns(rows: readonly number[]): { start: number; count: number }[] {
  const runs: { start: number; count: number }[] = [];
  for (const row of rows) {
    const last = runs[runs.length - 1];
    if (last && last.start + last.count === row) last.count++;
    else runs.push({ start: row, count: 1 });
  }
  return runs;
}

export function TimeGrid(): ReactElement | null {
  const { model, controller } = useSchedulerContext();
  const { custom } = useViewContext();
  const layout = controller.getLayout();
  const current = model.current;
  if (!layout || !current) return null;
  const { geometry, timeline, formatters, localization } = model;
  const hour = timeline.hourHeight;
  const marks = hourMarks(geometry);
  const boundaries = new Set(boundaryTimes(model.shifts));
  const rowCount = Math.max(1, marks.length - 1);
  const nowTop = model.nowVisible ? timeToPx(model.now, geometry) : null;
  const nowText = formatters.clockTime(new Date(model.now));
  const height = layout.height;

  const gutter = renderPart(custom, 'timeGutter', 'div', {
    'aria-hidden': true,
    style: { height },
    children: (
      <>
        {marks.map((time) =>
          renderPart(custom, 'hourLabel', 'span', {
            key: time,
            'data-rs-boundary': time === current.start || time === current.end ? '' : undefined,
            style: { top: timeToPx(time, geometry) - HOUR_LABEL_OFFSET },
            children: formatters.hourLabel(new Date(time)),
          }),
        )}
        {/* The gutter sits beside the grid box's 1 px top border: +1 centres the label on the line (source value). */}
        {nowTop === null
          ? null
          : renderPart(custom, 'nowLabel', 'span', { style: { top: nowTop + 1 }, children: nowText })}
      </>
    ),
  });

  const bands = model.flags.enableOffShiftBands
    ? bandRuns(offShiftRows(geometry, current)).map((run) =>
        renderPart(custom, 'offShiftBand', 'div', {
          key: run.start,
          'aria-hidden': true,
          'data-rs-first': run.start === 0 ? '' : undefined,
          'data-rs-last': run.start + run.count === rowCount ? '' : undefined,
          style: { top: run.start * hour, height: run.count * hour },
        }),
      )
    : null;

  const box = renderPart(custom, 'gridBox', 'div', {
    style: { height },
    children: (
      <>
        {bands ? (
          <div className="rs-grid-bands" aria-hidden="true">
            {bands}
          </div>
        ) : null}
        {/* The first and last lines are transparent in the source: they are not drawn. */}
        {marks.slice(1, -1).map((time) =>
          renderPart(custom, 'hourLine', 'div', {
            key: time,
            'aria-hidden': true,
            'data-rs-boundary': boundaries.has(time) ? '' : undefined,
            style: { top: timeToPx(time, geometry) },
          }),
        )}
        {nowTop === null
          ? null
          : renderPart(custom, 'nowLine', 'div', {
              role: 'separator',
              'aria-label': interpolate(localization.now.label, { time: nowText }, localization.locale),
              style: { top: nowTop },
            })}
        {renderPart(custom, 'laneStartPad', 'div', {})}
        {renderPart(custom, 'lane', 'ul', {
          role: 'list',
          children: layout.cards.map((placed) => (
            <TimelineCard key={placed.item.id} placed={placed} gap={timeline.cardGap} />
          )),
        })}
        {renderPart(custom, 'laneEndPad', 'div', {
          children: layout.overflow
            .filter((group) => group.anchor >= layout.rangeStart && group.anchor <= layout.rangeEnd)
            .map((group) => <MoreChip key={group.id} group={group} top={timeToPx(group.anchor, geometry)} />),
        })}
      </>
    ),
  });

  return renderPart(custom, 'timeGrid', 'div', {
    children: (
      <>
        {gutter}
        {box}
      </>
    ),
  });
}
