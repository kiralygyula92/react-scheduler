// SPDX-License-Identifier: MIT
// The code block's two contracts that are not the highlighter's (docs pack 04 §2): the line-range
// syntax, and the package-manager tab group — one choice, shared by every block on the page and
// remembered for the next visit.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '~/i18n/I18nProvider';
import { Code, highlightedLines } from '~/shell/doc/Code';
import common from '~/locales/en/common.json';

function renderCode(children: React.ReactNode): void {
  render(
    <MemoryRouter>
      <I18nProvider value={{ locale: 'en', bundles: { common } }}>{children}</I18nProvider>
    </MemoryRouter>,
  );
}

describe('highlightedLines', () => {
  it('reads a list of ranges', () => {
    expect(highlightedLines('3-5,9')).toEqual([3, 4, 5, 9]);
    expect(highlightedLines('2')).toEqual([2]);
  });

  it('passes numbers through and tolerates nothing', () => {
    expect(highlightedLines([1, 4])).toEqual([1, 4]);
    expect(highlightedLines(undefined)).toEqual([]);
  });
});

describe('package-manager tabs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the four managers and starts on npm', () => {
    renderCode(
      <Code lang="bash" tabs="pm">
        @react-schedulerkit/react-scheduler
      </Code>,
    );
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['npm', 'pnpm', 'yarn', 'bun']);
    expect(screen.getByRole('tab', { name: 'npm' })).toHaveProperty('ariaSelected', 'true');
    expect(screen.getByRole('tabpanel').textContent).toContain('npm install @react-schedulerkit/react-scheduler');
  });

  it('switches every block on the page at once and remembers the choice', () => {
    const { rerender } = render(
      <MemoryRouter>
        <I18nProvider value={{ locale: 'en', bundles: { common } }}>
          <Code lang="bash" tabs="pm">
            first-package
          </Code>
          <Code lang="bash" tabs="pm">
            second-package
          </Code>
        </I18nProvider>
      </MemoryRouter>,
    );

    const [pnpmTab] = screen.getAllByRole('tab', { name: 'pnpm' });
    pnpmTab?.click();
    rerender(
      <MemoryRouter>
        <I18nProvider value={{ locale: 'en', bundles: { common } }}>
          <Code lang="bash" tabs="pm">
            first-package
          </Code>
          <Code lang="bash" tabs="pm">
            second-package
          </Code>
        </I18nProvider>
      </MemoryRouter>,
    );

    const panels = screen.getAllByRole('tabpanel').map((panel) => panel.textContent);
    expect(panels[0]).toContain('pnpm add first-package');
    expect(panels[1]).toContain('pnpm add second-package');
    expect(localStorage.getItem('ds:pm')).toBe('pnpm');
  });

  it('is a plain block without the tabs', () => {
    renderCode(<Code lang="ts">{'const view = 1;'}</Code>);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByText('const')).toBeDefined();
  });
});
