// SPDX-License-Identifier: MIT
// Helpers shared by the parts: DOM-safe ids, level and tag labels and colors, card descriptions.
import type { CSSProperties } from 'react';
import type { ResolvedLevel } from '../../core/levels';
import { interpolate, type SchedulerLocalization } from '../../core/localization';
import type { LevelDefinition, TagDefinition } from '../../core/types';

/** Element-id-safe, collision-free encoding of an item id. */
export function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `_${char.charCodeAt(0).toString(36)}_`);
}

/** Level keys that can name a custom property; others use the fallback token. */
const TOKEN_KEY = /^[a-zA-Z0-9_-]+$/;

export function levelColor(key: string, level: LevelDefinition | undefined): string {
  if (level?.color) return level.color;
  return TOKEN_KEY.test(key) ? `var(--rs-level-${key}, var(--rs-level-fallback))` : 'var(--rs-level-fallback)';
}

export function levelOnColor(key: string, level: LevelDefinition | undefined): string {
  if (level?.onColor) return level.onColor;
  return TOKEN_KEY.test(key) ? `var(--rs-level-${key}-on, var(--rs-level-fallback-on))` : 'var(--rs-level-fallback-on)';
}

/** `level.label`, then `localization.levels[key]`, then the key (Feature Dossier 04 §3.1). */
export function levelLabel(
  key: string,
  level: LevelDefinition | undefined,
  localization: SchedulerLocalization,
): string {
  return level?.label ?? localization.levels[key] ?? key;
}

export function tagLabel(key: string, tag: TagDefinition | undefined, localization: SchedulerLocalization): string {
  return tag?.label ?? localization.tags[key] ?? key;
}

/** The card's level color as the `--rs-card-level` property. */
export function cardLevelStyle(key: string, level: ResolvedLevel | undefined): CSSProperties {
  return { '--rs-card-level': levelColor(key, level) } as CSSProperties;
}

/**
 * The accessible description of a card or chip: `card.description` ("{{level}}, {{time}}") plus the
 * tag labels (Feature Dossier 05 F-18, B-18).
 */
export function describeItem(
  level: string,
  time: string,
  tags: readonly string[],
  localization: SchedulerLocalization,
): string {
  const text = interpolate(localization.card.description, { level, time }, localization.locale);
  return [text, ...tags].filter((part) => part.length > 0).join(', ');
}

/** Visually hidden text styles are in base.css; this class keeps them in unstyled mode too. */
export const VISUALLY_HIDDEN = 'rs-visually-hidden';

/** Presentation glyph of the pager (Feature Dossier 06 §6.1: not a localization key). */
export const ELLIPSIS = '…';
