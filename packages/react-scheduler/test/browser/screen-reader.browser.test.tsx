import { computeAccessibleDescription, computeAccessibleName, getRole, isInaccessible } from 'dom-accessibility-api';
import { server, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { ListView, type SchedulerProps, TimelineView } from '../../src/index';
import type { ParityItem } from '../support/items';
import { cardByTitle, fixtures, mount, part, settled, unmountAll, until, wait } from './support';

// Screen-reader smoke test (Feature Dossier 05 F-18): what assistive technology is told about each
// interactive, structural and live element, as a snapshot of roles, names and descriptions. It runs
// in a real browser, where CSS decides word boundaries in names ("View previous shift (2 inherited)").
const baseline = fixtures['baseline'] as NonNullable<(typeof fixtures)['baseline']>;
const base: SchedulerProps<ParityItem> = {
  items: baseline.items,
  date: baseline.date,
  now: '2031-03-12T10:41:00',
  preset: 'classic',
  'aria-label': 'Agenda',
};

const ROLES = new Set([
  'button',
  'dialog',
  'heading',
  'list',
  'region',
  'separator',
  'status',
  'table',
  'columnheader',
  'navigation',
  'tooltip',
]);

function announced(root: Element): string[] {
  const lines: string[] = [];
  for (const element of root.querySelectorAll('*')) {
    const role = getRole(element);
    const live = element.getAttribute('aria-live');
    if ((!role || !ROLES.has(role)) && !live) continue;
    if (isInaccessible(element)) continue;
    const description = computeAccessibleDescription(element);
    lines.push(
      [role ?? 'live', JSON.stringify(computeAccessibleName(element)), description ? `— ${description}` : '']
        .concat(live ? [`(live: ${live}) ${JSON.stringify(element.textContent ?? '')}`] : [])
        .filter(Boolean)
        .join(' '),
    );
  }
  return lines;
}

afterEach(() => {
  unmountAll();
});

describe.runIf(server.browser === 'chromium')('screen-reader names and descriptions', () => {
  it('the list view', async () => {
    const { host } = mount(<ListView {...base} />);
    await settled(host, 500);
    expect(announced(host)).toMatchSnapshot();
  });

  it('the timeline view', async () => {
    const { host } = mount(<TimelineView {...base} />);
    await settled(host, 500);
    expect(announced(host)).toMatchSnapshot();
  });

  it('the detail dialog', async () => {
    const { host } = mount(<ListView {...base} />);
    await settled(host, 500);
    await userEvent.click(part(cardByTitle(host, 'Server room alert', 'listCard'), 'cardActivator'));
    await until(() => document.querySelector('dialog[open]') !== null, 3000, 'detail dialog');
    await wait(200);
    expect(announced(document.querySelector('dialog[open]') as Element)).toMatchSnapshot();
  });

  it('the overflow dialog', async () => {
    const { host } = mount(<TimelineView {...base} />);
    await settled(host, 500);
    await userEvent.click(part(host, 'moreChip'));
    await until(() => document.querySelector('dialog[open]') !== null, 3000, 'overflow dialog');
    await wait(200);
    expect(announced(document.querySelector('dialog[open]') as Element)).toMatchSnapshot();
  });
});
