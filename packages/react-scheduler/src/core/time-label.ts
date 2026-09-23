// SPDX-License-Identifier: MIT
import type { SchedulerFormatters } from './format';
import type { SchedulerLocalization } from './localization';
import { resolveEnd, toMs } from './time';
import type { SchedulerItem } from './types';

/**
 * The time label of a card (Feature Dossier 01 §2.3, 04 §3.2), first match:
 * `timeLabel` as given; "{observed} {observedLabel}" when `observedLabel` is a non-empty string
 * (the source printed "undefined" for a missing one, B-24); "{since} {timestamp}" for a valid
 * `since`, or the bare prefix for an invalid one; otherwise "{start} – {end}".
 *
 * @param item The item whose time is being written; its own `timeLabel` wins when it has one.
 * @param localization The locale pack, for the words around the time.
 * @param formatters The formatters, for the time itself.
 * @param defaultDuration How long an item without an end lasts, in milliseconds.
 */
export function resolveTimeLabel(
  item: SchedulerItem,
  localization: SchedulerLocalization,
  formatters: SchedulerFormatters,
  defaultDuration: number,
): string {
  if (item.timeLabel !== undefined) return item.timeLabel;
  if (typeof item.observedLabel === 'string' && item.observedLabel.length > 0) {
    return `${localization.timeLabel.observed} ${item.observedLabel}`;
  }
  if (item.since !== undefined) {
    const since = toMs(item.since);
    return Number.isNaN(since)
      ? localization.timeLabel.since
      : `${localization.timeLabel.since} ${formatters.sinceTimestamp(new Date(since))}`;
  }
  const start = toMs(item.start);
  if (Number.isNaN(start)) return '';
  return formatters.timeRange(new Date(start), new Date(resolveEnd(start, item.end, defaultDuration)));
}
