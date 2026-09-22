// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { ListView, TimelineView } from '../../src/index';
import { fixture } from '../parity/adapter';
import { renderUi, setupComponentEnvironment } from '../support/react';

// Structural accessibility (Feature Dossier 05 F-18): axe in jsdom checks the rules that need no
// layout; contrast and visibility rules run in the browser suite.
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const base = { items: baseline.items, date: baseline.date, now: '2031-03-12T10:41:00' };

async function audit(context: Element): Promise<string[]> {
  vi.useRealTimers();
  const result = await axe.run(context, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    resultTypes: ['violations'],
  });
  return result.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

async function flushLazy(): Promise<void> {
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

describe('structural accessibility', () => {
  it('the list view has no violations, with a detail dialog open too', async () => {
    const { container } = renderUi(<ListView {...base} aria-label="Agenda" />);
    expect(await audit(container)).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Server room alert' }));
    await flushLazy();
    expect(await audit(document.body)).toEqual([]);
  });

  it('the timeline view has no violations, with the overflow dialog open too', async () => {
    const { container } = renderUi(<TimelineView {...base} aria-label="Agenda" />);
    expect(await audit(container)).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: /more items from/ }));
    await flushLazy();
    expect(await audit(document.body)).toEqual([]);
  });

  it('the empty, loading and error states have no violations', async () => {
    for (const element of [
      <ListView key="e" items={[]} date={base.date} now={base.now} />,
      <TimelineView key="l" {...base} loading />,
      <ListView key="x" {...base} error="failed" onRetry={() => undefined} />,
    ]) {
      const { container, unmount } = renderUi(element);
      expect(await audit(container)).toEqual([]);
      unmount();
    }
  });
});
