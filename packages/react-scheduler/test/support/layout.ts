// Injected layout for component tests (jsdom has none), in the characterization suite's terms.
import { setLayout } from './dom-fakes';
import { part, parts, scrollable } from './react';

export interface ListLayout {
  sticky: number;
  client: number;
  scroll: number;
  /** offsetTop of the sections, in shift order. */
  sections: readonly number[];
  header: number;
  /** offsetTop / offsetHeight of the current section's cards, in order. */
  cards: (index: number) => { top: number; height: number };
  top?: number;
}

/** Applies `layout` to a rendered list view. */
export function injectListLayout(container: ParentNode, layout: ListLayout): HTMLElement {
  const scroller = part(container, 'scroller');
  scrollable(scroller, { clientHeight: layout.client, scrollHeight: layout.scroll, top: layout.top ?? 0 });
  setLayout(part(container, 'stickyTop'), { offsetHeight: layout.sticky });
  parts(container, 'shiftSection').forEach((section, index) => {
    setLayout(section, { offsetTop: layout.sections[index] ?? 0 });
    setLayout(part(section, 'shiftHeader'), { offsetHeight: layout.header });
    if (section.dataset['rsOffset'] === '0') {
      parts(section, 'listCard').forEach((card, cardIndex) => {
        const { top, height } = layout.cards(cardIndex);
        setLayout(card, { offsetTop: top, offsetHeight: height });
      });
    }
  });
  return scroller;
}

/** A timeline scroller of the given client height over the 36 h grid (6192 px + pads). */
export function injectTimelineLayout(container: ParentNode, clientHeight = 800, top = 0): HTMLElement {
  const scroller = part(container, 'scroller');
  scrollable(scroller, { clientHeight, scrollHeight: 36 * 172 + 8 + 12 + 48, top });
  return scroller;
}
