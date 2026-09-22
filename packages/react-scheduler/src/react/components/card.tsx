// SPDX-License-Identifier: MIT
// List and timeline cards (Feature Dossier 01 §L.3, §T.4, 02 §4.3–§4.4). The activator is a native
// <button> holding phrasing content only; its name is the title and its description the level, time
// and tags (B-18). Cards are memoized: they re-render only when their item, placement or the card
// environment changes (F-30).
import {
  type CSSProperties,
  type KeyboardEvent,
  memo,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { isPinnable } from '../../core/pinning';
import { resolveTimeLabel } from '../../core/time-label';
import type { CardVariant, PlacedCard, SchedulerItem } from '../../core/types';
import { type CardEnv, useCardEnv } from '../context';
import { renderPart } from '../parts';
import type { ItemProps, PinSentinelProps, RenderItemContext } from '../types';
import { Pills } from './pills';
import { cardLevelStyle, describeItem, levelLabel, safeId, tagLabel, VISUALLY_HIDDEN } from './shared';

const ACTIVATION_KEYS = new Set(['Enter', ' ']);

export interface CardData<TItem extends SchedulerItem> {
  item: TItem;
  variant: CardVariant;
  timeLabel: string;
  description: string;
  titleId: string;
  descriptionId: string;
  pinnable: boolean;
}

export function cardData<TItem extends SchedulerItem>(env: CardEnv<TItem>, item: TItem): CardData<TItem> {
  const level = env.levels.get(item.level);
  const timeLabel = resolveTimeLabel(item, env.localization, env.formatters, env.defaultDuration);
  const base = `${env.baseId}-${env.kind}-${safeId(item.id)}`;
  return {
    item,
    variant: level?.variant ?? 'default',
    timeLabel,
    description: describeItem(
      levelLabel(item.level, level, env.localization),
      timeLabel,
      (item.tags ?? []).map((tag) => tagLabel(tag, env.tags.get(tag), env.localization)),
      env.localization,
    ),
    titleId: `${base}-title`,
    descriptionId: `${base}-description`,
    pinnable: env.pinning && isPinnable(item, level),
  };
}

/** Props of the activator; `renderItem` spreads them on its own element (F-23). */
export function activatorProps<TItem extends SchedulerItem>(
  env: CardEnv<TItem>,
  data: CardData<TItem>,
  source: 'listCard' | 'timelineCard',
): ItemProps {
  const { item } = data;
  const activate = (event: MouseEvent<HTMLButtonElement>): void => {
    env.focus.remember('item', event.currentTarget);
    env.controller.activateItem(item, source, event);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const activation = ACTIVATION_KEYS.has(event.key);
    const target = event.currentTarget;
    let synchronous = true;
    let allowed = false;
    env.controller.keyDownItem(item, event, () => {
      if (synchronous) allowed = true;
      else if (activation) {
        env.focus.remember('item', target);
        env.controller.activateItem(item, source);
      }
    });
    synchronous = false;
    // The native click activates; a middleware that does not call next() cancels it (F-22).
    if (activation && !allowed) event.preventDefault();
  };
  return {
    ref: env.runtime.activatorRef(item.id),
    type: 'button',
    className: 'rs-card-activator',
    'data-rs-part': 'cardActivator',
    'aria-labelledby': data.titleId,
    'aria-describedby': data.descriptionId,
    'aria-disabled': item.disabled === true ? true : undefined,
    onClick: activate,
    onKeyDown,
  };
}

export function sentinelProps<TItem extends SchedulerItem>(
  env: CardEnv<TItem>,
  data: CardData<TItem>,
): PinSentinelProps | null {
  if (!data.pinnable) return null;
  return {
    ref: env.runtime.sentinelRef(data.item.id, [data.item.id]) as PinSentinelProps['ref'],
    className: 'rs-pin-sentinel',
    'data-rs-part': 'pinSentinel',
    'data-rs-edge': env.edge,
    'aria-hidden': true,
  };
}

function text<TItem extends SchedulerItem>(
  env: CardEnv<TItem>,
  part: 'cardTitle' | 'cardDescription' | 'cardTimeLabel' | 'cardSuggestion',
  children: ReactNode,
  id?: string,
): ReactElement | null {
  if (children === undefined || children === null || children === '') return null;
  return renderPart(env.custom, part, 'span', { id, children });
}

function timeLabel<TItem extends SchedulerItem>(env: CardEnv<TItem>, data: CardData<TItem>): ReactElement | null {
  const content = env.renderTimeLabel
    ? env.renderTimeLabel(data.item, { defaultLabel: data.timeLabel })
    : data.timeLabel;
  return text(env, 'cardTimeLabel', content);
}

function rail<TItem extends SchedulerItem>(env: CardEnv<TItem>): ReactElement {
  return renderPart(env.custom, 'cardRail', 'span', { 'aria-hidden': true });
}

/** The default inside of a list card activator (01 §L.3). */
function listContent<TItem extends SchedulerItem>(env: CardEnv<TItem>, data: CardData<TItem>): ReactElement {
  const { item } = data;
  return (
    <span className="rs-card__row">
      {rail(env)}
      <span className="rs-card__content">
        <span className="rs-card__meta">
          {timeLabel(env, data)}
          <Pills level={item.level} reference={item.reference} tags={item.tags ?? []} />
        </span>
        <span className="rs-card__text">
          {text(env, 'cardTitle', item.title, data.titleId)}
          {text(env, 'cardDescription', item.description)}
        </span>
      </span>
    </span>
  );
}

/** The default inside of a timeline card activator (01 §T.4). */
function timelineContent<TItem extends SchedulerItem>(env: CardEnv<TItem>, data: CardData<TItem>): ReactElement {
  const { item } = data;
  return (
    <>
      <span className="rs-card__top">
        {rail(env)}
        <span className="rs-card__body">
          <span className="rs-card__text">
            {text(env, 'cardTitle', item.title, data.titleId)}
            {text(env, 'cardDescription', item.description)}
          </span>
          {timeLabel(env, data)}
        </span>
      </span>
      <span className="rs-card__bottom">
        <Pills level={item.level} reference={item.reference} tags={item.tags ?? []} />
        {text(env, 'cardSuggestion', item.suggestion)}
      </span>
    </>
  );
}

function renderCard<TItem extends SchedulerItem>(
  env: CardEnv<TItem>,
  data: CardData<TItem>,
  part: 'listCard' | 'timelineCard',
  style: CSSProperties | undefined,
  placement: Record<string, unknown>,
): ReactNode {
  const { item } = data;
  const source = part === 'listCard' ? 'listCard' : 'timelineCard';
  const owner = {
    item,
    level: env.levels.get(item.level),
    variant: data.variant,
    disabled: item.disabled === true,
  };
  const defaultContent = (): ReactNode => (env.kind === 'list' ? listContent(env, data) : timelineContent(env, data));
  const content = env.renderCardContent
    ? env.renderCardContent(item, {
        view: env.kind,
        variant: data.variant,
        compact: env.compact,
        level: owner.level,
        timeLabel: data.timeLabel,
        defaultRender: defaultContent,
        item,
      })
    : defaultContent();
  const { ref, className: _className, 'data-rs-part': _part, ...activator } = activatorProps(env, data, source);
  const sentinel = sentinelProps(env, data);
  const defaultRender = (): ReactElement =>
    renderPart(
      env.custom,
      part,
      'li',
      {
        key: item.id,
        ref: env.runtime.cardRef(item.id),
        'data-rs-level': item.level,
        'data-rs-variant': data.variant,
        style: { ...cardLevelStyle(item.level, owner.level), ...style },
        ...placement,
        children: (
          <>
            {sentinel && env.edge === 'top' ? renderPart(env.custom, 'pinSentinel', 'span', sentinel, owner) : null}
            {renderPart(env.custom, 'cardActivator', 'button', { ...activator, ref, children: content }, owner)}
            <span id={data.descriptionId} className={VISUALLY_HIDDEN}>
              {data.description}
            </span>
            {sentinel && env.edge === 'bottom' ? renderPart(env.custom, 'pinSentinel', 'span', sentinel, owner) : null}
          </>
        ),
      },
      owner,
    );
  if (!env.renderItem) return defaultRender();
  const ctx: RenderItemContext<TItem> = {
    item,
    view: env.kind,
    variant: data.variant,
    compact: env.compact,
    defaultRender,
    getItemProps: () => activatorProps(env, data, source),
    getPinSentinelProps: () => sentinelProps(env, data),
    style,
  };
  return env.renderItem(item, ctx);
}

/** A list card (`li`) with its activator; `renderItem` replaces it entirely. */
export const ListCard = memo(function ListCard<TItem extends SchedulerItem>({ item }: { item: TItem }): ReactNode {
  const env = useCardEnv<TItem>();
  return renderCard(env, cardData(env, item), 'listCard', undefined, {});
}) as <TItem extends SchedulerItem>(props: { item: TItem }) => ReactNode;

/**
 * Horizontal geometry of a timeline card: `n` columns sharing the lane with `gap` px between them.
 * A column at or past the count (compact promotion, DQ-3) is clamped into the last column.
 */
export function cardGeometry(
  placed: Pick<PlacedCard<unknown>, 'column' | 'columns' | 'top' | 'height'>,
  gap: number,
): CSSProperties {
  const columns = Math.max(1, placed.columns);
  const column = Math.min(Math.max(0, placed.column), columns - 1);
  if (columns === 1) return { top: placed.top, height: placed.height, insetInlineStart: 0, width: '100%' };
  const width = `(100% - ${(columns - 1) * gap}px) / ${columns}`;
  return {
    top: placed.top,
    height: placed.height,
    insetInlineStart: column === 0 ? 0 : `calc(${column} * (${width} + ${gap}px))`,
    width: `calc(${width})`,
  };
}

/** A timeline card, absolutely positioned from the layout engine's output. */
export const TimelineCard = memo(function TimelineCard<TItem extends SchedulerItem>({
  placed,
  gap,
}: {
  placed: PlacedCard<TItem>;
  gap: number;
}): ReactNode {
  const env = useCardEnv<TItem>();
  return renderCard(env, cardData(env, placed.item), 'timelineCard', cardGeometry(placed, gap), {
    'data-rs-column': placed.column,
    'data-rs-columns': placed.columns,
  });
}) as <TItem extends SchedulerItem>(props: { placed: PlacedCard<TItem>; gap: number }) => ReactNode;
