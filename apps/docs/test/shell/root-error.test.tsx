// SPDX-License-Identifier: MIT
// A page that throws while rendering takes the shell with it. What is left has to read like a page:
// a heading in the reader's language, a sentence, and a way back — not a bare status code.
import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../../src/root';

function Broken(): React.ReactElement {
  throw new Error('a page that cannot render');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('root ErrorBoundary', () => {
  it.each([
    ['/react-scheduler/de/pinning/', 'Diese Seite konnte nicht angezeigt werden', '/react-scheduler/de/'],
    ['/react-scheduler/pinning/', 'This page could not be shown', '/react-scheduler/'],
  ])('at %s shows a page in its language with a link home', async (path, heading, home) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Stub = createRoutesStub([{ path, Component: Broken, ErrorBoundary }]);
    render(<Stub initialEntries={[path]} />);
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe(heading);
    expect(screen.getByRole('link').getAttribute('href')).toBe(home);
  });
});
