// SPDX-License-Identifier: MIT
// Parts that live in lazy chunks (Feature Dossier 05 F-30): exported as React.lazy components, so
// importing the main entry never pulls the dialogs in. Render them inside <Suspense>.
import { type ComponentType, lazy, type ReactElement } from 'react';
import type { OverflowGroup, SchedulerItem } from '../core/types';
import type { OverflowColumn } from './types';

/**
 * The dialog that lists the items behind a "+more" chip.
 *
 * @category Components
 * @since 1.0.0
 */
export const OverflowDialog = lazy(() =>
  import('./components/overflow-dialog').then((module) => ({ default: module.OverflowDialog })),
) as unknown as <TItem extends SchedulerItem>(props: { group: OverflowGroup<TItem> }) => ReactElement;

/**
 * The table inside the overflow dialog.
 *
 * @category Components
 * @since 1.0.0
 */
export const OverflowTable = lazy(() =>
  import('./components/overflow-dialog').then((module) => ({ default: module.OverflowTable })),
) as unknown as <TItem extends SchedulerItem>(props: {
  items: readonly TItem[];
  columns: readonly OverflowColumn<TItem>[];
}) => ReactElement;

/**
 * The pager under the overflow table.
 *
 * @category Components
 * @since 1.0.0
 */
export const Pagination: ComponentType<{ page: number; pages: number }> = lazy(() =>
  import('./components/overflow-dialog').then((module) => ({ default: module.Pagination })),
);

/**
 * The detail view an item opens into, as the library renders it.
 *
 * @category Components
 * @since 1.0.0
 */
export const DefaultItemDetail = lazy(() =>
  import('./components/detail-dialog').then((module) => ({ default: module.DefaultItemDetail })),
) as unknown as <TItem extends SchedulerItem>(props: { item: TItem }) => ReactElement;
