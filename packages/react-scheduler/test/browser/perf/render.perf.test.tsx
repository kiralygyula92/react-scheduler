import * as React from 'react';
import { createRef, type ReactElement } from 'react';
import { commands } from 'vitest/browser';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { ListView, type SchedulerHandle, type SchedulerProps, TimelineView } from '../../../src/index';
import type { ParityItem } from '../../support/items';
import { fixtures, frames, mount, settled, unmountAll } from '../support';

// Performance budgets (Feature Dossier 09 §3), scenario PERF: React's production build in Chromium,
// no throttling (vitest.perf.config.ts). Every measure is also written to test-results/perf.json.

type View = 'list' | 'timeline';
type FixtureName = 'baseline' | 'large';

const report: Record<string, unknown> = {};

function fixtureProps(name: FixtureName): SchedulerProps<ParityItem> {
  const fixture = fixtures[name] as NonNullable<(typeof fixtures)[FixtureName]>;
  return { items: fixture.items, date: fixture.date, now: fixture.now, preset: 'classic' };
}

function element(
  view: View,
  props: SchedulerProps<ParityItem>,
  ref?: React.Ref<SchedulerHandle<ParityItem>>,
): ReactElement {
  return view === 'list' ? <ListView ref={ref} {...props} /> : <TimelineView ref={ref} {...props} />;
}

function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))] ?? Number.NaN;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** Resolves once the next frame has been produced: its frame callback, then its rendering. */
function nextFrameDone(): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve(performance.now());
      channel.port2.postMessage(null);
    });
  });
}

afterEach(() => {
  unmountAll();
});

afterAll(async () => {
  await commands.writeFile('test-results/perf.json', `${JSON.stringify(report, null, 2)}\n`);
});

describe('performance budgets (Chromium, production React)', () => {
  it('runs on the production build of React', () => {
    // Only React's development build exports act().
    expect('act' in React).toBe(false);
  });

  it.each([
    ['list', 'baseline'],
    ['list', 'large'],
    ['timeline', 'baseline'],
    ['timeline', 'large'],
  ] as const)('[PERF] mount to first frame, %s view, %s fixture, 3 mounts', async (view, name) => {
    const samples: number[] = [];
    for (let run = 0; run < 3; run++) {
      const started = performance.now();
      const { unmount } = mount(element(view, fixtureProps(name)));
      samples.push((await nextFrameDone()) - started);
      unmount();
      await frames(2);
    }
    report[`mount.${view}.${name}`] = { samples: samples.map(round), median: round(percentile(samples, 0.5)) };
    // 09 §3: ≤ 80 ms with 240 items.
    expect(percentile(samples, 0.5)).toBeLessThanOrEqual(80);
  });

  it.each(['list', 'timeline'] as const)(
    '[PERF] scripted scroll of 120 frames, %s view, 240 items: p95 frame ≤ 20 ms, no long task > 50 ms',
    async (view) => {
      const { host } = mount(element(view, fixtureProps('large')));
      const scroller = await settled(host, 500);
      const longTasks: number[] = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) longTasks.push(entry.duration);
      });
      observer.observe({ type: 'longtask' });
      const max = scroller.scrollHeight - scroller.clientHeight;
      const intervals: number[] = [];
      await new Promise<void>((resolve) => {
        let previous: number | undefined;
        let count = 0;
        let direction = -1;
        const step = (time: number): void => {
          if (previous !== undefined) intervals.push(time - previous);
          previous = time;
          if (count++ === 120) {
            resolve();
            return;
          }
          const next = scroller.scrollTop + direction * 60;
          if (next <= 0 || next >= max) direction = -direction;
          scroller.scrollTop = Math.min(max, Math.max(0, next));
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      await frames(3);
      observer.disconnect();
      const p95 = percentile(intervals, 0.95);
      report[`scroll.${view}`] = {
        frames: intervals.length,
        p50: round(percentile(intervals, 0.5)),
        p95: round(p95),
        max: round(Math.max(...intervals)),
        longTasks: longTasks.map(round),
      };
      expect(p95).toBeLessThanOrEqual(20);
      expect(longTasks.filter((duration) => duration > 50)).toEqual([]);
    },
  );

  it.each(['list', 'timeline'] as const)('[PERF] a pin refresh takes ≤ 2 ms, %s view, 240 items', async (view) => {
    const handle = createRef<SchedulerHandle<ParityItem>>();
    const { host } = mount(element(view, fixtureProps('large'), handle));
    await settled(host, 500);
    const samples: number[] = [];
    for (let run = 0; run < 60; run++) {
      const started = performance.now();
      handle.current?.refreshPinning();
      samples.push(performance.now() - started);
      await frames(1);
    }
    report[`pinRefresh.${view}`] = { median: round(percentile(samples, 0.5)), p95: round(percentile(samples, 0.95)) };
    expect(percentile(samples, 0.95)).toBeLessThanOrEqual(2);
  });

  it.each(['list', 'timeline'] as const)('[PERF] a clock tick costs ≤ 1 ms, %s view, 240 items', async (view) => {
    const props = fixtureProps('large');
    const { host, rerender } = mount(element(view, props));
    await settled(host, 500);
    const start = Date.parse(`${props.now as string}Z`);
    const samples: number[] = [];
    for (let tick = 1; tick <= 20; tick++) {
      const now = new Date(start + tick * 60_000).toISOString().slice(0, 19);
      const started = performance.now();
      rerender(element(view, { ...props, now }));
      samples.push(performance.now() - started);
      await frames(1);
    }
    report[`clockTick.${view}`] = { median: round(percentile(samples, 0.5)), p95: round(percentile(samples, 0.95)) };
    expect(percentile(samples, 0.5)).toBeLessThanOrEqual(1);
  });
});
