// SPDX-License-Identifier: MIT
// Hosts the lazy dialogs of the active view and returns focus when they close: to the activator, or
// to the scroller when the activator is gone (Feature Dossier 05 F-14, BR-T07).
import { type ComponentType, lazy, type ReactElement, Suspense, useEffect, useRef } from 'react';
import type { OverflowGroup, SchedulerItem } from '../../core/types';
import { useSchedulerContext, useViewContext } from '../context';

const LazyOverflowDialog = lazy(() =>
  import('./overflow-dialog').then((module) => ({ default: module.OverflowDialog })),
) as unknown as ComponentType<{ group: OverflowGroup<SchedulerItem> }>;

const LazyDetail = lazy(() =>
  import('./detail-dialog').then((module) => ({ default: module.DefaultItemDetail })),
) as unknown as ComponentType<{ item: SchedulerItem }>;

/** Moves focus back when `open` turns false. */
function useFocusReturn(open: boolean, target: () => HTMLElement | null, fallback: () => HTMLElement | null): void {
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const element = target();
      if (element?.isConnected) element.focus();
      else fallback()?.focus();
    }
    wasOpen.current = open;
  }, [open, target, fallback]);
}

export function DialogHost(): ReactElement | null {
  const { model, controller, props, focus, views } = useSchedulerContext();
  const { kind, active } = useViewContext();
  const scroller = (): HTMLElement | null => views.get(kind)?.getScrollElement() ?? null;
  const group = active && kind === 'timeline' ? controller.getOverflowGroup(model.openOverflowId) : null;
  const item = active ? model.openItem : null;
  useFocusReturn(group !== null, () => focus.overflow, scroller);
  useFocusReturn(item !== null, () => focus.item, scroller);
  if (!active) return null;
  const close = (): void => controller.closeItem('closeButton');
  return (
    <>
      {group ? (
        <Suspense fallback={null}>
          <LazyOverflowDialog group={group} />
        </Suspense>
      ) : null}
      {item ? (
        props.renderItemDetail ? (
          props.renderItemDetail({ item, close, source: model.openSource })
        ) : (
          <Suspense fallback={null}>
            <LazyDetail item={item} />
          </Suspense>
        )
      ) : null}
    </>
  );
}
