// SPDX-License-Identifier: MIT
// Pills (Feature Dossier 02 §4.5): level, tag and reference, each a diamond marker plus a label.
import { type CSSProperties, memo, type NamedExoticComponent, type ReactElement, type ReactNode } from 'react';
import { useCardEnv } from '../context';
import type { Customization } from '../parts';
import { renderPart } from '../parts';
import { DiamondIcon } from './icons';
import { levelColor, levelLabel, levelOnColor, tagLabel } from './shared';

function marker<TItem>(custom: Customization<TItem>): ReactElement {
  return renderPart(custom, 'pillIcon', DiamondIcon, {});
}

function label(text: ReactNode): ReactElement {
  return <span className="rs-pill__label">{text}</span>;
}

/**
 * The pill that shows an item’s level.
 *
 * @category Components
 * @since 1.0.0
 */
export const LevelPill: NamedExoticComponent<{ level: string }> = memo(function LevelPill({
  level,
}: {
  level: string;
}): ReactElement {
  const env = useCardEnv();
  const definition = env.levels.get(level);
  const style = {
    '--rs-pill-color': levelColor(level, definition),
    '--rs-pill-on': levelOnColor(level, definition),
  } as CSSProperties;
  return renderPart(
    env.custom,
    'levelPill',
    'span',
    {
      'data-rs-level': level,
      style,
      children: (
        <>
          {marker(env.custom)}
          {label(levelLabel(level, definition, env.localization))}
        </>
      ),
    },
    { level: definition },
  );
});

/**
 * The pill that shows one of an item’s tags.
 *
 * @category Components
 * @since 1.0.0
 */
export const TagPill: NamedExoticComponent<{ tag: string }> = memo(function TagPill({
  tag,
}: {
  tag: string;
}): ReactElement {
  const env = useCardEnv();
  const definition = env.tags.get(tag);
  const style =
    definition?.background !== undefined || definition?.color !== undefined
      ? ({ '--rs-tag-color': definition.background, '--rs-tag-on': definition.color } as CSSProperties)
      : undefined;
  return renderPart(env.custom, 'tagPill', 'span', {
    'data-rs-tag': tag,
    style,
    children: (
      <>
        {marker(env.custom)}
        {label(tagLabel(tag, definition, env.localization))}
      </>
    ),
  });
});

/**
 * The pill that shows an item’s reference number.
 *
 * @category Components
 * @since 1.0.0
 */
export const ReferencePill: NamedExoticComponent<{ reference: string }> = memo(function ReferencePill({
  reference,
}: {
  reference: string;
}): ReactElement {
  const env = useCardEnv();
  return renderPart(env.custom, 'referencePill', 'span', {
    children: (
      <>
        {marker(env.custom)}
        {label(`${env.localization.referenceLabel} ${reference}`)}
      </>
    ),
  });
});

/** Level pill, optional reference pill, then tag pills (Feature Dossier 01 §L.3). */
export function Pills({
  level,
  reference,
  tags,
}: {
  level: string;
  reference?: string | undefined;
  tags: readonly string[];
}): ReactElement {
  const env = useCardEnv();
  return renderPart(env.custom, 'cardPills', 'span', {
    children: (
      <>
        <LevelPill level={level} />
        {reference !== undefined && reference !== '' ? <ReferencePill reference={reference} /> : null}
        {tags.map((tag) => (
          <TagPill key={tag} tag={tag} />
        ))}
      </>
    ),
  });
}
