// Browser-test helpers: mount into a sized host, wait for frames and real scrolling, load fixtures.
import '../../src/styles/index.css';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import baselineFile from '../../../../spec/feature-dossier/characterization/fixtures/baseline-day.json';
import emptyFile from '../../../../spec/feature-dossier/characterization/fixtures/empty.json';
import largeFile from '../../../../spec/feature-dossier/characterization/fixtures/large.json';
import pastFile from '../../../../spec/feature-dossier/characterization/fixtures/past-date.json';
import pinnedManyFile from '../../../../spec/feature-dossier/characterization/fixtures/pinned-many.json';
import sparseFile from '../../../../spec/feature-dossier/characterization/fixtures/sparse.json';
import crowdedFile from '../../../../spec/feature-dossier/characterization/fixtures/crowded.json';
import { type Fixture, type FixtureFile, toFixture } from '../support/items';

export const fixtures: Record<string, Fixture> = {
  baseline: toFixture(baselineFile as FixtureFile),
  empty: toFixture(emptyFile),
  large: toFixture(largeFile as FixtureFile),
  past: toFixture(pastFile as FixtureFile),
  pinnedMany: toFixture(pinnedManyFile as FixtureFile),
  sparse: toFixture(sparseFile as FixtureFile),
  crowded: toFixture(crowdedFile as FixtureFile),
};

export interface Mounted {
  host: HTMLElement;
  rerender: (ui: ReactElement) => void;
  unmount: () => void;
}

const mounted = new Set<Mounted>();

/** Renders `ui` into a host of the given size at the page's top left. */
export function mount(
  ui: ReactElement,
  size: { width: number; height: number } = { width: 1440, height: 900 },
): Mounted {
  document.body.style.margin = '0';
  const host = document.createElement('div');
  host.style.cssText = `position:absolute;inset-block-start:0;inset-inline-start:0;width:${size.width}px;height:${size.height}px;`;
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  const handle: Mounted = {
    host,
    rerender: (next) => flushSync(() => root.render(next)),
    unmount: () => {
      root.unmount();
      host.remove();
      mounted.delete(handle);
    },
  };
  mounted.add(handle);
  return handle;
}

export function unmountAll(): void {
  for (const handle of [...mounted]) handle.unmount();
}

export function frames(count = 1): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number): void => {
      if (left === 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolves once `check()` holds (polled every frame), or rejects after `timeout` ms. */
export async function until(check: () => boolean, timeout = 3000, what = 'condition'): Promise<void> {
  const deadline = performance.now() + timeout;
  while (!check()) {
    if (performance.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frames(1);
  }
}

/**
 * Resolves once the view has landed and settled: its visible scroller exists, has not moved for 15
 * frames and at least `minimum` ms have passed (the navigator's correction and resume delays).
 */
export async function settled(host: HTMLElement, minimum = 400, timeout = 8000): Promise<HTMLElement> {
  const started = performance.now();
  let last = Number.NaN;
  let still = 0;
  while (performance.now() - started < timeout) {
    await frames(1);
    const scroller = host.querySelector<HTMLElement>('[data-rs-part="scroller"]:not([hidden] *)');
    if (!scroller) continue;
    still = scroller.scrollTop === last ? still + 1 : 0;
    last = scroller.scrollTop;
    if (still >= 15 && performance.now() - started >= minimum) return scroller;
  }
  throw new Error('timed out waiting for the view to settle');
}

/** Sets scrollTop and waits for the scroll event, the observers and the evaluation frame. */
export async function scrollTo(element: HTMLElement, top: number): Promise<void> {
  element.scrollTop = top;
  await frames(3);
}

export function part(root: ParentNode, name: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(`[data-rs-part="${name}"]`);
  if (!element) throw new Error(`no part ${name}`);
  return element;
}

export function parts(root: ParentNode, name: string): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[data-rs-part="${name}"]`)];
}

export function nav(root: ParentNode, position: 'top' | 'bottom'): HTMLElement | undefined {
  return parts(root, 'navButton').find((button) => button.dataset['rsPosition'] === position);
}

export function chipTitles(root: ParentNode): string[] {
  return parts(root, 'pinnedChip').map((chip) => part(chip, 'cardTitle').textContent ?? '');
}

export function cardByTitle(root: ParentNode, title: string, view: 'listCard' | 'timelineCard'): HTMLElement {
  const card = parts(root, view).find((candidate) => part(candidate, 'cardTitle').textContent === title);
  if (!card) throw new Error(`no card ${title}`);
  return card;
}
