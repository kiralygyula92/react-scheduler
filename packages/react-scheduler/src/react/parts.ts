// SPDX-License-Identifier: MIT
// The part system (Feature Dossier 06 §1.1, 05 F-21): every visible element is rendered through
// `renderPart`, which applies `slots`, `slotProps`, `classNames` and `styles`, and keeps the
// library's refs and `data-rs-part`. Parts are plain function calls, not wrapper components, so a
// card with fifteen parts costs no extra component instances (F-30).
import {
  createElement,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefCallback,
} from 'react';
import type { OwnerState, SchedulerPart, SchedulerSlotProps, SchedulerSlots } from './types';

export interface Customization<TItem> {
  slots: Partial<SchedulerSlots<TItem>> | undefined;
  slotProps: Partial<SchedulerSlotProps<TItem>> | undefined;
  classNames: Partial<Record<SchedulerPart, string>> | undefined;
  styles: Partial<Record<SchedulerPart, CSSProperties>> | undefined;
  /** Owner state shared by every part; parts add their own fields. */
  owner: OwnerState<TItem>;
}

const classCache = new Map<string, string>();

/** `rs-` + the part name in kebab case (`pinnedStripTrack` → `rs-pinned-strip-track`). */
export function partClass(part: SchedulerPart): string {
  let name = classCache.get(part);
  if (name === undefined) {
    name = `rs-${part.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
    classCache.set(part, name);
  }
  return name;
}

export function joinClasses(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

type Props = Record<string, unknown> & { children?: ReactNode };
type Handler = (event: unknown, ...rest: unknown[]) => void;

const HANDLER = /^on[A-Z]/;

/**
 * Consumer handler first; the library default runs unless the consumer called
 * `event.preventDefault()` (the equivalent of not calling `next()`, ADR 0003).
 */
function composeHandlers(consumer: Handler, library: Handler): Handler {
  return (event, ...rest) => {
    consumer(event, ...rest);
    const prevented = (event as { defaultPrevented?: boolean } | null)?.defaultPrevented === true;
    if (!prevented) library(event, ...rest);
  };
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

const composedRefs = new WeakMap<object, WeakMap<object, RefCallback<unknown>>>();

/** A stable callback ref that sets both refs, so a consumer ref never churns the library's. */
function composeRefs(library: Ref<unknown> | undefined, consumer: Ref<unknown> | undefined): Ref<unknown> | undefined {
  if (!consumer) return library;
  if (!library) return consumer;
  let inner = composedRefs.get(library);
  if (!inner) {
    inner = new WeakMap();
    composedRefs.set(library, inner);
  }
  let composed = inner.get(consumer);
  if (!composed) {
    composed = (value) => {
      assignRef(library, value);
      assignRef(consumer, value);
    };
    inner.set(consumer, composed);
  }
  return composed;
}

/**
 * Merges, in the 06 §1.1 order: library defaults, then `slotProps`, then `classNames` / `styles`;
 * handlers compose, refs compose, `className` is appended and `style` merged; `data-rs-part` is
 * always the part name.
 */
export function mergePartProps(
  part: SchedulerPart,
  defaults: Props,
  extra: Props | undefined,
  className: string | undefined,
  style: CSSProperties | undefined,
): Props {
  const merged: Props = { ...defaults };
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (key === 'className' || key === 'style' || key === 'ref') continue;
      const library = merged[key];
      merged[key] =
        HANDLER.test(key) && typeof value === 'function' && typeof library === 'function'
          ? composeHandlers(value as Handler, library as Handler)
          : value;
    }
  }
  merged['className'] = joinClasses(
    partClass(part),
    defaults['className'] as string | undefined,
    extra?.['className'] as string | undefined,
    className,
  );
  const extraStyle = extra?.['style'] as CSSProperties | undefined;
  if (extraStyle || style) {
    merged['style'] = { ...(defaults['style'] as CSSProperties | undefined), ...extraStyle, ...style };
  }
  const ref = composeRefs(defaults['ref'] as Ref<unknown> | undefined, extra?.['ref'] as Ref<unknown> | undefined);
  if (ref) merged['ref'] = ref;
  else delete merged['ref'];
  merged['data-rs-part'] = part;
  return merged;
}

/**
 * Renders `part` as its slot component (with `ownerState` and `Default`) or as the default element.
 * `owner` adds part-specific fields to the shared owner state.
 */
export function renderPart<TItem>(
  custom: Customization<TItem>,
  part: SchedulerPart,
  Default: ElementType,
  props: object,
  owner?: Partial<OwnerState<TItem>>,
): ReactElement {
  const slot = custom.slots?.[part];
  const slotProps = custom.slotProps?.[part];
  let ownerState: OwnerState<TItem> | undefined;
  const getOwner = (): OwnerState<TItem> => (ownerState ??= owner ? { ...custom.owner, ...owner } : custom.owner);
  const extra = (typeof slotProps === 'function' ? slotProps(getOwner()) : slotProps) as Props | undefined;
  const merged = mergePartProps(part, props as Props, extra, custom.classNames?.[part], custom.styles?.[part]);
  if (slot) return createElement(slot as ElementType, { ...merged, ownerState: getOwner(), Default });
  return createElement(Default, merged);
}
