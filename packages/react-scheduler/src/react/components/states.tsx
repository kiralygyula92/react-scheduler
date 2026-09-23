// SPDX-License-Identifier: MIT
// Empty, loading and error states (Feature Dossier 05 F-15, B-02), the list's now marker (F-04, B-01)
// and the compact scroll-to-top button (01 §L.10).
import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { interpolate } from '../../core/localization';
import type { SchedulerItem, ShiftSegment } from '../../core/types';
import { useSchedulerContext, useViewContext } from '../context';
import { renderPart } from '../parts';
import { ChevronUpIcon, Spinner } from './icons';
import { Tooltip, useTooltip } from './tooltip';

/**
 * What a view shows when there is nothing to place.
 *
 * @category Components
 * @since 1.0.0
 */
export function EmptyState<TItem extends SchedulerItem>({
  scope,
  segment,
  overlay = false,
}: {
  /** Whether the whole schedule is empty or only one shift. */
  scope: 'all' | 'shift';
  /** The empty shift, when the scope is one shift. */
  segment?: ShiftSegment<TItem> | undefined;
  /** Renders the state over the content instead of in place of it. */
  overlay?: boolean;
}): ReactElement {
  const { model, props } = useSchedulerContext<TItem>();
  const { custom } = useViewContext<TItem>();
  const text = scope === 'all' ? model.localization.emptyAll : model.localization.emptyShift;
  const content: ReactNode = props.renderEmpty ? props.renderEmpty({ scope, segment }) : text;
  if (scope === 'shift') {
    return renderPart(custom, 'shiftEmpty', 'p', { children: content }, { shift: segment?.shift });
  }
  return renderPart(custom, 'emptyState', 'div', { 'data-rs-overlay': overlay ? '' : undefined, children: content });
}

/**
 * What a view shows while items are being loaded.
 *
 * @category Components
 * @since 1.0.0
 */
export function LoadingState({
  overlay = false,
}: {
  /** Renders the state over the content instead of in place of it. */
  overlay?: boolean;
}): ReactElement {
  const { model, props } = useSchedulerContext();
  const { custom } = useViewContext();
  return renderPart(custom, 'loadingState', 'div', {
    role: 'progressbar',
    'aria-label': model.localization.loading,
    'data-rs-overlay': overlay ? '' : undefined,
    children: props.renderLoading ? props.renderLoading() : <Spinner />,
  });
}

/**
 * What a view shows when loading failed, with the retry action when one is given.
 *
 * @category Components
 * @since 1.0.0
 */
export function ErrorState(): ReactElement {
  const { model, props } = useSchedulerContext();
  const { custom } = useViewContext();
  const retry = props.onRetry;
  const content: ReactNode = props.renderError ? (
    props.renderError({ error: model.error, retry })
  ) : (
    <>
      <p>{model.localization.errorTitle}</p>
      {retry ? (
        <button type="button" className="rs-text-button" onClick={() => retry()}>
          {model.localization.retry}
        </button>
      ) : null}
    </>
  );
  return renderPart(custom, 'errorState', 'div', { role: 'alert', children: content });
}

/** The list's now marker: the clock time in a pill, then a line (F-04, B-01). */
export function NowIndicator(): ReactElement {
  const { model } = useSchedulerContext();
  const { custom } = useViewContext();
  const time = model.formatters.clockTime(new Date(model.now));
  return renderPart(custom, 'nowMarker', 'div', {
    role: 'separator',
    'aria-label': interpolate(model.localization.now.label, { time }, model.localization.locale),
    children: renderPart(custom, 'nowLabel', 'span', { 'aria-hidden': true, children: time }),
  });
}

/**
 * The button that returns the scroller to the top.
 *
 * @category Components
 * @since 1.0.0
 */
export function ScrollTopButton(): ReactElement | null {
  const { model, baseId } = useSchedulerContext();
  const { viewModel, runtime, custom, kind } = useViewContext();
  const tooltipId = `${baseId}-${kind}-scroll-top-hint`;
  const tooltip = useTooltip(tooltipId, model.flags.enableTooltips);
  if (!viewModel.scrollTopVisible) return null;
  const { 'aria-describedby': _described, ...anchor } = tooltip.anchor;
  return (
    <>
      {renderPart(custom, 'scrollTopButton', 'button', {
        ...anchor,
        type: 'button',
        'aria-label': model.localization.scrollTop,
        onClick: (event: MouseEvent<HTMLButtonElement>) => runtime.scrollToTop(event),
        children: <ChevronUpIcon />,
      })}
      <Tooltip id={tooltipId} position={tooltip.position}>
        {model.localization.scrollTop}
      </Tooltip>
    </>
  );
}
