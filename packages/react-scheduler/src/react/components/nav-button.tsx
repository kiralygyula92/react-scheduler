// SPDX-License-Identifier: MIT
// Shift navigation buttons (Feature Dossier 05 F-08). The visible label is the accessible name; the
// hint is the tooltip and the accessible description (B-26). At an edge the list hides the button and
// the timeline disables it, showing the shift's title and range.
import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { interpolate } from '../../core/localization';
import type { NavPosition } from '../../core/controller';
import { useSchedulerContext, useViewContext } from '../context';
import { renderPart } from '../parts';
import { Tooltip, useTooltip } from './tooltip';

export function ShiftNavButton({ position }: { position: NavPosition }): ReactElement | null {
  const { model, props, baseId } = useSchedulerContext();
  const { viewModel, runtime, custom, kind } = useViewContext();
  const nav = viewModel.navigation[position];
  const hintId = `${baseId}-${kind}-nav-${position}-hint`;
  const tooltip = useTooltip(hintId, model.flags.enableTooltips);
  if (!nav.visible) return null;

  const owner = { position, disabled: nav.disabled, shift: nav.target ?? viewModel.activeShift ?? undefined };
  let content: ReactNode;
  if (props.renderNavLabel) {
    content = props.renderNavLabel({
      position,
      target: nav.target,
      disabled: nav.disabled,
      carriedOverCount: nav.carriedOverCount,
    });
  } else if (nav.disabled) {
    const shift = viewModel.activeShift;
    content = (
      <>
        <span className="rs-nav-button__title">{nav.label}</span>
        {shift ? (
          <span className="rs-nav-button__range">
            {model.formatters.shiftRange(new Date(shift.start), new Date(shift.end))}
          </span>
        ) : null}
      </>
    );
  } else {
    content = (
      <>
        <span>{nav.label}</span>
        {nav.carriedOverCount > 0
          ? renderPart(
              custom,
              'carriedOverCount',
              'span',
              {
                children: interpolate(
                  model.localization.nav.carriedOverCount,
                  { count: nav.carriedOverCount },
                  model.localization.locale,
                ),
              },
              owner,
            )
          : null}
      </>
    );
  }

  const button = renderPart(
    custom,
    'navButton',
    'button',
    {
      ...tooltip.anchor,
      ...(custom.slots?.navButton ? { navState: nav } : {}),
      type: 'button',
      'aria-disabled': nav.disabled ? true : undefined,
      'data-rs-position': position,
      'data-rs-disabled': nav.disabled ? '' : undefined,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        if (!nav.disabled) runtime.navigate(position, event);
      },
      children: content,
    },
    owner,
  );
  return (
    <>
      {button}
      <Tooltip id={hintId} position={tooltip.position}>
        {nav.hint}
      </Tooltip>
    </>
  );
}
