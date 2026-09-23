// SPDX-License-Identifier: MIT
// List view content (Feature Dossier 01 §L, 05 F-04): shift sections labeled by their headers, card
// lists, per-shift and global empty states, and the now marker in the current section (B-01).
import { Fragment, type ReactElement, type ReactNode, useMemo } from 'react';
import { shiftTitle } from '../../core/navigation';
import { nowMarkerIndex } from '../../core/now';
import type { SchedulerItem, ShiftSegment } from '../../core/types';
import { useSchedulerContext, useViewContext } from '../context';
import { renderPart } from '../parts';
import { ListCard } from './card';
import { EmptyState, NowIndicator } from './states';

const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const;

/**
 * The header row of one shift in the list view.
 *
 * @category Components
 * @since 1.0.0
 */
export function ShiftHeader<TItem extends SchedulerItem>({
  segment,
  id,
}: {
  /** The shift the header belongs to, with its items. */
  segment: ShiftSegment<TItem>;
  /** The id the section is labelled by. */
  id: string;
}): ReactElement {
  const { model, props } = useSchedulerContext<TItem>();
  const { runtime, custom } = useViewContext<TItem>();
  const { shift } = segment;
  const title = shiftTitle(shift.offset, model.localization);
  const range = model.formatters.shiftRange(new Date(shift.start), new Date(shift.end));
  const heading = HEADINGS[props.headingLevel ?? 3];
  const content: ReactNode = props.renderShiftHeader ? (
    props.renderShiftHeader(segment, { defaultTitle: title, rangeLabel: range })
  ) : (
    <>
      {renderPart(custom, 'shiftHeaderTitle', heading, { children: title }, { shift })}
      {renderPart(custom, 'shiftHeaderRange', 'span', { children: range }, { shift })}
    </>
  );
  return renderPart(
    custom,
    'shiftHeader',
    'div',
    { id, ref: runtime.headerRef(shift.offset), children: content },
    { shift },
  );
}

function ShiftSection<TItem extends SchedulerItem>({ segment }: { segment: ShiftSegment<TItem> }): ReactElement {
  const { model, baseId } = useSchedulerContext<TItem>();
  const { runtime, custom, kind } = useViewContext<TItem>();
  const { shift, items } = segment;
  const headerId = `${baseId}-${kind}-shift-${shift.offset}`;
  const markerAt = shift.offset === 0 && model.nowVisible ? nowMarkerIndex(items, model.now) : -1;
  // The same element while the items and the marker position are unchanged: a clock tick re-renders
  // the section but skips its cards (09 §3).
  const cards = useMemo(
    () => (
      <>
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {index === markerAt ? (
              <li className="rs-now-marker-item">
                <NowIndicator />
              </li>
            ) : null}
            <ListCard item={item} />
          </Fragment>
        ))}
        {markerAt === items.length ? (
          <li className="rs-now-marker-item">
            <NowIndicator />
          </li>
        ) : null}
      </>
    ),
    [items, markerAt],
  );
  const list =
    items.length === 0 ? (
      <EmptyState scope="shift" segment={segment} />
    ) : (
      renderPart(custom, 'itemList', 'ul', { role: 'list', children: cards }, { shift })
    );
  return renderPart(
    custom,
    'shiftSection',
    'section',
    {
      ref: runtime.sectionRef(shift.offset),
      'aria-labelledby': headerId,
      'data-rs-offset': shift.offset,
      children: (
        <>
          <ShiftHeader segment={segment} id={headerId} />
          {list}
        </>
      ),
    },
    { shift, active: shift.offset === 0 },
  );
}

/** The list body: the sections, or the global empty text when no shift has items (01 §L.2). */
export function ListBody(): ReactElement {
  const { model } = useSchedulerContext();
  const { custom } = useViewContext();
  return renderPart(custom, 'body', 'div', {
    children: model.hasItems ? (
      model.segments.map((segment) => <ShiftSection key={segment.shift.offset} segment={segment} />)
    ) : (
      <EmptyState scope="all" />
    ),
  });
}
