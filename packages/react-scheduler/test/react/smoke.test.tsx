// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ListView, Scheduler, TimelineView } from '../../src/index';
import { fixture } from '../parity/adapter';
import { frames, part, parts, renderUi, setupComponentEnvironment } from '../support/react';

const baseline = fixture('baseline-day');
setupComponentEnvironment();

describe('smoke', () => {
  it('renders the list view with sections and cards', () => {
    const { container } = renderUi(<Scheduler items={baseline.items} date={baseline.date} now={baseline.now} />);
    frames(3);
    expect(parts(container, 'shiftSection')).toHaveLength(3);
    expect(parts(container, 'listCard')).toHaveLength(17);
    expect(screen.getByRole('heading', { name: 'Current shift' })).toBeDefined();
    expect(part(container, 'root').dataset['rsView']).toBe('list');
  });

  it('renders the timeline view with the grid and cards', () => {
    const { container } = renderUi(<TimelineView items={baseline.items} date={baseline.date} now={baseline.now} />);
    frames(3);
    expect(parts(container, 'hourLabel')).toHaveLength(37);
    expect(parts(container, 'timelineCard').length).toBeGreaterThan(0);
    expect(parts(container, 'moreChip').length).toBeGreaterThan(0);
  });

  it('renders the standalone list view', () => {
    const { container } = renderUi(<ListView items={baseline.items} date={baseline.date} now={baseline.now} />);
    expect(parts(container, 'listCard')).toHaveLength(17);
  });
});
