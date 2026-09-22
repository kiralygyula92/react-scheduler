// SPDX-License-Identifier: MIT
// Default overflow-table columns (Feature Dossier 04 §5.7, 01 §T.7): time, level, title, description
// and actions. The source's domain column is dropped; consumers add their own through
// `overflowColumns`.
import type { ReactElement } from 'react';
import { classicLevels, resolveLevels } from '../../core/levels';
import { overflowSortValues } from '../../core/overflow';
import { toMs } from '../../core/time';
import type { SchedulerItem } from '../../core/types';
import { useCardEnv, useSchedulerContext } from '../context';
import type { OverflowColumn } from '../types';
import { EyeIcon } from './icons';
import { LevelPill } from './pills';
import { safeId } from './shared';
import { Tooltip, useTooltip } from './tooltip';

function TimeCell({ item }: { item: SchedulerItem }): ReactElement {
  const env = useCardEnv();
  const start = toMs(item.start);
  return (
    <span className="rs-overflow-table__text">
      {Number.isNaN(start) ? null : env.formatters.dateTime(new Date(start))}
    </span>
  );
}

function ActionCell({ item, onOpen }: { item: SchedulerItem; onOpen: () => void }): ReactElement {
  const { model, baseId } = useSchedulerContext();
  const env = useCardEnv();
  const id = `${baseId}-${env.kind}-overflow-action-${safeId(item.id)}`;
  const tooltip = useTooltip(id, model.flags.enableTooltips);
  const { 'aria-describedby': _described, ...anchor } = tooltip.anchor;
  return (
    <>
      <button
        {...anchor}
        type="button"
        className="rs-icon-button rs-overflow-table__action"
        aria-label={model.localization.overflow.viewDetails}
        onClick={onOpen}
      >
        <EyeIcon />
      </button>
      <Tooltip id={id} position={tooltip.position}>
        {model.localization.overflow.viewDetails}
      </Tooltip>
    </>
  );
}

// Standalone use sorts levels by the classic ranks; inside a scheduler the dialog substitutes the
// sort values of its own levels (see sortColumns in overflow-dialog.tsx).
const classicSortValues = overflowSortValues(resolveLevels(classicLevels));

export const defaultOverflowColumns: readonly OverflowColumn<SchedulerItem>[] = Object.freeze([
  {
    id: 'time',
    header: (localization) => localization.overflow.column.time,
    minWidth: 200,
    sortValue: classicSortValues.time,
    renderCell: (item) => <TimeCell item={item} />,
  },
  {
    id: 'level',
    header: (localization) => localization.overflow.column.level,
    minWidth: 140,
    sortValue: classicSortValues.level,
    renderCell: (item) => <LevelPill level={item.level} />,
  },
  {
    id: 'title',
    header: (localization) => localization.overflow.column.title,
    minWidth: 200,
    sortValue: classicSortValues.title,
    renderCell: (item) => <span className="rs-overflow-table__title">{item.title}</span>,
  },
  {
    id: 'description',
    header: (localization) => localization.overflow.column.description,
    minWidth: 280,
    maxWidth: 360,
    sortValue: classicSortValues.description,
    renderCell: (item) => <span className="rs-overflow-table__text">{item.description}</span>,
  },
  {
    id: 'actions',
    header: (localization) => localization.overflow.column.actions,
    align: 'center',
    minWidth: 92,
    renderCell: (item, ctx) => <ActionCell item={item} onOpen={ctx.openItem} />,
  },
]);
