// SPDX-License-Identifier: MIT
// Detail view state (Feature Dossier 05 F-14). The source kept the open flag when its item left the
// data and reopened the dialog by itself when the item returned (B-03).
import type { CloseReason, SchedulerItem } from './types';

export interface OpenItemState<TItem> {
  openItemId: string | null;
  item: TItem | null;
  /** Set when the open item disappeared: the view closes with this reason and the id is cleared. */
  closeReason?: CloseReason;
}

/** Looks up the open item in the current data; a missing item closes the view with reason 'itemRemoved'. */
export function reconcileOpenItem<TItem extends SchedulerItem>(
  openItemId: string | null,
  items: readonly TItem[],
): OpenItemState<TItem> {
  if (openItemId === null) return { openItemId: null, item: null };
  const item = items.find((candidate) => candidate.id === openItemId);
  return item ? { openItemId, item } : { openItemId: null, item: null, closeReason: 'itemRemoved' };
}
