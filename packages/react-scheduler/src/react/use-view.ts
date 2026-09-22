// SPDX-License-Identifier: MIT
// Wires one mounted view to its runtime: element refs, the engines' lifecycle, landing, date and
// data changes, the root width and the pinned-strip notifications.
import { useEffect, useMemo, useState } from 'react';
import type { SchedulerItem, ViewKind } from '../core/types';
import { observeWidth } from '../dom/observers';
import type { CardEnv, SchedulerContextValue, ViewContextValue } from './context';
import type { Customization } from './parts';
import { createViewRuntime } from './runtime';

export interface ViewSetup<TItem extends SchedulerItem> {
  view: ViewContextValue<TItem>;
  cardEnv: CardEnv<TItem>;
  setRoot: (node: HTMLElement | null) => void;
  setScroller: (node: HTMLElement | null) => void;
  setSticky: (node: HTMLElement | null) => void;
}

export function useViewSetup<TItem extends SchedulerItem>(
  ctx: SchedulerContextValue<TItem>,
  kind: ViewKind,
  active: boolean,
): ViewSetup<TItem> {
  const { controller, model, props } = ctx;
  const [runtime] = useState(() => createViewRuntime(controller, kind));
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [sticky, setSticky] = useState<HTMLElement | null>(null);
  const viewModel = controller.getViewModel(kind);

  const custom = useMemo<Customization<TItem>>(
    () => ({
      slots: props.slots,
      slotProps: props.slotProps,
      classNames: props.classNames,
      styles: props.styles,
      owner: {
        view: kind,
        compact: model.compact,
        preset: ctx.preset,
        colorScheme: ctx.scheme,
        density: model.density,
        dir: model.dir,
      },
    }),
    [
      props.slots,
      props.slotProps,
      props.classNames,
      props.styles,
      kind,
      model.compact,
      ctx.preset,
      ctx.scheme,
      model.density,
      model.dir,
    ],
  );

  const edge = model.pinRules[kind].edge;
  const cardEnv = useMemo<CardEnv<TItem>>(
    () => ({
      controller,
      runtime,
      custom,
      kind,
      baseId: ctx.baseId,
      compact: model.compact,
      localization: model.localization,
      formatters: model.formatters,
      levels: model.levels,
      tags: model.tags,
      defaultDuration: model.defaultDuration,
      pinning: model.flags.enablePinning,
      edge,
      focus: ctx.focus,
      renderItem: props.renderItem,
      renderCardContent: props.renderCardContent,
      renderTimeLabel: props.renderTimeLabel,
    }),
    [
      controller,
      runtime,
      custom,
      kind,
      ctx.baseId,
      model.compact,
      model.localization,
      model.formatters,
      model.levels,
      model.tags,
      model.defaultDuration,
      model.flags.enablePinning,
      edge,
      ctx.focus,
      props.renderItem,
      props.renderCardContent,
      props.renderTimeLabel,
    ],
  );

  // The imperative API of this view (F-26).
  const { views } = ctx;
  useEffect(() => {
    if (!active) return;
    views.set(kind, runtime.api);
    return () => {
      if (views.get(kind) === runtime.api) views.delete(kind);
    };
  }, [views, kind, runtime, active]);

  // Compact mode and listOnlyBreakpoint follow the root's width, not the viewport (B-16).
  useEffect(() => {
    if (!root || !active) return;
    return observeWidth(root, (width) => controller.setWidth(width));
  }, [controller, root, active]);

  useEffect(() => {
    if (!root || typeof getComputedStyle !== 'function') return;
    controller.setDocumentDir(getComputedStyle(root).direction === 'rtl' ? 'rtl' : 'ltr');
  }, [controller, root]);

  // Engines once per mounted scroller (B-13); recreated only when the pin rule changes.
  const rule = model.pinRules[kind];
  const pinning = model.flags.enablePinning;
  useEffect(() => {
    if (!scroller) return;
    runtime.attach(scroller, sticky);
    return () => runtime.detach();
  }, [runtime, scroller, sticky, pinning, rule.epsilon, rule.hysteresis]);

  useEffect(() => {
    runtime.setActive(active);
  }, [runtime, active]);

  const ready = scroller !== null && !model.loading && model.currentIndex >= 0;
  useEffect(() => {
    if (ready) runtime.ready();
  }, [runtime, ready, active]);

  useEffect(() => {
    runtime.dateChanged(model.date);
  }, [runtime, model.date]);

  useEffect(() => {
    runtime.dataChanged();
  }, [runtime, model.segments]);

  useEffect(() => {
    if (active) controller.flushPinned(kind);
  }, [controller, kind, active, viewModel.pinnedIds]);

  const view = useMemo<ViewContextValue<TItem>>(
    () => ({ kind, active, runtime, viewModel, custom }),
    [kind, active, runtime, viewModel, custom],
  );

  return { view, cardEnv, setRoot, setScroller, setSticky };
}
