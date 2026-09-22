// @vitest-environment jsdom
import { act, fireEvent, type RenderResult, screen } from '@testing-library/react';
import { createRef, type ReactElement, Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  DefaultItemDetail,
  defaultOverflowColumns,
  ListView,
  OverflowDialog,
  OverflowTable,
  Pagination,
  type SchedulerHandle,
  type SchedulerPart,
  type SchedulerProps,
  type SchedulerSlots,
  type SlotProps,
  TimelineView,
} from '../../src/index';
import { fixture, type ParityItem } from '../parity/adapter';
import { FakeResizeObserver, setLayout } from '../support/dom-fakes';
import { injectListLayout } from '../support/layout';
import { part, parts, renderUi, scrollTo, settle, setupComponentEnvironment } from '../support/react';

// Every part is replaceable (Feature Dossier 05 F-21, 10 M6: a test per part); slots keep refs and
// data-rs-part; slotProps, classNames and styles merge in the 06 §1.1 order.
setupComponentEnvironment();

const baseline = fixture('baseline-day');
const base = { items: baseline.items, date: baseline.date, now: '2031-03-12T10:41:00' };

async function flushLazy(): Promise<void> {
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

function Slot({ Default, ownerState, ...props }: SlotProps<SchedulerPart, ParityItem>): ReactElement {
  return <Default {...props} data-slot={ownerState.view} />;
}

const ALL_PARTS: readonly SchedulerPart[] = [
  'root',
  'header',
  'stickyTop',
  'stickyBottom',
  'scroller',
  'body',
  'pinnedStrip',
  'pinnedStripTrack',
  'pinnedChip',
  'edgeFade',
  'liveRegion',
  'navButton',
  'carriedOverCount',
  'shiftSection',
  'shiftHeader',
  'shiftHeaderTitle',
  'shiftHeaderRange',
  'shiftEmpty',
  'itemList',
  'listCard',
  'timelineCard',
  'cardActivator',
  'cardRail',
  'cardTitle',
  'cardDescription',
  'cardTimeLabel',
  'cardSuggestion',
  'cardPills',
  'levelPill',
  'tagPill',
  'referencePill',
  'pillIcon',
  'pinSentinel',
  'nowMarker',
  'timeGrid',
  'timeGutter',
  'hourLabel',
  'gridBox',
  'offShiftBand',
  'hourLine',
  'nowLine',
  'nowLabel',
  'laneStartPad',
  'laneEndPad',
  'lane',
  'moreChip',
  'overflowDialog',
  'overflowTable',
  'pagination',
  'detailDialog',
  'emptyState',
  'loadingState',
  'errorState',
  'scrollTopButton',
  'tooltip',
];

const slots = Object.fromEntries(ALL_PARTS.map((name) => [name, Slot])) as unknown as SchedulerSlots<ParityItem>;

type Props = Partial<SchedulerProps<ParityItem>>;
type Setup = (props: Props) => Promise<RenderResult> | RenderResult;

const list = (props: Props): RenderResult => renderUi(<ListView {...base} {...props} />);
const timeline = (props: Props): RenderResult => renderUi(<TimelineView {...base} {...props} />);

const crowded: ParityItem[] = Array.from({ length: 16 }, (_, index) => ({
  id: `k${String(index).padStart(2, '0')}`,
  level: 'routine',
  title: `Item ${index}`,
  start: '2031-03-12T09:00:00',
  end: '2031-03-12T10:30:00',
}));

/** How to make each part appear. */
const SETUPS: Partial<Record<SchedulerPart, Setup>> = {
  header: (props) => list({ ...props, renderHeader: () => null }),
  shiftEmpty: (props) => list({ ...props, items: baseline.items.filter((item) => !item.id.startsWith('n')) }),
  emptyState: (props) => list({ ...props, items: [] }),
  loadingState: (props) => list({ ...props, loading: true }),
  errorState: (props) => list({ ...props, error: true }),
  pinnedChip: (props) =>
    list({ ...props, items: baseline.items.map((item) => ({ ...item, pinned: item.id === 'c07' })) }),
  edgeFade: (props) => {
    const result = list({
      ...props,
      items: baseline.items.map((item) => ({ ...item, pinned: item.id.startsWith('c') })),
    });
    const track = part(result.container, 'pinnedStripTrack');
    setLayout(track, { scrollLeft: 0, clientWidth: 500, scrollWidth: 3000 });
    act(() => {
      for (const observer of FakeResizeObserver.instances) if (observer.targets.has(track)) observer.trigger(500);
    });
    settle();
    return result;
  },
  scrollTopButton: (props) => {
    const result = list({ ...props, compact: true });
    const scroller = injectListLayout(result.container, {
      sticky: 24,
      client: 700,
      scroll: 4000,
      sections: [0, 612, 2400],
      header: 60,
      cards: (index) => ({ top: 672 + index * 110, height: 100 }),
    });
    settle();
    scrollTo(scroller, 300);
    return result;
  },
  timelineCard: timeline,
  cardSuggestion: timeline,
  timeGrid: timeline,
  timeGutter: timeline,
  hourLabel: timeline,
  gridBox: timeline,
  offShiftBand: timeline,
  hourLine: timeline,
  nowLine: timeline,
  laneStartPad: timeline,
  laneEndPad: timeline,
  lane: timeline,
  moreChip: timeline,
  overflowDialog: openOverflow,
  overflowTable: openOverflow,
  pagination: openOverflow,
  detailDialog: async (props) => {
    const result = list({ ...props, defaultOpenItemId: 'c02' });
    await flushLazy();
    return result;
  },
};

async function openOverflow(props: Props): Promise<RenderResult> {
  const result = timeline({ ...props, items: crowded });
  fireEvent.click(screen.getByRole('button', { name: /more items from/ }));
  await flushLazy();
  return result;
}

describe('slots', () => {
  it.each(ALL_PARTS)('replaces the %s part and keeps data-rs-part', async (name) => {
    const setup = SETUPS[name] ?? list;
    const { baseElement } = await setup({ slots: { [name]: slots[name] } });
    const replaced = baseElement.querySelectorAll(`[data-slot][data-rs-part="${name}"]`);
    expect(replaced.length, name).toBeGreaterThan(0);
  });

  it('keeps the library refs through a slot: pin sentinels still register', () => {
    const { container } = list({ slots: { pinSentinel: slots.pinSentinel } });
    expect(parts(container, 'pinSentinel').length).toBe(5);
    expect(parts(container, 'pinSentinel').every((node) => node.dataset['slot'] === 'list')).toBe(true);
  });
});

describe('slotProps, classNames and styles (06 §1.1)', () => {
  it('merges defaults, then slotProps (object or function of ownerState), then classNames and styles', () => {
    const { container } = list({
      slotProps: {
        listCard: (owner) => ({ className: `level-${owner.level?.key ?? ''}`, title: owner.variant }),
        shiftHeader: { className: 'from-slot-props', style: { color: 'red' } },
      },
      classNames: { listCard: 'extra', shiftHeader: 'named' },
      styles: { shiftHeader: { color: 'blue' } },
    });
    const card = parts(container, 'listCard')[0] as HTMLElement;
    expect(card.className).toBe('rs-list-card level-watch extra');
    expect(card.getAttribute('title')).toBe('default');
    expect(card.style.getPropertyValue('--rs-card-level')).not.toBe('');
    const header = part(container, 'shiftHeader');
    expect(header.className).toBe('rs-shift-header from-slot-props named');
    expect(header.style.color).toBe('blue');
    expect(header.dataset['rsPart']).toBe('shiftHeader');
  });

  it('runs a consumer handler first; preventDefault() skips the library default', () => {
    const onItemOpen = vi.fn();
    const seen: string[] = [];
    const { rerender } = list({
      onItemOpen,
      slotProps: { cardActivator: { onClick: () => seen.push('consumer') } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delivery delay' }));
    expect(seen).toEqual(['consumer']);
    expect(onItemOpen).toHaveBeenCalledTimes(1);
    act(() =>
      rerender(
        <ListView
          {...base}
          onItemOpen={onItemOpen}
          slotProps={{ cardActivator: { onClick: (event) => event.preventDefault() } }}
        />,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Staff briefing' }));
    expect(onItemOpen).toHaveBeenCalledTimes(1);
  });

  it('unstyled mode marks the root; tokens and the hour height become inline variables', () => {
    const { container } = timeline({ unstyled: true, tokens: { '--rs-color-bg': 'white' }, density: 'dense' });
    const root = part(container, 'root');
    expect(root.dataset['rsUnstyled']).toBe('');
    expect(root.style.getPropertyValue('--rs-color-bg')).toBe('white');
    expect(root.style.getPropertyValue('--rs-hour-height')).toBe('120px');
    expect(root.dataset['rsDensity']).toBe('dense');
    expect(root.dataset['rsPreset']).toBe('default');
    expect(root.dataset['rsScheme']).toBe('light');
  });
});

describe('composition', () => {
  it('composes a consumer ref from slotProps with the library ref', () => {
    const ref = createRef<HTMLElement>();
    const handle = createRef<SchedulerHandle<ParityItem>>();
    const { container } = renderUi(<ListView {...base} ref={handle} slotProps={{ scroller: { ref } }} />);
    settle();
    expect(ref.current).toBe(part(container, 'scroller'));
    expect(handle.current?.getScrollElement()).toBe(ref.current);
  });

  it('renders the lazily loaded parts inside a scheduler (05 F-30)', async () => {
    renderUi(
      <ListView
        {...base}
        renderItemDetail={({ item }) => (
          <Suspense fallback={null}>
            <DefaultItemDetail item={item} />
            <OverflowTable items={[item]} columns={defaultOverflowColumns} />
            <Pagination page={0} pages={2} />
            <OverflowDialog group={{ id: 'custom', anchor: 0, items: [item] }} />
          </Suspense>
        )}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Server room alert' }));
    await flushLazy();
    expect(screen.getByRole('dialog', { name: 'Server room alert' })).toBeTruthy();
    expect(screen.getAllByRole('table')).toHaveLength(2);
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
  });
});
