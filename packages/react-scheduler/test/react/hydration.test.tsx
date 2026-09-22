// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ListView, Scheduler, TimelineView } from '../../src/index';
import { fixture } from '../parity/adapter';
import { setupComponentEnvironment } from '../support/react';

// Hydration without warnings (Feature Dossier 05 F-28): supplying `now` makes the output deterministic.
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const base = { items: baseline.items, date: baseline.date, now: baseline.now };

describe('hydration', () => {
  it.each([
    ['list', <ListView key="l" {...base} />],
    ['timeline', <TimelineView key="t" {...base} />],
    ['scheduler', <Scheduler key="s" {...base} view="timeline" id="fixed" />],
  ])('hydrates the %s without errors or warnings', (_name, element) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.append(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    act(() => {
      root = hydrateRoot(container, element, { onRecoverableError: (cause) => console.error(cause) });
    });
    expect(error.mock.calls).toEqual([]);
    expect(warn.mock.calls).toEqual([]);
    act(() => root?.unmount());
    container.remove();
    error.mockRestore();
    warn.mockRestore();
  });
});
