import { commands, page, server, userEvent } from 'vitest/browser';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ListView, type OverflowColumn, type SchedulerProps, TimelineView } from '../../../src/index';
import { defaultOverflowColumns } from '../../../src/react/components/overflow-columns';
import type { ParityItem } from '../../support/items';
import { fixtures, frames, mount, nav, part, parts, settled, unmountAll, until, wait } from '../support';
import type { Rect } from './diff';

// SHOT: the classic preset against the reference screenshots (Feature Dossier 07 §1.4, 09 §4):
// color threshold 0.1, at most 0.1 % differing pixels after the 07 §5 masks. The references match
// Windows Chromium's rasterization, so the gate is enforced on Windows (anywhere with RS_SHOT=1);
// elsewhere the captures and diff images are only written to test-results/shot/ for review.

const TOLERANCE = 0.001;

type Fixture = NonNullable<(typeof fixtures)['baseline']>;
const fixture = (name: string): Fixture => fixtures[name] as Fixture;

function data(name: string): Pick<SchedulerProps<ParityItem>, 'items' | 'date' | 'now'> {
  const { items, date, now } = fixture(name);
  return { items, date, now };
}

/** Classic preset; the list without its now marker (07 §5: the source never drew it). */
function classic(scheme: 'light' | 'dark'): Partial<SchedulerProps<ParityItem>> {
  return { preset: 'classic', colorScheme: scheme };
}

const NO_LIST_NOW = { enableNowIndicator: false } as const;

/** The top button's count suffix (07 §5, B-06): the whole button, widened to the source's width. */
function topButtonMask(host: HTMLElement): Rect[] {
  const top = nav(host, 'top');
  if (!top) return [];
  const rect = top.getBoundingClientRect();
  const center = rect.left + rect.width / 2;
  return [{ x: center - 140, y: rect.top - 2, width: 280, height: rect.height + 4 }];
}

interface Shot {
  name: string;
  viewport?: [number, number];
  render: () => Promise<HTMLElement>;
  masks?: (host: HTMLElement) => Rect[];
}

/** The consumer page behind the (transparent) classic list: its background follows the scheme. */
function pageBackground(ui: ReactElement): void {
  const scheme = (ui.props as { colorScheme?: string }).colorScheme;
  document.body.style.background = scheme === 'dark' ? '#121212' : '#FFFFFF';
}

async function landed(ui: ReactElement, size?: [number, number]): Promise<HTMLElement> {
  pageBackground(ui);
  const { host } = mount(ui, size ? { width: size[0], height: size[1] } : undefined);
  await settled(host, 800);
  return host;
}

async function scrolled(
  ui: ReactElement,
  top: (scroller: HTMLElement) => number,
  size?: [number, number],
): Promise<HTMLElement> {
  const host = await landed(ui, size);
  const scroller = part(host, 'scroller');
  scroller.scrollTop = top(scroller);
  await settled(host, 600);
  return host;
}

/** The source's dropped domain column, titled "Age" in the reference (Feature Dossier 02 §5). */
const WITH_AGE: readonly OverflowColumn<ParityItem>[] = (() => {
  const columns = [...(defaultOverflowColumns as readonly OverflowColumn<ParityItem>[])];
  columns.splice(3, 0, { id: 'age', header: 'Age', minWidth: 140, renderCell: () => null });
  return columns;
})();

const SHOTS: Shot[] = [
  {
    name: 'list-desktop-light-landing',
    render: () => landed(<ListView {...data('baseline')} {...classic('light')} {...NO_LIST_NOW} />),
  },
  {
    name: 'list-desktop-dark-landing',
    render: () => landed(<ListView {...data('baseline')} {...classic('dark')} {...NO_LIST_NOW} />),
  },
  {
    name: 'list-desktop-light-scrolled-collapsed',
    render: () => scrolled(<ListView {...data('baseline')} {...classic('light')} {...NO_LIST_NOW} />, () => 900),
  },
  {
    name: 'list-desktop-light-top-of-previous',
    render: () => scrolled(<ListView {...data('baseline')} {...classic('light')} {...NO_LIST_NOW} />, () => 0),
  },
  {
    name: 'list-desktop-light-pinned-many',
    render: () => landed(<ListView {...data('pinnedMany')} {...classic('light')} {...NO_LIST_NOW} />),
  },
  {
    name: 'list-desktop-light-empty',
    render: () => landed(<ListView {...data('empty')} {...classic('light')} {...NO_LIST_NOW} />),
  },
  {
    name: 'list-desktop-light-sparse-no-nav',
    render: () => landed(<ListView {...data('sparse')} {...classic('light')} {...NO_LIST_NOW} />),
  },
  {
    name: 'list-compact-light-landing',
    viewport: [390, 844],
    render: () => landed(<ListView {...data('baseline')} {...classic('light')} {...NO_LIST_NOW} />, [390, 844]),
  },
  {
    name: 'list-compact-dark-landing',
    viewport: [390, 844],
    render: () => landed(<ListView {...data('baseline')} {...classic('dark')} {...NO_LIST_NOW} />, [390, 844]),
  },
  {
    // 60 px above the landing: the scroll-to-top button shows (and so does B-19's black-on-black).
    name: 'list-compact-dark-scroll-top-button',
    viewport: [390, 844],
    render: () =>
      scrolled(
        <ListView {...data('baseline')} {...classic('dark')} {...NO_LIST_NOW} />,
        (scroller) => scroller.scrollTop - 60,
        [390, 844],
      ),
  },
  {
    name: 'timeline-desktop-light-landing',
    render: () => landed(<TimelineView {...data('baseline')} {...classic('light')} />),
  },
  {
    name: 'timeline-desktop-dark-landing',
    render: () => landed(<TimelineView {...data('baseline')} {...classic('dark')} />),
  },
  {
    name: 'timeline-desktop-light-top-disabled',
    render: () => scrolled(<TimelineView {...data('baseline')} {...classic('light')} />, () => 0),
  },
  {
    // B-05 changes which cards are pinned at the end: the strip is masked (07 §5). The reference was
    // captured 128 px (one strip of chips) above the end: the source scrolled to the end before its
    // strip grew (inferred from the image; GAPS.md).
    name: 'timeline-desktop-light-bottom-disabled',
    render: () =>
      scrolled(
        <TimelineView {...data('baseline')} {...classic('light')} />,
        (scroller) => scroller.scrollHeight - scroller.clientHeight - 128,
      ),
    masks: (host) => {
      const strip = part(host, 'pinnedStrip').getBoundingClientRect();
      return [{ x: 0, y: 0, width: 1440, height: strip.bottom }];
    },
  },
  {
    name: 'timeline-desktop-light-tooltip',
    render: async () => {
      const host = await landed(<TimelineView {...data('baseline')} {...classic('light')} />);
      await page.elementLocator(nav(host, 'bottom') as HTMLElement).hover();
      await until(() => document.querySelector('[role="tooltip"]:not(.rs-visually-hidden)') !== null, 3000, 'tooltip');
      await frames(3);
      return host;
    },
  },
  {
    name: 'timeline-desktop-light-overflow-dialog',
    render: async () => {
      const host = await landed(
        <TimelineView {...data('baseline')} {...classic('light')} overflowColumns={WITH_AGE} />,
      );
      // A real pointer click, as in the capture: the dialog's initial focus then shows no focus ring.
      await userEvent.click(part(host, 'moreChip'));
      await until(() => document.querySelector('dialog[open]') !== null, 5000, 'overflow dialog');
      await wait(300);
      return host;
    },
  },
  {
    name: 'timeline-desktop-light-crowded',
    render: () => landed(<TimelineView {...data('crowded')} {...classic('light')} />),
  },
  {
    name: 'timeline-medium-light-crowded-compact-columns',
    viewport: [768, 1024],
    render: () => landed(<TimelineView {...data('crowded')} {...classic('light')} />, [768, 1024]),
  },
  {
    name: 'timeline-desktop-light-loading',
    render: async () => {
      const { host } = mount(<TimelineView {...data('baseline')} {...classic('light')} loading />);
      await wait(300);
      return host;
    },
  },
  {
    name: 'timeline-desktop-light-past-date',
    render: () => landed(<TimelineView {...data('past')} {...classic('light')} />),
  },
];

afterEach(async () => {
  unmountAll();
  await page.viewport(1440, 900);
  await page.elementLocator(document.body).hover({ position: { x: 0, y: 0 } });
});

describe.runIf(server.browser === 'chromium')('reference screenshots (classic preset)', () => {
  it.each(SHOTS.map((shot) => [shot.name, shot] as const))('[SHOT] %s', async (_name, shot) => {
    const environment = await commands.screenshotEnvironment();
    const [width, height] = shot.viewport ?? [1440, 900];
    await page.viewport(width, height);
    const host = await shot.render();
    const masks = [...topButtonMask(host), ...(shot.masks?.(host) ?? [])];
    // Animations disabled as in the capture (09 §4): finite ones end at their last frame, infinite ones
    // at their first; the chips' finished entrance keeps them composited, as in the references.
    const base64 = await page.screenshot({ save: false, animations: 'disabled', caret: 'hide' });
    const result = await commands.compareScreenshot({ name: shot.name, base64, masks });
    if (environment.enforce) {
      expect(
        result.ratio,
        `${shot.name}: ${result.different} of ${result.compared} pixels differ (diff: ${result.diff})`,
      ).toBeLessThanOrEqual(TOLERANCE);
    }
  });
});

void parts;
