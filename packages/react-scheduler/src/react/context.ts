// SPDX-License-Identifier: MIT
// React contexts. The scheduler context changes with every render of its owner; the card context
// changes only when something a card renders changes, so memoized cards skip scroll updates (F-30).
import { type Context, createContext, type KeyboardEvent, type SyntheticEvent, useContext } from 'react';
import type { SchedulerController, SchedulerModel, SchedulerViewModel } from '../core/controller';
import { type BundlerProcess, devWarnOnce } from '../core/env';
import type { SchedulerFormatters } from '../core/format';
import type { ResolvedLevel } from '../core/levels';
import type { SchedulerLocalization } from '../core/localization';
import type { PresetName, SchedulerItem, TagDefinition, ViewKind } from '../core/types';
import type { Customization } from './parts';
import type { ViewApi, ViewRuntime } from './runtime';
import type { SchedulerProps } from './types';

// Development-only branches read the bundler-replaced NODE_ENV behind a typeof guard (env.ts).
declare const process: BundlerProcess;

export type ReactController<TItem extends SchedulerItem> = SchedulerController<TItem, SyntheticEvent, KeyboardEvent>;

/** Elements that focus returns to when a dialog closes (F-14, BR-T07). */
export interface FocusMemory {
  item: HTMLElement | null;
  overflow: HTMLElement | null;
  /** Remembers `element` as the activator of the detail view or the overflow dialog. */
  remember: (dialog: 'item' | 'overflow', element: Element | null) => void;
}

export function createFocusMemory(): FocusMemory {
  const memory: FocusMemory = {
    item: null,
    overflow: null,
    remember(dialog, element) {
      memory[dialog] = element instanceof HTMLElement ? element : null;
    },
  };
  return memory;
}

export interface SchedulerContextValue<TItem extends SchedulerItem = SchedulerItem> {
  controller: ReactController<TItem>;
  props: SchedulerProps<TItem>;
  model: SchedulerModel<TItem>;
  /** Prefix of every element id. */
  baseId: string;
  preset: PresetName;
  scheme: 'light' | 'dark';
  focus: FocusMemory;
  /** Imperative APIs of the mounted views. */
  views: Map<ViewKind, ViewApi>;
}

export interface ViewContextValue<TItem extends SchedulerItem = SchedulerItem> {
  kind: ViewKind;
  active: boolean;
  runtime: ViewRuntime;
  viewModel: SchedulerViewModel<TItem>;
  custom: Customization<TItem>;
}

/** Everything a card reads; stable across scroll updates. */
export interface CardEnv<TItem extends SchedulerItem = SchedulerItem> {
  controller: ReactController<TItem>;
  runtime: ViewRuntime;
  custom: Customization<TItem>;
  kind: ViewKind;
  baseId: string;
  compact: boolean;
  localization: SchedulerLocalization;
  formatters: SchedulerFormatters;
  levels: ReadonlyMap<string, ResolvedLevel>;
  tags: ReadonlyMap<string, TagDefinition>;
  defaultDuration: number;
  pinning: boolean;
  edge: 'top' | 'bottom';
  focus: FocusMemory;
  renderItem: SchedulerProps<TItem>['renderItem'];
  renderCardContent: SchedulerProps<TItem>['renderCardContent'];
  renderTimeLabel: SchedulerProps<TItem>['renderTimeLabel'];
}

export const SchedulerContext: Context<SchedulerContextValue | null> = createContext<SchedulerContextValue | null>(
  null,
);
export const ViewContext: Context<ViewContextValue | null> = createContext<ViewContextValue | null>(null);
export const CardEnvContext: Context<CardEnv | null> = createContext<CardEnv | null>(null);

const OUTSIDE = 'Scheduler parts render inside <Scheduler>, <ListView> or <TimelineView>.';

function required<T>(value: T | null, name: string): T {
  if (value === null) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production')
      devWarnOnce(`context:${name}`, OUTSIDE);
    throw new Error(`[react-scheduler] ${OUTSIDE}`);
  }
  return value;
}

export function useSchedulerContext<TItem extends SchedulerItem = SchedulerItem>(): SchedulerContextValue<TItem> {
  return required(useContext(SchedulerContext), 'scheduler') as unknown as SchedulerContextValue<TItem>;
}

export function useViewContext<TItem extends SchedulerItem = SchedulerItem>(): ViewContextValue<TItem> {
  return required(useContext(ViewContext), 'view') as unknown as ViewContextValue<TItem>;
}

export function useCardEnv<TItem extends SchedulerItem = SchedulerItem>(): CardEnv<TItem> {
  return required(useContext(CardEnvContext), 'card') as unknown as CardEnv<TItem>;
}
