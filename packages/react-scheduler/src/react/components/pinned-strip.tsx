// SPDX-License-Identifier: MIT
// The pinned strip (Feature Dossier 01 §2.4, 05 F-07, F-18): a labeled region holding a list of chip
// buttons, edge fades while the strip can scroll, and a separate polite announcement of the count,
// at most once per second (B-17). Carried-over chips keep their tags and gain the carried-over tag
// (B-25).
import { memo, type MouseEvent, type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react';
import { interpolate } from '../../core/localization';
import type { PinnedEntry } from '../../core/pinning';
import { resolveTimeLabel } from '../../core/time-label';
import type { SchedulerItem } from '../../core/types';
import { useCardEnv, useSchedulerContext, useViewContext } from '../context';
import { renderPart } from '../parts';
import { Pills } from './pills';
import { cardLevelStyle, describeItem, levelLabel, safeId, tagLabel, VISUALLY_HIDDEN } from './shared';

const ANNOUNCE_INTERVAL = 1000;
const FADE_EPSILON = 2;

export const PinnedChip = memo(function PinnedChip<TItem extends SchedulerItem>({
  entry,
}: {
  entry: PinnedEntry<TItem>;
}): ReactNode {
  const env = useCardEnv<TItem>();
  const { props } = useSchedulerContext<TItem>();
  const { item, carriedOver, tags } = entry;
  const level = env.levels.get(item.level);
  const time = resolveTimeLabel(item, env.localization, env.formatters, env.defaultDuration);
  const base = `${env.baseId}-${env.kind}-chip-${safeId(item.id)}`;
  const owner = { item, level, variant: level?.variant, pinned: true, carriedOver };
  const activate = (event: MouseEvent<HTMLButtonElement>): void => {
    env.focus.remember('item', event.currentTarget);
    env.controller.activateItem(item, 'pinnedChip', event);
  };
  const defaultRender = (): ReactElement =>
    renderPart(
      env.custom,
      'pinnedChip',
      'button',
      {
        type: 'button',
        style: cardLevelStyle(item.level, level),
        'data-rs-level': item.level,
        'aria-labelledby': `${base}-title`,
        'aria-describedby': `${base}-description`,
        'aria-disabled': item.disabled === true ? true : undefined,
        onClick: activate,
        children: (
          <>
            {renderPart(env.custom, 'cardRail', 'span', { 'aria-hidden': true }, owner)}
            <span className="rs-pinned-chip__text">
              {renderPart(env.custom, 'cardTitle', 'span', { id: `${base}-title`, children: item.title }, owner)}
              {renderPart(env.custom, 'cardTimeLabel', 'span', { children: time }, owner)}
              <Pills level={item.level} reference={item.reference} tags={tags} />
            </span>
            <span id={`${base}-description`} className={VISUALLY_HIDDEN}>
              {describeItem(
                levelLabel(item.level, level, env.localization),
                time,
                tags.map((tag) => tagLabel(tag, env.tags.get(tag), env.localization)),
                env.localization,
              )}
            </span>
          </>
        ),
      },
      owner,
    );
  return props.renderPinnedChip ? props.renderPinnedChip(item, { carriedOver, defaultRender }) : defaultRender();
}) as <TItem extends SchedulerItem>(props: { entry: PinnedEntry<TItem> }) => ReactNode;

/** Edge fades show only while the track can scroll that way (BR-L09). */
function useFades(track: HTMLElement | null, count: number): { start: boolean; end: boolean } {
  const [fades, setFades] = useState({ start: false, end: false });
  useEffect(() => {
    if (!track) return;
    const update = (): void => {
      const scrolled = Math.abs(track.scrollLeft);
      const start = scrolled > FADE_EPSILON;
      const end = scrolled + track.clientWidth < track.scrollWidth - FADE_EPSILON;
      setFades((previous) => (previous.start === start && previous.end === end ? previous : { start, end }));
    };
    // Measured after the frame's layout; also keeps setState out of the effect body.
    const frame = requestAnimationFrame(update);
    track.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [track, count]);
  return fades;
}

/** The latest count, announced at most once per interval (B-17). */
function useAnnouncement(count: number, template: Parameters<typeof interpolate>[0], locale: string): string {
  const [text, setText] = useState('');
  const last = useRef({ count: 0, at: Number.NEGATIVE_INFINITY });
  useEffect(() => {
    if (count === last.current.count) return;
    const announce = (): void => {
      last.current = { count, at: Date.now() };
      setText(count > 0 ? interpolate(template, { count }, locale) : '');
    };
    const timer = setTimeout(announce, Math.max(0, last.current.at + ANNOUNCE_INTERVAL - Date.now()));
    return () => clearTimeout(timer);
  }, [count, template, locale]);
  return text;
}

export function PinnedStrip(): ReactElement {
  const { model } = useSchedulerContext();
  const { viewModel, custom } = useViewContext();
  const entries = viewModel.pinned;
  const [track, setTrack] = useState<HTMLElement | null>(null);
  const fades = useFades(track, entries.length);
  const announcement = useAnnouncement(
    entries.length,
    model.localization.pinnedStrip.announcement,
    model.localization.locale,
  );
  const empty = entries.length === 0;
  return renderPart(custom, 'pinnedStrip', 'div', {
    role: 'region',
    'aria-label': model.localization.pinnedStrip.label,
    'data-rs-empty': empty ? '' : undefined,
    children: (
      <>
        <div className="rs-pinned-strip-viewport">
          {renderPart(custom, 'pinnedStripTrack', 'ul', {
            ref: setTrack,
            role: 'list',
            // Its chips are the stops (F-19); engines that make scrollers focusable skip the track.
            tabIndex: -1,
            'data-rs-snap': entries.length >= 2 ? '' : undefined,
            children: entries.map((entry) => (
              <li key={entry.item.id}>
                <PinnedChip entry={entry} />
              </li>
            )),
          })}
          {fades.start ? renderPart(custom, 'edgeFade', 'div', { 'aria-hidden': true, 'data-rs-side': 'start' }) : null}
          {fades.end ? renderPart(custom, 'edgeFade', 'div', { 'aria-hidden': true, 'data-rs-side': 'end' }) : null}
        </div>
        {renderPart(custom, 'liveRegion', 'div', {
          className: VISUALLY_HIDDEN,
          'aria-live': 'polite',
          'aria-atomic': true,
          children: announcement,
        })}
      </>
    ),
  });
}
