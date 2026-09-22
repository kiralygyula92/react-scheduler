import axe from 'axe-core';
import { page, userEvent } from 'vitest/browser';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ListView, type SchedulerProps, TimelineView } from '../../src/index';
import type { ParityItem } from '../support/items';
import { cardByTitle, fixtures, mount, part, settled, unmountAll, until, wait } from './support';

// Accessibility in real layout (Feature Dossier 09 §1): axe with the contrast rules, both presets,
// both schemes, every view and state. The default preset has no violations; classic may only show
// the contrast shortfalls documented as B-19 (07), which it keeps for pixel parity.

type Preset = 'default' | 'classic';
type Scheme = 'light' | 'dark';

interface Finding {
  rule: string;
  part: string;
  /** Inside a pinned chip or an alert-variant card (the alert tint). */
  alert: boolean;
  ratio: number | undefined;
  text: string;
}

/**
 * The classic shortfalls kept for pixel parity: B-19 (07; 06 §3), and two more this suite found in the
 * classic light colors, recorded as GAPS G10.
 */
function documented(finding: Finding, scheme: Scheme): boolean {
  if (finding.rule !== 'color-contrast') return false;
  // B-19: white text on light level pills; muted text on the alert tint; the light now label.
  if (finding.part === 'levelPill' || finding.alert) return true;
  if (finding.part === 'nowLabel') return scheme === 'light';
  // G10: the carried-over count (level critical on the nav button) and the table head text.
  return scheme === 'light' && (finding.part === 'carriedOverCount' || finding.part === 'overflowTable');
}

const baseline = fixtures['baseline'] as NonNullable<(typeof fixtures)['baseline']>;

function props(preset: Preset, scheme: Scheme): SchedulerProps<ParityItem> {
  return { items: baseline.items, date: baseline.date, now: baseline.now, preset, colorScheme: scheme };
}

/** The consumer page behind the component follows the scheme, as in the references. */
function pageBackground(scheme: Scheme): void {
  document.body.style.background = scheme === 'dark' ? '#121212' : '#FFFFFF';
}

async function audit(context: Element): Promise<Finding[]> {
  const result = await axe.run(context, {
    resultTypes: ['violations'],
    // A component, not a page: landmarks are the host page's concern.
    rules: { region: { enabled: false } },
  });
  return result.violations.flatMap((violation) =>
    violation.nodes.map((node) => {
      const element = document.querySelector(String(node.target[0]));
      const owner = element?.closest<HTMLElement>('[data-rs-part]');
      const data = node.any[0]?.data as { contrastRatio?: number } | undefined;
      return {
        rule: violation.id,
        part: owner?.dataset['rsPart'] ?? 'unknown',
        alert: element?.closest('[data-rs-part="pinnedChip"], [data-rs-variant="alert"]') != null,
        ratio: data?.contrastRatio,
        text: (element?.textContent ?? '').trim().slice(0, 40),
      };
    }),
  );
}

interface Scene {
  name: string;
  viewport?: [number, number];
  render: (preset: Preset, scheme: Scheme) => Promise<HTMLElement>;
}

async function landed(ui: ReactElement, size?: [number, number]): Promise<HTMLElement> {
  const { host } = mount(ui, size ? { width: size[0], height: size[1] } : undefined);
  await settled(host, 500);
  return host;
}

const SCENES: Scene[] = [
  { name: 'list', render: (preset, scheme) => landed(<ListView {...props(preset, scheme)} />) },
  {
    name: 'compact list',
    viewport: [390, 844],
    render: (preset, scheme) => landed(<ListView {...props(preset, scheme)} />, [390, 844]),
  },
  { name: 'timeline', render: (preset, scheme) => landed(<TimelineView {...props(preset, scheme)} />) },
  {
    name: 'overflow dialog',
    render: async (preset, scheme) => {
      const host = await landed(<TimelineView {...props(preset, scheme)} />);
      await userEvent.click(part(host, 'moreChip'));
      await until(() => document.querySelector('dialog[open]') !== null, 5000, 'overflow dialog');
      await wait(300);
      return host;
    },
  },
  {
    name: 'detail dialog',
    render: async (preset, scheme) => {
      const host = await landed(<ListView {...props(preset, scheme)} />);
      await userEvent.click(part(cardByTitle(host, 'Server room alert', 'listCard'), 'cardActivator'));
      await until(() => document.querySelector('dialog[open]') !== null, 5000, 'detail dialog');
      await wait(300);
      return host;
    },
  },
  {
    name: 'empty',
    render: (preset, scheme) => landed(<ListView {...props(preset, scheme)} items={[]} />),
  },
  {
    name: 'loading',
    render: async (preset, scheme) => {
      const { host } = mount(<TimelineView {...props(preset, scheme)} loading />);
      await wait(300);
      return host;
    },
  },
  {
    name: 'error',
    render: async (preset, scheme) => {
      const { host } = mount(<ListView {...props(preset, scheme)} error="failed" onRetry={() => undefined} />);
      await wait(300);
      return host;
    },
  },
];

afterEach(async () => {
  unmountAll();
  document.body.style.background = '';
  await page.viewport(1440, 900);
});

const CASES = (['default', 'classic'] as const).flatMap((preset) =>
  (['light', 'dark'] as const).flatMap((scheme) => SCENES.map((scene) => [preset, scheme, scene] as const)),
);

describe('accessibility in the browser', () => {
  it.each(
    CASES.map(([preset, scheme, scene]) => [`${preset} ${scheme} ${scene.name}`, preset, scheme, scene] as const),
  )('%s', async (_name, preset, scheme, scene) => {
    const [width, height] = scene.viewport ?? [1440, 900];
    await page.viewport(width, height);
    pageBackground(scheme);
    const host = await scene.render(preset, scheme);
    const findings = await audit(host);
    expect(preset === 'default' ? findings : findings.filter((finding) => !documented(finding, scheme))).toEqual([]);
  });
});
