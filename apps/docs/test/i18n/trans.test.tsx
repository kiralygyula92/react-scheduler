// SPDX-License-Identifier: MIT
// The inline-tag whitelist (docs pack 11 §9): six tags, nothing else, and a translation that tries
// anything more fails loudly instead of rendering markup nobody reviewed.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '~/i18n/I18nProvider';
import { Trans, tokenize } from '~/i18n/Trans';

const messages = {
  plain: 'Shifts are grouped by day.',
  strong: 'The default is <strong>list</strong>.',
  code: 'Pass <code>compact</code> to shrink the cards.',
  kbd: 'Press <kbd>Esc</kbd> to close.',
  internal: 'See <link to="/pinning/">pinning</link>.',
  external: 'Read the <ext href="https://react.dev/">React documentation</ext>.',
  mixed: 'Set <code>view</code> in <link to="/scheduler-and-views/">the scheduler</link>.',
  script: 'Careful <script>alert(1)</script>.',
  span: 'Careful <span>text</span>.',
  linkWithoutTarget: 'See <link>pinning</link>.',
};

function renderMessage(key: keyof typeof messages): void {
  render(
    <MemoryRouter>
      <I18nProvider
        value={{ locale: 'ro', bundles: { common: { shell: { externalLink: '(legătură externă)' } }, page: messages } }}
      >
        <Trans k={key} ns="page" />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('tokenize', () => {
  it('returns one text token for a message without markup', () => {
    expect(tokenize(messages.plain)).toEqual([{ text: messages.plain }]);
  });

  it('splits text around a tag', () => {
    expect(tokenize(messages.strong)).toEqual([
      { text: 'The default is ' },
      { tag: 'strong', text: 'list' },
      { text: '.' },
    ]);
  });

  it('keeps the link target', () => {
    expect(tokenize(messages.internal)[1]).toEqual({ tag: 'link', attribute: '/pinning/', text: 'pinning' });
  });

  it('rejects any other tag', () => {
    expect(() => tokenize(messages.script)).toThrow(/<script>, which is not allowed/);
    expect(() => tokenize(messages.span)).toThrow(/<span>, which is not allowed/);
  });

  it('rejects a link without a target', () => {
    expect(() => tokenize(messages.linkWithoutTarget)).toThrow(/needs a to attribute/);
  });
});

describe('Trans', () => {
  it('renders the whitelisted elements', () => {
    renderMessage('code');
    expect(screen.getByText('compact').tagName).toBe('CODE');
  });

  it('builds internal links for the current locale', () => {
    renderMessage('internal');
    expect(screen.getByRole('link', { name: 'pinning' })).toHaveProperty('pathname', '/react-scheduler/ro/pinning/');
  });

  it('marks external links for assistive technology and opens them safely', () => {
    renderMessage('external');
    const link = screen.getByRole('link', { name: 'React documentation (legătură externă)' });
    expect(link.getAttribute('rel')).toBe('noreferrer');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('renders several tags in one message', () => {
    renderMessage('mixed');
    expect(screen.getByText('view').tagName).toBe('CODE');
    expect(screen.getByRole('link', { name: 'the scheduler' })).toBeDefined();
  });
});
