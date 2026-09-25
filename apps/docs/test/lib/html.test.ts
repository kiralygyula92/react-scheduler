// SPDX-License-Identifier: MIT
// Lists in the Markdown twins and `llms-full.md`. A nested list used to end its parent item at the
// first inner `</li>`, so the parent's text and the first nested item ran together on one line.
import { describe, expect, it } from 'vitest';
import { toMarkdown } from '../../scripts/lib/html.ts';

describe('toMarkdown lists', () => {
  it('writes a flat list one item per line', () => {
    expect(toMarkdown('<ul><li>One</li><li><code>two</code></li></ul>')).toBe('- One\n- `two`');
    expect(toMarkdown('<ol><li>First</li><li>Second</li></ol>')).toBe('1. First\n2. Second');
  });

  it('indents a nested list under the item that holds it', () => {
    const html =
      '<ul><li>Release<ul><li><strong>Components</strong>: a</li><li><strong>Control</strong>: b</li></ul></li><li>Next</li></ul>';
    expect(toMarkdown(html)).toBe('- Release\n  - **Components**: a\n  - **Control**: b\n- Next');
  });

  it('aligns a list nested in an ordered item with the item text', () => {
    expect(toMarkdown('<ol><li>Step<ul><li>detail</li></ul></li></ol>')).toBe('1. Step\n   - detail');
  });
});
