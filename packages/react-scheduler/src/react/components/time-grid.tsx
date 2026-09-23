// SPDX-License-Identifier: MIT
// The timeline grid (Feature Dossier 01 §T.3, 05 F-05): hour labels per real elapsed hour, off-shift
// bands, hour lines with boundaries at every shift boundary by timestamp (B-07), the now line, the
// card lane and the "+more" chips.
import { memo, type MouseEvent, type ReactElement } from 'react';
import { interpolate } from '../../core/localization';
import { isPinnable } from '../../core/pinning';
import type { SchedulerFormatters } from '../../core/format';
import { boundaryTimes, hourMarks, offShiftRows, type TimelineGeometry, timeToPx } from '../../core/timeline';
import type { OverflowGroup, SchedulerItem, ShiftWindow, TimelineLayout } from '../../core/types';
import { useCardEnv, useSchedulerContext, useViewContext } from '../context';
import { type Customization, renderPart } from '../parts';
import { TimelineCard } from './card';

const HOUR_LABEL_OFFSET = 6;

/**
 * The chip that stands for the items a crowded group could not place.
 *
 * @category Components
 * @since 1.0.0
 */
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

/** The hour labels: static between ticks, so a clock tick does not render them again. */
const HourLabels = memo(function HourLabels({
  custom,
  geometry,
  current,
  formatters,
}: {
  custom: Customization<SchedulerItem>;
  geometry: TimelineGeometry;
  current: ShiftWindow;
  formatters: SchedulerFormatters;
}): ReactElement {
  return (
    <>
      {hourMarks(geometry).map((time) =>
        renderPart(custom, 'hourLabel', 'span', {
          key: time,
          'data-rs-boundary': time === current.start || time === current.end ? '' : undefined,
          style: { top: timeToPx(time, geometry) - HOUR_LABEL_OFFSET },
          children: formatters.hourLabel(new Date(time)),
        }),
      )}
    </>
  );
});

/** Off-shift bands and hour lines: static between ticks. */
const GridLines = memo(function GridLines({
  custom,
  geometry,
  shifts,
  current,
  bands,
  hour,
}: {
  custom: Customization<SchedulerItem>;
  geometry: TimelineGeometry;
  shifts: readonly ShiftWindow[];
  current: ShiftWindow;
  bands: boolean;
  hour: number;
}): ReactElement {
  const marks = hourMarks(geometry);
  const boundaries = new Set(boundaryTimes(shifts));
  const rowCount = Math.max(1, marks.length - 1);
  return (
    <>
      {bands ? (
        <div className="rs-grid-bands" aria-hidden="true">
          {bandRuns(offShiftRows(geometry, current)).map((run) =>
            renderPart(custom, 'offShiftBand', 'div', {
              key: run.start,
              'aria-hidden': true,
              'data-rs-first': run.start === 0 ? '' : undefined,
              'data-rs-last': run.start + run.count === rowCount ? '' : undefined,
              style: { top: run.start * hour, height: run.count * hour },
            }),
          )}
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
    </>
  );
});

/** The card lane and the "+more" chips: they change with the layout, not with the clock. */
const Lane = memo(function Lane({
  custom,
  layout,
  geometry,
  gap,
}: {
  custom: Customization<SchedulerItem>;
  layout: TimelineLayout<SchedulerItem>;
  geometry: TimelineGeometry;
  gap: number;
}): ReactElement {
  return (
    <>
      {renderPart(custom, 'laneStartPad', 'div', {})}
      {renderPart(custom, 'lane', 'ul', {
        role: 'list',
        children: layout.cards.map((placed) => <TimelineCard key={placed.item.id} placed={placed} gap={gap} />),
      })}
      {renderPart(custom, 'laneEndPad', 'div', {
        children: layout.overflow
          .filter((group) => group.anchor >= layout.rangeStart && group.anchor <= layout.rangeEnd)
          .map((group) => <MoreChip key={group.id} group={group} top={timeToPx(group.anchor, geometry)} />),
      })}
    </>
  );
});

/**
 * The timeline’s hour grid, with the placed cards on it.
 *
 * @category Components
 * @since 1.0.0
 */
export function TimeGrid(): ReactElement | null {
  const { model, controller } = useSchedulerContext();
  const { custom } = useViewContext();
  const layout = controller.getLayout();
  const current = model.current;
  if (!layout || !current) return null;
  const { geometry, timeline, formatters, localization } = model;
  const nowTop = model.nowVisible ? timeToPx(model.now, geometry) : null;
  const nowText = formatters.clockTime(new Date(model.now));
  const height = layout.height;

  // Only the now line and its label follow the clock; the other layers are memoized.
  const gutter = renderPart(custom, 'timeGutter', 'div', {
    'aria-hidden': true,
    style: { height },
    children: (
      <>
        <HourLabels custom={custom} geometry={geometry} current={current} formatters={formatters} />
        {/* The gutter sits beside the grid box's 1 px top border: +1 centers the label on the line (source value). */}
        {nowTop === null
          ? null
          : renderPart(custom, 'nowLabel', 'span', { style: { top: nowTop + 1 }, children: nowText })}
      </>
    ),
  });

  const box = renderPart(custom, 'gridBox', 'div', {
    style: { height },
    children: (
      <>
        <GridLines
          custom={custom}
          geometry={geometry}
          shifts={model.shifts}
          current={current}
          bands={model.flags.enableOffShiftBands}
          hour={timeline.hourHeight}
        />
        {nowTop === null
          ? null
          : renderPart(custom, 'nowLine', 'div', {
              role: 'separator',
              'aria-label': interpolate(localization.now.label, { time: nowText }, localization.locale),
              style: { top: nowTop },
            })}
        <Lane custom={custom} layout={layout} geometry={geometry} gap={timeline.cardGap} />
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
