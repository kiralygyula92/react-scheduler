// SPDX-License-Identifier: MIT
// The overflow dialog (Feature Dossier 01 §T.7, 05 F-13), loaded lazily: a native modal <dialog>
// titled with the group size, a sortable table and a pager. Sort and page are controlled or
// uncontrolled through the scheduler; they reset on each open unless controlled.
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react';
import { rankOf } from '../../core/levels';
import { interpolate } from '../../core/localization';
import { overflowSortValues, pageList, sortOverflowItems } from '../../core/overflow';
import type { OverflowGroup, SchedulerItem } from '../../core/types';
import { useCardEnv, useSchedulerContext, useViewContext } from '../context';
import { renderPart } from '../parts';
import type { OverflowColumn } from '../types';
import { CloseIcon, SortArrowIcon } from './icons';
import { useModal } from './modal';
import { defaultOverflowColumns } from './overflow-columns';
import { ELLIPSIS } from './shared';

const DEFAULT_IDS = new Set(['time', 'level', 'title', 'description']);

/** The default columns sort by the scheduler's own levels, not the classic ranks. */
function sortColumns<TItem extends SchedulerItem>(
  columns: readonly OverflowColumn<TItem>[],
  levels: ReadonlyMap<string, { rank: number }>,
): readonly OverflowColumn<TItem>[] {
  const values = overflowSortValues(levels);
  return columns.map((column) =>
    DEFAULT_IDS.has(column.id) && defaultOverflowColumns.includes(column as unknown as OverflowColumn<SchedulerItem>)
      ? { ...column, sortValue: values[column.id as keyof typeof values] }
      : column,
  );
}

/** A column's cell sizing; equal minimum and maximum widths make a fixed column. */
function cellStyle<TItem>(column: OverflowColumn<TItem>): CSSProperties {
  const fixed = column.minWidth !== undefined && column.minWidth === column.maxWidth;
  return {
    width: fixed ? column.minWidth : undefined,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
    textAlign: column.align,
  };
}

export function OverflowTable<TItem extends SchedulerItem>({
  items,
  columns,
}: {
  items: readonly TItem[];
  columns: readonly OverflowColumn<TItem>[];
}): ReactElement {
  const { model, controller } = useSchedulerContext<TItem>();
  const { custom } = useViewContext<TItem>();
  const env = useCardEnv<TItem>();
  const sort = model.overflowSort;
  const header = (column: OverflowColumn<TItem>): ReactNode =>
    typeof column.header === 'function' ? column.header(model.localization) : column.header;
  return renderPart(custom, 'overflowTable', 'table', {
    'aria-label': model.localization.overflow.tableLabel,
    children: (
      <>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort.column === column.id;
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    active && column.sortValue ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  style={cellStyle(column)}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="rs-overflow-table__sort"
                      data-rs-active={active ? '' : undefined}
                      onClick={(event) => controller.sortOverflow(column.id, event)}
                    >
                      {header(column)}
                      {active ? <SortArrowIcon direction={sort.direction} /> : null}
                    </button>
                  ) : (
                    header(column)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {columns.map((column) => (
                <td key={column.id} style={cellStyle(column)}>
                  {column.renderCell(item, {
                    localization: model.localization,
                    openItem: () => {
                      env.focus.remember('item', document.activeElement);
                      controller.activateItem(item, 'overflowRow');
                    },
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </>
    ),
  });
}

export function Pagination({ page, pages }: { page: number; pages: number }): ReactElement {
  const { model, controller } = useSchedulerContext();
  const { custom } = useViewContext();
  const { pagination, locale } = { pagination: model.localization.pagination, locale: model.localization.locale };
  const number = new Intl.NumberFormat(locale);
  const go = (target: number) => (event: MouseEvent<HTMLButtonElement>) => controller.setOverflowPage(target, event);
  const label = (target: number): string => interpolate(pagination.page, { page: target + 1 }, locale);
  return renderPart(custom, 'pagination', 'nav', {
    'aria-label': pagination.label,
    children: (
      <>
        <button type="button" className="rs-pagination__step" disabled={page === 0} onClick={go(page - 1)}>
          {pagination.previous}
        </button>
        {model.compact ? (
          <span aria-current="page">{label(page)}</span>
        ) : (
          <ul className="rs-pagination__pages">
            {pageList(page, pages).map((entry, index) =>
              entry === 'ellipsis' ? (
                <li key={`ellipsis-${index}`} aria-hidden="true">
                  {ELLIPSIS}
                </li>
              ) : (
                <li key={entry}>
                  <button
                    type="button"
                    className="rs-pagination__page"
                    aria-label={label(entry)}
                    aria-current={entry === page ? 'page' : undefined}
                    onClick={go(entry)}
                  >
                    {number.format(entry + 1)}
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
        <button type="button" className="rs-pagination__step" disabled={page >= pages - 1} onClick={go(page + 1)}>
          {pagination.next}
        </button>
      </>
    ),
  });
}

export function OverflowDialog<TItem extends SchedulerItem>({ group }: { group: OverflowGroup<TItem> }): ReactElement {
  const { model, controller, props, baseId } = useSchedulerContext<TItem>();
  const { custom, kind } = useViewContext<TItem>();
  const modal = useModal((reason) => controller.closeOverflow(reason));
  const titleId = `${baseId}-${kind}-overflow-title`;
  const columns = sortColumns(
    props.overflowColumns ?? (defaultOverflowColumns as unknown as readonly OverflowColumn<TItem>[]),
    model.levels,
  );
  // Ties break by rank, then placement order (01 §T.7), or by a consumer's compareItems (F-13).
  const tieBreak =
    props.compareItems ??
    ((a: TItem, b: TItem) => rankOf(model.levels, a.level) - rankOf(model.levels, b.level) || model.compare(a, b));
  const sorted = sortOverflowItems(group.items, model.overflowSort, columns, tieBreak);
  const pages = Math.max(1, Math.ceil(sorted.length / model.overflowPageSize));
  const page = Math.min(Math.max(0, model.overflowPage), pages - 1);
  const rows = sorted.slice(page * model.overflowPageSize, (page + 1) * model.overflowPageSize);
  const { localization } = model;
  return renderPart(
    custom,
    'overflowDialog',
    'dialog',
    {
      ...modal,
      'aria-labelledby': titleId,
      children: (
        <>
          <div className="rs-dialog__title">
            <h2 id={titleId} className="rs-dialog__heading">
              {interpolate(localization.overflow.title, { count: group.items.length }, localization.locale)}
            </h2>
            <button
              type="button"
              className="rs-icon-button"
              aria-label={localization.overflow.closeIcon}
              onClick={() => controller.closeOverflow('closeButton')}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="rs-dialog__content">
            {group.items.length === 0 ? (
              <p>{localization.overflow.empty}</p>
            ) : (
              <>
                <div className="rs-overflow-table__container" data-rs-paginated={pages > 1 ? '' : undefined}>
                  <OverflowTable items={rows} columns={columns} />
                </div>
                {pages > 1 ? <Pagination page={page} pages={pages} /> : null}
              </>
            )}
          </div>
          <div className="rs-dialog__actions">
            <button type="button" className="rs-text-button" onClick={() => controller.closeOverflow('closeButton')}>
              {localization.overflow.close}
            </button>
          </div>
        </>
      ),
    },
    {},
  );
}
