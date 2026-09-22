import { commands, page, server } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import dark from '../../../../../spec/feature-dossier/characterization/measured-styles.dark.json';
import light from '../../../../../spec/feature-dossier/characterization/measured-styles.light.json';
import { unmountAll } from '../support';
import { compareElement, type Difference, type Measured } from './compare';
import { SCENES } from './targets';

// VIS-light / VIS-dark: the computed styles of every measured part, classic preset, compared with the
// characterization's measurements (Feature Dossier 07 §1.4). This is the rasterizer-independent half
// of visual parity; the screenshots are the other half. Chromium only: the references were measured
// there, and text metrics differ slightly between engines.

type Scheme = 'light' | 'dark';

const MEASURED: Record<Scheme, Record<string, Record<string, Measured>>> = {
  light: light as unknown as Record<string, Record<string, Measured>>,
  dark: dark as unknown as Record<string, Record<string, Measured>>,
};

/** Parts the new markup does not have: the source drew the first and last hour lines transparent. */
const NOT_RENDERED = new Set(['timeline/grid.hourLine.edge']);

/**
 * Differences that remain by decision (docs/adr/0003-react-adapter.md, "Visual parity"); anything else
 * fails the gate.
 */
const KNOWN: readonly string[] = [];

/** Moves the pointer to the page's top-left corner, so no part is measured hovered. */
async function parkPointer(): Promise<void> {
  await page.elementLocator(document.body).hover({ position: { x: 0, y: 0 } });
}

/** Hover and focus states measured on their own. */
async function states(scheme: Scheme): Promise<Difference[]> {
  const measured = MEASURED[scheme];
  const differences: Difference[] = [];
  const { listTargets } = await import('./targets');
  const targets = await listTargets(scheme);
  const card = targets['listCard.root']?.element as HTMLElement;
  const push = (key: string, property: string, want: unknown, actual: string): void => {
    if (String(want) !== actual) differences.push({ key, property, expected: String(want), actual });
  };
  const normalizeShadow = (value: string): string =>
    value.replace(/rgba?\(([^)]*)\)/g, (_match, parts: string) => {
      const [r, g, b, a] = parts.split(',').map((part) => Number(part.trim()));
      const hex = [r, g, b].map((channel) => (channel ?? 0).toString(16).padStart(2, '0').toUpperCase()).join('');
      return a === undefined || a === 1 ? `#${hex}` : `#${hex}/${a}`;
    });
  await page.elementLocator(card).hover();
  await new Promise((resolve) => setTimeout(resolve, 250));
  push(
    'listCard.root:hover',
    'boxShadow',
    measured['listCard.root:hover'],
    normalizeShadow(getComputedStyle(card).boxShadow),
  );
  await parkPointer();
  const activator = targets['listCard.button']?.element as HTMLElement;
  activator.focus({ focusVisible: true });
  const focus = measured['listCard.button:focus-visible'] as unknown as { outline: string; outlineOffset: string };
  // The ring is drawn on the card around the activator (06 §2), in the level color (classic).
  const ring = getComputedStyle(card);
  push(
    'listCard.button:focus-visible',
    'outline',
    focus.outline,
    `${ring.outlineWidth} ${ring.outlineStyle} ${normalizeShadow(ring.outlineColor)}`,
  );
  push('listCard.button:focus-visible', 'outlineOffset', focus.outlineOffset, getComputedStyle(card).outlineOffset);

  const outline = (key: string, element: HTMLElement, ringOn: HTMLElement = element): void => {
    element.focus({ focusVisible: true });
    const want = measured[key] as unknown as { outline: string; outlineOffset: string };
    const style = getComputedStyle(ringOn);
    push(
      key,
      'outline',
      want.outline,
      `${style.outlineWidth} ${style.outlineStyle} ${normalizeShadow(style.outlineColor)}`,
    );
    push(key, 'outlineOffset', want.outlineOffset, style.outlineOffset);
    element.blur();
  };
  const chip = targets['pinnedChip.root']?.element as HTMLElement;
  outline('pinnedChip.root:focus-visible', chip);

  // Hovering the bottom button: its colors, then its tooltip (arrow color and the 14 px gap).
  const bottom = targets['navBottom.button']?.element as HTMLElement;
  await page.elementLocator(bottom).hover();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const hovered = measured['navBottom.button:hover'] as unknown as { backgroundColor: string; borderColor: string };
  push(
    'navBottom.button:hover',
    'backgroundColor',
    hovered.backgroundColor,
    normalizeShadow(getComputedStyle(bottom).backgroundColor),
  );
  push(
    'navBottom.button:hover',
    'borderColor',
    hovered.borderColor,
    normalizeShadow(getComputedStyle(bottom).borderTopColor),
  );
  const tooltip = document.getElementById(bottom.getAttribute('aria-describedby') ?? '') as HTMLElement;
  const tip = getComputedStyle(tooltip);
  const wantTip = measured['tooltip'] as unknown as Record<string, string | number>;
  const actualTip: Record<string, string> = {
    backgroundColor: normalizeShadow(tip.backgroundColor),
    color: normalizeShadow(tip.color),
    borderRadius: tip.borderRadius,
    padding: tip.padding,
    maxWidth: tip.maxWidth,
    fontSize: tip.fontSize,
    fontWeight: tip.fontWeight,
    lineHeight: tip.lineHeight,
    boxShadow: normalizeShadow(tip.boxShadow),
    fontFamily: tip.fontFamily.replace(/"/g, ''),
    arrowColor: normalizeShadow(getComputedStyle(tooltip, '::after').borderTopColor),
    gap: String(Math.round(bottom.getBoundingClientRect().top - tooltip.getBoundingClientRect().bottom)),
  };
  for (const [property, value] of Object.entries(actualTip)) {
    const want = String(wantTip[property]).replace(/"/g, '');
    push('tooltip', property, want, value);
  }
  await parkPointer();
  unmountAll();

  const { timelineTargets } = await import('./targets');
  const timeline = await timelineTargets(scheme);
  const more = timeline['moreChip.root']?.element as HTMLElement;
  await page.elementLocator(more).hover();
  await new Promise((resolve) => setTimeout(resolve, 400));
  const moreShadow = normalizeShadow(getComputedStyle(more).boxShadow);
  // The hover states are recorded as a bare box-shadow string.
  const wantMore = measured['moreChip.root:hover'] as unknown as string;
  if (!closeShadow(wantMore, moreShadow)) push('moreChip.root:hover', 'boxShadow', wantMore, moreShadow);
  await parkPointer();
  outline('moreChip.root:focus-visible', more);
  const timelineCard = timeline['timelineCard.root']?.element as HTMLElement;
  outline(
    'timelineCard.root:focus-visible',
    timelineCard.querySelector('.rs-card-activator') as HTMLElement,
    timelineCard,
  );
  unmountAll();
  return differences;
}

/**
 * Two shadows equal within the precision of a snapshot taken during a transition (the source's
 * "+more" hover was recorded 1–2 % short of its end values): numbers within 5 %, channels within 3.
 */
function closeShadow(want: string, actual: string): boolean {
  const tokens = (text: string): string[] => text.split(/[\s,/#]+/).filter(Boolean);
  const a = tokens(want);
  const b = tokens(actual);
  if (a.length !== b.length) return false;
  return a.every((token, index) => {
    const other = b[index] as string;
    if (/^[0-9A-F]{6}$/.test(token) && /^[0-9A-F]{6}$/.test(other)) {
      return [0, 2, 4].every(
        (at) => Math.abs(parseInt(token.slice(at, at + 2), 16) - parseInt(other.slice(at, at + 2), 16)) <= 3,
      );
    }
    const x = Number.parseFloat(token);
    const y = Number.parseFloat(other);
    if (Number.isNaN(x) || Number.isNaN(y)) return token === other;
    return Math.abs(x - y) <= Math.max(0.05, Math.abs(x) * 0.05);
  });
}

async function compareScheme(scheme: Scheme): Promise<string[]> {
  const measured = MEASURED[scheme];
  const report: Difference[] = [];
  await parkPointer();
  for (const [scene, build] of Object.entries(SCENES)) {
    if (scene === 'listCompact') await page.viewport(390, 844);
    try {
      const targets = await build(scheme);
      for (const [key, values] of Object.entries(measured[scene] ?? {})) {
        if (NOT_RENDERED.has(`${scene}/${key}`)) continue;
        const target = targets[key];
        if (!target) {
          report.push({ key: `${scene}/${key}`, property: '(part)', expected: 'mapped', actual: 'missing' });
          continue;
        }
        report.push(
          ...compareElement(`${scene}/${key}`, target.element, values, {
            text: target.text ?? false,
            sizes: target.sizes ?? ['height'],
            ...(target.pseudo ? { pseudo: target.pseudo } : {}),
            ...(target.skip ? { skip: target.skip } : {}),
          }),
        );
      }
    } finally {
      unmountAll();
      if (scene === 'listCompact') await page.viewport(1440, 900);
    }
  }
  report.push(...(await states(scheme)));
  await commands.writeFile(`test-results/vis-${scheme}.json`, JSON.stringify(report, null, 2));
  return report
    .map((difference) => `${difference.key} ${difference.property}`)
    .filter((entry) => !KNOWN.includes(entry));
}

afterEach(() => {
  unmountAll();
});

describe.runIf(server.browser === 'chromium')('computed-style parity (classic preset)', () => {
  it('[VIS-light] every measured part matches the light measurements', async () => {
    expect(await compareScheme('light')).toEqual([]);
  });

  it('[VIS-dark] every measured part matches the dark measurements', async () => {
    expect(await compareScheme('dark')).toEqual([]);
  });
});
