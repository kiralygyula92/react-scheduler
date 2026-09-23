// SPDX-License-Identifier: MIT
// The generated member table (docs pack 05 §4): every row addressable, required and deprecated
// members marked, a long type folded away, and the inline code spans of TSDoc rendered as code.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '~/i18n/I18nProvider';
import { Inline } from '~/shell/doc/Inline';
import { type ApiProp, PropsTable } from '~/shell/doc/PropsTable';
import api from '~/locales/en/api.json';
import common from '~/locales/en/common.json';

const MEMBERS: readonly ApiProp[] = [
  { name: 'id', type: 'string', required: true, descriptionKey: 'SchedulerItem.props.id' },
  {
    name: 'compareItems',
    type: '((a: SchedulerItem, b: SchedulerItem) => number) | undefined | null',
    default: '`compareByPlacement`',
    descriptionKey: 'SchedulerOptions.props.compareItems',
  },
  { name: 'legacy', type: 'boolean', deprecated: 'Use `flags` instead.', descriptionKey: 'missing.key' },
];

function renderTable(members: readonly ApiProp[] = MEMBERS): void {
  render(
    <MemoryRouter>
      <I18nProvider value={{ locale: 'en', bundles: { common, api } }}>
        <PropsTable members={members} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('PropsTable', () => {
  it('renders nothing when the symbol has no members', () => {
    const { container } = render(
      <MemoryRouter>
        <I18nProvider value={{ locale: 'en', bundles: { common, api } }}>
          <PropsTable members={[]} />
        </I18nProvider>
      </MemoryRouter>,
    );
    expect(container.querySelector('table')).toBeNull();
  });

  it('gives every row the anchor the reference links to', () => {
    const { container } = render(
      <MemoryRouter>
        <I18nProvider value={{ locale: 'en', bundles: { common, api } }}>
          <PropsTable members={MEMBERS} />
        </I18nProvider>
      </MemoryRouter>,
    );
    expect(container.querySelector('#prop-id')).not.toBeNull();
    expect(container.querySelector('#prop-compareItems')).not.toBeNull();
  });

  it('marks a required member and strikes a deprecated one through', () => {
    const { container } = render(
      <MemoryRouter>
        <I18nProvider value={{ locale: 'en', bundles: { common, api } }}>
          <PropsTable members={MEMBERS} />
        </I18nProvider>
      </MemoryRouter>,
    );
    expect(container.querySelector('#prop-id')?.textContent).toContain(common.shell.required);
    expect(container.querySelector('#prop-legacy del')?.textContent).toBe('legacy');
  });

  it('folds a type that would push the other columns out of view', () => {
    renderTable();
    expect(screen.getByRole('button', { name: common.code.expand })).toBeDefined();
    expect(screen.queryByText(MEMBERS[1]?.type ?? '')).toBeNull();
  });

  it('shows the default without the markers the source comment uses', () => {
    const { container } = render(
      <MemoryRouter>
        <I18nProvider value={{ locale: 'en', bundles: { common, api } }}>
          <PropsTable members={MEMBERS} />
        </I18nProvider>
      </MemoryRouter>,
    );
    expect(container.querySelector('#prop-compareItems')?.textContent).toContain('compareByPlacement');
    expect(container.querySelector('#prop-compareItems')?.textContent).not.toContain('`');
  });

  it('keeps a missing description visible so the i18n check can fail on it', () => {
    const { container } = render(
      <MemoryRouter>
        <I18nProvider value={{ locale: 'en', bundles: { common, api } }}>
          <PropsTable members={MEMBERS} />
        </I18nProvider>
      </MemoryRouter>,
    );
    expect(container.querySelector('#prop-legacy')?.textContent).toContain('⟦api:missing.key⟧');
  });
});

describe('Inline', () => {
  it('turns the code spans of TSDoc into code elements', () => {
    const { container } = render(<Inline text="The view, selected by `view`, is `list` by default." />);
    expect([...container.querySelectorAll('code')].map((node) => node.textContent)).toEqual(['view', 'list']);
    expect(container.textContent).toBe('The view, selected by view, is list by default.');
  });

  it('leaves prose without markers alone', () => {
    const { container } = render(<Inline text="Nothing to mark up here." />);
    expect(container.querySelector('code')).toBeNull();
    expect(container.textContent).toBe('Nothing to mark up here.');
  });
});
