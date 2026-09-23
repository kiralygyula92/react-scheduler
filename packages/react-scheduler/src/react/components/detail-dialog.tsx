// SPDX-License-Identifier: MIT
// The default detail view (Feature Dossier 05 F-14), loaded lazily: a native modal <dialog> with the
// level rail and title, description, pills, time label, suggestion and a close button.
import type { ReactElement } from 'react';
import { resolveTimeLabel } from '../../core/time-label';
import type { SchedulerItem } from '../../core/types';
import { useCardEnv, useSchedulerContext, useViewContext } from '../context';
import { renderPart } from '../parts';
import { useModal } from './modal';
import { Pills } from './pills';
import { cardLevelStyle, safeId } from './shared';

/**
 * The detail view an item opens into, as the library renders it.
 *
 * @category Components
 * @since 1.0.0
 */
export function DefaultItemDetail<TItem extends SchedulerItem>({ item }: { item: TItem }): ReactElement {
  const { controller, baseId } = useSchedulerContext<TItem>();
  const { custom, kind } = useViewContext<TItem>();
  const env = useCardEnv<TItem>();
  const modal = useModal((reason) => controller.closeItem(reason));
  const level = env.levels.get(item.level);
  const titleId = `${baseId}-${kind}-detail-${safeId(item.id)}`;
  const time = resolveTimeLabel(item, env.localization, env.formatters, env.defaultDuration);
  const owner = { item, level, variant: level?.variant };
  return renderPart(
    custom,
    'detailDialog',
    'dialog',
    {
      ...modal,
      'aria-labelledby': titleId,
      'data-rs-level': item.level,
      style: cardLevelStyle(item.level, level),
      children: (
        <>
          <div className="rs-detail-dialog__header">
            {renderPart(custom, 'cardRail', 'span', { 'aria-hidden': true }, owner)}
            <h2 id={titleId} className="rs-card-title rs-dialog__heading">
              {item.title}
            </h2>
          </div>
          {item.description ? <p className="rs-card-description">{item.description}</p> : null}
          <Pills level={item.level} reference={item.reference} tags={item.tags ?? []} />
          {time ? <p className="rs-card-time-label">{time}</p> : null}
          {item.suggestion ? <p className="rs-card-suggestion">{item.suggestion}</p> : null}
          <div className="rs-dialog__actions">
            <button type="button" className="rs-text-button" onClick={() => controller.closeItem('closeButton')}>
              {env.localization.detail.close}
            </button>
          </div>
        </>
      ),
    },
    owner,
  );
}
