// SPDX-License-Identifier: MIT
// <Scheduler>, <ListView> and <TimelineView> (Feature Dossier 04 §4, 05 F-03). <Scheduler> mounts
// only the active view (B-14); with `keepInactiveViewMounted` the other one stays mounted, hidden and
// paused. The views are also usable on their own.
import {
  type CSSProperties,
  type ForwardedRef,
  forwardRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import type { SchedulerItem, ViewKind } from '../core/types';
import { devWarnOnce } from '../core/env';
import { ShiftNavButton } from './components/nav-button';
import { ListBody } from './components/list-view';
import { PinnedStrip } from './components/pinned-strip';
import { EmptyState, ErrorState, LoadingState, ScrollTopButton } from './components/states';
import { TimeGrid } from './components/time-grid';
import { DialogHost } from './components/dialog-host';
import {
  CardEnvContext,
  type FocusMemory,
  type ReactController,
  SchedulerContext,
  type SchedulerContextValue,
  ViewContext,
} from './context';
import { renderPart } from './parts';
import type { ViewApi } from './runtime';
import type { ListViewProps, SchedulerHandle, SchedulerProps, TimelineViewProps } from './types';
import { useSchedulerSetup } from './use-setup';
import { useViewSetup } from './use-view';

function activeElement(): Element | null {
  return typeof document === 'undefined' ? null : document.activeElement;
}

/** The imperative handle (Feature Dossier 04 §6, F-26): methods act like user actions with source `api`. */
export function createHandle<TItem extends SchedulerItem>(
  controller: ReactController<TItem>,
  views: Map<ViewKind, ViewApi>,
  focus: FocusMemory,
): SchedulerHandle<TItem> {
  const api = (): ViewApi | undefined => {
    const found = views.get(controller.getModel().view);
    if (!found) devWarnOnce('handle-before-mount', 'The scheduler handle was used before the view mounted; ignored.');
    return found;
  };
  const viewModel = () => controller.getViewModel(controller.getModel().view);
  return {
    scrollToShift: (target, options) => api()?.scrollToShift(target, options),
    scrollToTime: (time, options) => api()?.scrollToTime(time, options),
    scrollToItem: (id, options) => api()?.scrollToItem(id, options),
    openItem: (id) => {
      focus.remember('item', activeElement());
      controller.openItem(id);
    },
    closeItem: () => controller.closeItem('api'),
    openOverflow: (groupId) => {
      focus.remember('overflow', activeElement());
      controller.openOverflow(groupId);
    },
    closeOverflow: () => controller.closeOverflow('api'),
    refreshPinning: () => api()?.refreshPinning(),
    getPinnedIds: () => viewModel().pinnedIds,
    getActiveShift: () => viewModel().activeShift,
    getLayout: () => (views.has('timeline') ? controller.getLayout() : null),
    getScrollElement: () => api()?.getScrollElement() ?? null,
    focusItem: (id) => api()?.focusItem(id),
  };
}

function tokenStyle(props: SchedulerProps<SchedulerItem>, hourHeight: number): CSSProperties {
  return { ...props.tokens, '--rs-hour-height': `${hourHeight}px`, ...props.style } as CSSProperties;
}

function SchedulerView<TItem extends SchedulerItem>({
  ctx,
  kind,
  active,
}: {
  ctx: SchedulerContextValue<TItem>;
  kind: ViewKind;
  active: boolean;
}): ReactElement {
  const { model, props, controller, baseId } = ctx;
  const { view, cardEnv, setRoot, setScroller, setSticky } = useViewSetup(ctx, kind, active);
  const { custom, viewModel } = view;

  // A view first shows content once loading is false; later loading keeps it visible and dimmed (F-15).
  const [shown, setShown] = useState(false);
  const hasContent = model.currentIndex >= 0 && !model.error;
  if (!shown && hasContent && !model.loading) setShown(true);
  const busy = model.loading && shown;

  const layout = kind === 'timeline' && hasContent ? controller.getLayout() : null;
  useEffect(() => {
    if (layout) controller.getOptions().onLayout?.(layout);
  }, [controller, layout]);

  const headerId = `${baseId}-${kind}-header`;
  const hasHeader = props.renderHeader !== undefined || custom.slots?.header !== undefined;
  const header = hasHeader
    ? renderPart(custom, 'header', 'div', {
        id: headerId,
        children: props.renderHeader?.({
          expanded: model.headerExpanded,
          view: kind,
          activeShift: viewModel.activeShift,
          segments: model.segments,
        }),
      })
    : null;

  let body: ReactNode = null;
  if (model.error) {
    body = <ErrorState />;
  } else if (model.loading && !shown) {
    body = <LoadingState />;
  } else if (hasContent) {
    const scrollerProps = {
      ref: setScroller,
      tabIndex: -1,
      'aria-busy': busy ? true : undefined,
      className: busy ? 'rs-busy' : undefined,
    };
    const stickyTop = renderPart(custom, 'stickyTop', 'div', {
      ref: setSticky,
      children: (
        <>
          {model.flags.enablePinning ? <PinnedStrip /> : null}
          <ShiftNavButton position="top" />
        </>
      ),
    });
    const stickyBottom = renderPart(custom, 'stickyBottom', 'div', { children: <ShiftNavButton position="bottom" /> });
    body =
      kind === 'list' ? (
        <>
          {renderPart(custom, 'scroller', 'div', {
            ...scrollerProps,
            children: (
              <>
                {stickyTop}
                <ListBody />
              </>
            ),
          })}
          {stickyBottom}
          <ScrollTopButton />
        </>
      ) : (
        <>
          {stickyTop}
          {renderPart(custom, 'scroller', 'div', {
            ...scrollerProps,
            children: (
              <div className="rs-timeline__content">
                <TimeGrid />
              </div>
            ),
          })}
          {stickyBottom}
          {model.hasItems ? null : <EmptyState scope="all" overlay />}
        </>
      );
  }

  const root = renderPart(custom, 'root', 'div', {
    ref: setRoot,
    id: `${baseId}-${kind}`,
    role: 'region',
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-label'] === undefined && hasHeader ? headerId : undefined,
    className: props.className,
    style: tokenStyle(props as SchedulerProps<SchedulerItem>, model.timeline.hourHeight),
    dir: model.explicitDir,
    hidden: active ? undefined : true,
    'data-rs-preset': ctx.preset,
    'data-rs-scheme': ctx.scheme,
    'data-rs-density': model.density,
    'data-rs-view': kind,
    'data-rs-compact': model.compact ? '' : undefined,
    'data-rs-size': model.size,
    'data-rs-unstyled': props.unstyled === true ? '' : undefined,
    'data-rs-reduced-motion': model.animate ? undefined : '',
    children: (
      <>
        {header}
        {body}
        {busy ? <LoadingState overlay /> : null}
        <DialogHost />
      </>
    ),
  });

  return (
    <ViewContext.Provider value={view as never}>
      <CardEnvContext.Provider value={cardEnv as never}>{root}</CardEnvContext.Provider>
    </ViewContext.Provider>
  );
}

function useHandle<TItem extends SchedulerItem>(
  ref: ForwardedRef<SchedulerHandle<TItem>>,
  ctx: SchedulerContextValue<TItem>,
): void {
  const { controller, views, focus } = ctx;
  useImperativeHandle(ref, () => createHandle(controller, views, focus), [controller, views, focus]);
}

function SchedulerRoot<TItem extends SchedulerItem>(
  props: SchedulerProps<TItem>,
  ref: ForwardedRef<SchedulerHandle<TItem>>,
): ReactElement {
  const ctx = useSchedulerSetup(props);
  useHandle(ref, ctx);
  const view = ctx.model.view;
  return (
    <SchedulerContext.Provider value={ctx as never}>
      {props.keepInactiveViewMounted === true ? (
        <>
          <SchedulerView ctx={ctx} kind="list" active={view === 'list'} />
          <SchedulerView ctx={ctx} kind="timeline" active={view === 'timeline'} />
        </>
      ) : (
        <SchedulerView key={view} ctx={ctx} kind={view} active />
      )}
    </SchedulerContext.Provider>
  );
}

function useStandaloneView<TItem extends SchedulerItem>(
  kind: ViewKind,
  props: SchedulerProps<TItem>,
  ref: ForwardedRef<SchedulerHandle<TItem>>,
): ReactElement {
  const ctx = useSchedulerSetup(props, kind);
  useHandle(ref, ctx);
  return (
    <SchedulerContext.Provider value={ctx as never}>
      <SchedulerView ctx={ctx} kind={kind} active />
    </SchedulerContext.Provider>
  );
}

/** The scheduler: the list or timeline view, selected by `view` (Feature Dossier 04 §4). */
export const Scheduler = forwardRef(SchedulerRoot) as <TItem extends SchedulerItem>(
  props: SchedulerProps<TItem> & { ref?: Ref<SchedulerHandle<TItem>> | undefined },
) => ReactElement;

/** The list view on its own. */
export const ListView = forwardRef(function ListView<TItem extends SchedulerItem>(
  props: ListViewProps<TItem>,
  ref: ForwardedRef<SchedulerHandle<TItem>>,
) {
  return useStandaloneView('list', props, ref);
}) as <TItem extends SchedulerItem>(
  props: ListViewProps<TItem> & { ref?: Ref<SchedulerHandle<TItem>> | undefined },
) => ReactElement;

/** The timeline view on its own. */
export const TimelineView = forwardRef(function TimelineView<TItem extends SchedulerItem>(
  props: TimelineViewProps<TItem>,
  ref: ForwardedRef<SchedulerHandle<TItem>>,
) {
  return useStandaloneView('timeline', props, ref);
}) as <TItem extends SchedulerItem>(
  props: TimelineViewProps<TItem> & { ref?: Ref<SchedulerHandle<TItem>> | undefined },
) => ReactElement;
