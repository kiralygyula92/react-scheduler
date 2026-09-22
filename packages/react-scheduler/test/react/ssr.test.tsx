import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ListView, Scheduler, TimelineView } from '../../src/index';
import { fixture } from '../parity/adapter';

// SSR safety (Feature Dossier 05 F-28, docs pack 09 §4.5): every component renders in plain Node with
// no DOM; the server output has compact off, nothing pinned and the header expanded.
const baseline = fixture('baseline-day');
const base = { items: baseline.items, date: baseline.date, now: baseline.now };

describe('server rendering', () => {
  it('renders every view without a DOM', () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    for (const element of [
      <Scheduler key="s" {...base} />,
      <Scheduler key="t" {...base} view="timeline" />,
      <Scheduler key="k" {...base} keepInactiveViewMounted />,
      <ListView key="l" {...base} />,
      <TimelineView key="v" {...base} />,
      <ListView key="e" items={[]} date={baseline.date} now={baseline.now} />,
      <TimelineView key="w" {...base} loading />,
      <ListView key="x" {...base} error="failed" onRetry={() => undefined} />,
      <Scheduler key="n" items={baseline.items} />,
    ]) {
      expect(() => renderToString(element)).not.toThrow();
    }
  });

  it('renders compact off, an empty pinned strip and an expanded header', () => {
    const html = renderToString(
      <ListView {...base} renderHeader={(ctx) => <span>{ctx.expanded ? 'expanded' : 'collapsed'}</span>} />,
    );
    expect(html).not.toContain('data-rs-compact');
    expect(html).toContain('data-rs-empty');
    expect(html).not.toContain('rs-pinned-chip');
    expect(html).toContain('expanded');
    expect(html).toContain('data-rs-size="lg"');
  });
});
