import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The token sheet is checked as data: every Dossier token exists, the classic values equal
// Feature Dossier 02 §1, the default preset applies the 06 §3 fixes, and its contrast pairs meet
// WCAG 2.2 AA (B-19).
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function block(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing block ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const tokens = new Map<string, string>();
  for (const match of body.matchAll(/(--rs-[\w-]+):\s*([^;]+);/g)) tokens.set(match[1]!, match[2]!.trim());
  return tokens;
}

const base = block('.rs-root');
const dark = block(".rs-root[data-rs-scheme='dark']");
const defaults = block(".rs-root[data-rs-preset='default']");
const defaultsDark = block(".rs-root[data-rs-preset='default'][data-rs-scheme='dark']");
const merge = (...maps: Map<string, string>[]): Map<string, string> => new Map(maps.flatMap((map) => [...map]));
const themes = {
  classicLight: base,
  classicDark: merge(base, dark),
  defaultLight: merge(base, defaults),
  defaultDark: merge(base, dark, defaults, defaultsDark),
};

/** Normalises #fff / #FFFFFF / rgb(0 0 0 / 60%) to "#RRGGBB" or "#RRGGBB/a", as the Dossier writes colours. */
function colour(value: string): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const digits = hex[1]!.length === 3 ? [...hex[1]!].map((d) => d + d).join('') : hex[1]!;
    return `#${digits.toUpperCase()}`;
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+) \/ (\d+)%\)$/.exec(value);
  if (rgb) {
    const channels = [rgb[1], rgb[2], rgb[3]].map((c) => Number(c).toString(16).padStart(2, '0')).join('');
    return `#${channels.toUpperCase()}/${Number(rgb[4]) / 100}`;
  }
  return value;
}

// Feature Dossier 02 §1.1 (classic light / dark).
const CLASSIC: Record<string, [string, string]> = {
  'color-bg': ['#FFFFFF', '#121212'],
  'color-surface': ['#FFFFFF', '#1E1E1E'],
  'color-surface-muted': ['#F9F9F9', '#161616'],
  'color-surface-overlay': ['#FFFFFF', '#202020'],
  'color-text': ['#000000', '#FFFFFF'],
  'color-text-muted': ['#6F7173', '#8A8D92'],
  'color-text-secondary': ['#000000/0.6', '#FFFFFF/0.7'],
  'color-text-body': ['#000000/0.87', '#FFFFFF'],
  'color-text-inverse': ['#FFFFFF', '#000000'],
  'color-on-pill-dark': ['#000000', '#000000'],
  'color-on-pill-light': ['#FFFFFF', '#FFFFFF'],
  'color-divider': ['#DFDFDF', '#333333'],
  'color-grid-line': ['#DFDFDF', '#222222'],
  'color-grid-boundary': ['#000000', '#FFFFFF'],
  'color-off-shift': ['#F2F2F2', '#161616'],
  'color-now': ['#999DA6', '#999DA6'],
  'color-nav-bg': ['#F9F9F9', '#161616'],
  'color-nav-bg-hover': ['#ECECEC', '#2A2A2A'],
  'color-nav-border': ['#B8B8B8', '#222222'],
  'color-alert-border': ['#D79C8B', '#222222'],
  'color-alert-text-muted': ['#865A4C', '#A97867'],
  'color-pill-neutral': ['#FFFFFF', '#FFFFFF'],
  'color-more-bg': ['#000000', '#FFFFFF'],
  'color-more-text': ['#FFFFFF', '#000000'],
  'color-tooltip-bg': ['#262626', '#262626'],
  'color-tooltip-text': ['#FFFFFF', '#FFFFFF'],
  'color-accent': ['#141414', '#000000'],
  'color-on-accent': ['#FFFFFF', '#FFFFFF'],
  'color-backdrop': ['#000000/0.5', '#000000/0.5'],
  'color-table-head-bg': ['#F5F5F5', '#1E1E1E'],
  'color-table-head-text': ['#6F7173', '#A0A4AB'],
  'color-table-row': ['#FFFFFF', '#161616'],
  'color-table-row-alt': ['#F9F9F9', '#1E1E1E'],
  'color-table-row-hover': ['#ECECEC', '#2A2A2A'],
  'color-icon': ['#000000/0.54', '#FFFFFF'],
  'color-icon-muted': ['#6F7173', '#8A8D92'],
  'color-edge-fade-tint': ['#2477FF/0.06', '#3F76D6/0.06'],
  'level-critical': ['#F26D43', '#D36A4D'],
  'level-watch': ['#FFB443', '#C08E32'],
  'level-monitoring': ['#2477FF', '#3F76D6'],
  'level-capacityWatch': ['#FFB443', '#C08E32'],
  'level-ready': ['#4FCF8E', '#3FA36F'],
  'level-normal': ['#4FCF8E', '#3FA36F'],
  'level-onTarget': ['#4FCF8E', '#3FA36F'],
  'level-routine': ['#4FCF8E', '#3FA36F'],
  'level-resolved': ['#999DA6', '#6F747C'],
};

// Feature Dossier 06 §3.1 token names.
const TOKEN_NAMES = [
  ...Object.keys(CLASSIC).filter((name) => name.startsWith('color-')),
  'color-alert-surface',
  'color-focus',
  'shadow-card',
  'shadow-card-hover',
  'shadow-sticky',
  'shadow-pill',
  'shadow-pill-hover',
  'shadow-tooltip',
  'shadow-dialog',
  'shadow-floating',
  'radius-card',
  'radius-pill',
  'radius-button',
  'radius-tooltip',
  'radius-dialog',
  'radius-table',
  'radius-grid',
  'font-family',
  'font-family-display',
  ...[
    'card-title',
    'card-body',
    'suggestion',
    'pill',
    'nav',
    'count',
    'section-title',
    'section-range',
    'empty',
    'hour',
    'now',
    'more',
    'tooltip',
    'dialog-title',
    'table-head',
    'table-cell',
  ].flatMap((style) => ['size', 'line', 'weight'].map((part) => `text-${style}-${part}`)),
  'gutter-width',
  'lane-padding',
  'card-gap',
  'pill-height',
  'more-height',
  'rail-width',
  'edge-fade-width',
  'sticky-bottom-list',
  'sticky-bottom-timeline',
  'grid-pad-top',
  'grid-pad-bottom',
  'now-line',
  'focus-width',
  'focus-offset',
  'card-padding',
  'card-rail-gap',
  'list-gap',
  'chip-width-lg',
  'chip-width-md',
  'chip-width-sm',
  'duration-fast',
  'duration-base',
  'duration-chip',
  'ease-standard',
  'ease-chip',
  'level-fallback',
  'level-fallback-on',
];

function luminance(hex: string): number {
  const channel = (i: number): number => {
    const value = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a: string, b: string): number {
  const [light, darkLum] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (darkLum + 0.05);
}

describe('tokens.css', () => {
  it('defines every token of Feature Dossier 06 §3.1', () => {
    for (const name of TOKEN_NAMES) expect(base.has(`--rs-${name}`), name).toBe(true);
  });

  it('uses the classic light and dark values of Feature Dossier 02 §1', () => {
    for (const [name, [light, darkValue]] of Object.entries(CLASSIC)) {
      expect(colour(themes.classicLight.get(`--rs-${name}`) ?? ''), `${name} light`).toBe(light);
      expect(colour(themes.classicDark.get(`--rs-${name}`) ?? ''), `${name} dark`).toBe(darkValue);
    }
  });

  it('gives classic level pills the measured text colours (01 §2.2)', () => {
    const on = (theme: Map<string, string>, key: string): string => colour(theme.get(`--rs-level-${key}-on`) ?? '');
    for (const key of ['watch', 'capacityWatch']) expect(on(themes.classicLight, key)).toBe('#000000');
    for (const key of ['critical', 'monitoring', 'ready', 'normal', 'onTarget', 'routine', 'resolved']) {
      expect(on(themes.classicLight, key)).toBe('#FFFFFF');
    }
  });

  it('applies the default preset fixes of Feature Dossier 06 §3', () => {
    const get = (theme: Map<string, string>, name: string): string => colour(theme.get(`--rs-${name}`) ?? '');
    expect(themes.defaultLight.get('--rs-font-family')).not.toContain('Inter');
    expect(themes.defaultLight.get('--rs-font-family-display')).toBe('var(--rs-font-family)');
    expect([get(themes.defaultLight, 'color-accent'), get(themes.defaultDark, 'color-accent')]).toEqual([
      '#141414',
      '#F2F2F2',
    ]);
    expect([get(themes.defaultLight, 'color-on-accent'), get(themes.defaultDark, 'color-on-accent')]).toEqual([
      '#FFFFFF',
      '#000000',
    ]);
    expect([get(themes.defaultLight, 'color-focus'), get(themes.defaultDark, 'color-focus')]).toEqual([
      '#141414',
      '#FFFFFF',
    ]);
    expect([
      get(themes.defaultLight, 'color-alert-text-muted'),
      get(themes.defaultDark, 'color-alert-text-muted'),
    ]).toEqual(['#6E4436', '#C99A89']);
    expect([get(themes.defaultLight, 'color-now'), get(themes.defaultDark, 'color-now')]).toEqual([
      '#6B6F78',
      '#999DA6',
    ]);
    expect(get(themes.defaultDark, 'level-resolved')).toBe('#7A7F88');
    for (const key of [
      'critical',
      'watch',
      'monitoring',
      'capacityWatch',
      'ready',
      'normal',
      'onTarget',
      'routine',
      'resolved',
    ]) {
      expect(get(themes.defaultLight, `level-${key}-on`), key).toBe('#000000');
    }
  });

  it('[B-19] meets WCAG 2.2 AA contrast in the default preset, light and dark', () => {
    for (const [name, theme] of [
      ['light', themes.defaultLight],
      ['dark', themes.defaultDark],
    ] as const) {
      const get = (token: string): string => colour(theme.get(`--rs-${token}`) ?? '');
      const pairs: [string, string, string, number][] = [
        ['now label', get('color-text-inverse'), get('color-now'), 4.5],
        ['scroll-to-top icon', get('color-on-accent'), get('color-accent'), 3],
        ['accent on background', get('color-accent'), get('color-bg'), 3],
        ['focus ring on surface', get('color-focus'), get('color-surface'), 3],
        ['muted text on surface', get('color-text-muted'), get('color-surface'), 4.5],
        ['muted text on the alert tint', get('color-alert-text-muted'), name === 'light' ? '#F8B6A1' : '#5C2410', 4.5],
        ...[
          'critical',
          'watch',
          'monitoring',
          'capacityWatch',
          'ready',
          'normal',
          'onTarget',
          'routine',
          'resolved',
        ].map((key): [string, string, string, number] => [
          `${key} pill`,
          get(`level-${key}-on`),
          get(`level-${key}`),
          4.5,
        ]),
      ];
      for (const [label, foreground, background, minimum] of pairs) {
        expect(contrast(foreground, background), `${name}: ${label}`).toBeGreaterThanOrEqual(minimum);
      }
    }
  });

  it('documents the classic shortfalls instead of fixing them (B-19, Q-09)', () => {
    const get = (token: string): string => colour(themes.classicDark.get(`--rs-${token}`) ?? '');
    expect(contrast(get('color-accent'), get('color-bg'))).toBeLessThan(3);
  });
});
