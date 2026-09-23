// SPDX-License-Identifier: MIT
// The theme editor's data (docs pack 04 §4.7): every token grouped once, and a CSS block that holds
// exactly what the reader changed.
import { describe, expect, it } from 'vitest';
import { asColorInput, families, stylesheet, TOKENS } from '../../src/playground/tokens';

describe('families', () => {
  it('places every token in exactly one family', () => {
    const grouped = families().flatMap((family) => family.tokens);
    expect(grouped).toHaveLength(TOKENS.length);
    expect(new Set(grouped.map((token) => token.name)).size).toBe(TOKENS.length);
  });

  it('keeps the six families of the CSS variables page, plus the layout rest', () => {
    expect(families().map((family) => family.id)).toEqual([
      'color',
      'typography',
      'levels',
      'shape',
      'motion',
      'layout',
    ]);
  });
});

describe('asColorInput', () => {
  it('accepts what a colour input accepts, and expands the short form', () => {
    expect(asColorInput('#fff')).toBe('#ffffff');
    expect(asColorInput('#121212')).toBe('#121212');
    expect(asColorInput('  #AABBCC ')).toBe('#AABBCC');
  });

  it('turns down what it cannot show', () => {
    expect(asColorInput('rgb(0 0 0 / 40%)')).toBeUndefined();
    expect(asColorInput('16px')).toBeUndefined();
    expect(asColorInput('')).toBeUndefined();
  });
});

describe('stylesheet', () => {
  it('writes nothing until something is changed', () => {
    expect(stylesheet({}, 'light')).toBe('');
  });

  it('writes only the changed tokens, in declaration order', () => {
    const css = stylesheet({ '--rs-color-bg': '#101010', '--rs-radius-card': '2px' }, 'light');
    expect(css.startsWith(':root {')).toBe(true);
    expect(css).toContain('  --rs-color-bg: #101010;');
    expect(css).toContain('  --rs-radius-card: 2px;');
    expect(css.split('\n')).toHaveLength(4);
  });

  it('scopes the dark scheme the way the component marks it', () => {
    expect(stylesheet({ '--rs-color-bg': '#000' }, 'dark').startsWith('[data-rs-scheme="dark"] {')).toBe(true);
  });

  it('ignores a name that is not a token', () => {
    expect(stylesheet({ '--not-a-token': 'red' }, 'light')).toBe('');
  });
});
