// Maps the measured parts (generic names in measured-styles.*.json) to our DOM, per recorded state.
import type { ReactElement } from 'react';
import { ListView, type OverflowColumn, type SchedulerProps, TimelineView } from '../../../src/index';
import { defaultOverflowColumns } from '../../../src/react/components/overflow-columns';
import type { ParityItem } from '../../support/items';
import { cardByTitle, fixtures, mount, nav, part, parts, settled, until, wait } from '../support';

export interface Target {
  element: Element;
  text?: boolean;
  /** Layout-driven dimensions to compare (heights by default). */
  sizes?: readonly ('width' | 'height')[];
  pseudo?: string;
  /** Properties not compared for this part; each use says why. */
  skip?: readonly string[];
}

export type Targets = Record<string, Target | undefined>;

const baseline = fixtures['baseline'] as NonNullable<(typeof fixtures)['baseline']>;

/** The source never rendered the list's now marker (B-01): list parity renders run without it (07 §5). */
const NO_LIST_NOW = { enableNowIndicator: false } as const;

export function base(scheme: 'light' | 'dark'): SchedulerProps<ParityItem> {
  return { items: baseline.items, date: baseline.date, now: baseline.now, preset: 'classic', colorScheme: scheme };
}

const W = ['width', 'height'] as const;
const H = ['height'] as const;
const NONE = [] as const;

/** Nav buttons are anchored by bottom/top plus a translation; the source used other offsets. */
const NAV_SKIP = ['top', 'bottom'] as const;

const byClass = (root: Element, name: string): Element => {
  const element = root.querySelector(`.${name}`);
  if (!element) throw new Error(`no .${name}`);
  return element;
};

function pillTargets(prefix: string, pill: Element): Targets {
  return {
    [prefix]: { element: pill, sizes: H },
    [`${prefix}.label`]: { element: byClass(pill, 'rs-pill__label'), text: true, sizes: H },
    [`${prefix}.icon`]: { element: part(pill, 'pillIcon'), sizes: W },
  };
}

export async function listTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const { host } = mount(<ListView {...base(scheme)} {...NO_LIST_NOW} />);
  await settled(host, 800);
  const chip = parts(host, 'pinnedChip')[0] as HTMLElement;
  const current = parts(host, 'shiftSection')[1] as HTMLElement;
  const c02 = cardByTitle(host, 'Delivery delay', 'listCard');
  const c01 = cardByTitle(host, 'Server room alert', 'listCard');
  const c08 = parts(host, 'listCard').find((card) => card.dataset['rsVariant'] === 'muted') as HTMLElement;
  const targets: Targets = {
    'list.root': { element: part(host, 'root'), sizes: W },
    'list.scroller': { element: part(host, 'scroller'), sizes: W },
    'list.stickyTop': { element: part(host, 'stickyTop'), sizes: W },
    'pinnedStrip.outer': { element: part(host, 'pinnedStrip'), sizes: W },
    'pinnedStrip.track': { element: part(host, 'pinnedStripTrack'), sizes: W },
    'pinnedChip.root': { element: chip, sizes: W },
    'pinnedChip.rail': { element: part(chip, 'cardRail'), sizes: W },
    'pinnedChip.title': { element: part(chip, 'cardTitle'), text: true, sizes: H },
    'pinnedChip.time': { element: part(chip, 'cardTimeLabel'), text: true, sizes: H },
    'pinnedChip.pills': { element: part(chip, 'cardPills'), sizes: H },
    'navTop.button': { element: nav(host, 'top') as HTMLElement, text: true, sizes: H, skip: NAV_SKIP },
    'navTop.count': { element: part(host, 'carriedOverCount'), text: true, sizes: H },
    'list.body': { element: part(host, 'body'), sizes: W },
    'shiftHeader.root': { element: part(current, 'shiftHeader'), text: true, sizes: W },
    'shiftHeader.title': { element: part(current, 'shiftHeaderTitle'), text: true, sizes: H },
    'shiftHeader.range': { element: part(current, 'shiftHeaderRange'), text: true, sizes: H },
    'list.cards': { element: part(current, 'itemList'), sizes: W },
    'listCard.root': { element: c02, sizes: W },
    'listCard.button': { element: part(c02, 'cardActivator'), sizes: W },
    'listCard.row': { element: byClass(c02, 'rs-card__row'), sizes: W },
    'listCard.rail': { element: part(c02, 'cardRail'), sizes: W },
    'listCard.content': { element: byClass(c02, 'rs-card__content'), sizes: H },
    'listCard.time': { element: part(c02, 'cardTimeLabel'), text: true, sizes: H },
    'listCard.pills': { element: part(c02, 'cardPills'), sizes: H },
    'listCard.textColumn': { element: byClass(c02, 'rs-card__text'), sizes: H },
    'listCard.title': { element: part(c02, 'cardTitle'), text: true, sizes: H },
    'listCard.description': { element: part(c02, 'cardDescription'), text: true, sizes: H },
    'listCard.pinnedLevel.root': { element: c01, sizes: W },
    'listCard.pinnedLevel.title': { element: part(c01, 'cardTitle'), text: true, sizes: H },
    'listCard.pinnedLevel.description': { element: part(c01, 'cardDescription'), text: true, sizes: H },
    'listCard.pinnedLevel.row': { element: byClass(c01, 'rs-card__row'), sizes: W },
    'listCard.resolved.root': { element: c08, sizes: W },
    'listCard.resolved.title': { element: part(c08, 'cardTitle'), text: true, sizes: H },
    ...pillTargets('levelPill.watch', part(c02, 'levelPill')),
    ...pillTargets('levelPill.critical', part(c01, 'levelPill')),
    ...pillTargets('referencePill', part(c02, 'referencePill')),
    ...pillTargets('tagPill', part(c01, 'tagPill')),
    'list.stickyBottom': { element: part(host, 'stickyBottom'), sizes: W },
    'navBottom.button': { element: nav(host, 'bottom') as HTMLElement, text: true, sizes: H, skip: NAV_SKIP },
  };
  for (const id of ['c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10']) {
    const title = baseline.items.find((item) => item.id === id)?.title ?? '';
    const pill = part(cardByTitle(host, title, 'listCard'), 'levelPill');
    targets[`levelPillByItem.${id}`] = { element: pill, sizes: H };
    targets[`levelPillByItem.${id}.label`] = { element: byClass(pill, 'rs-pill__label'), text: true, sizes: H };
  }
  return targets;
}

export async function emptyTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const empty = fixtures['empty'] as NonNullable<(typeof fixtures)['empty']>;
  const { host } = mount(<ListView {...base(scheme)} {...NO_LIST_NOW} items={empty.items} />);
  await settled(host, 300);
  const state = part(host, 'emptyState');
  return {
    'list.emptyAll': { element: state, sizes: H },
    'list.emptyAll.text': { element: state, text: true, sizes: NONE },
  };
}

export async function pinnedManyTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const many = fixtures['pinnedMany'] as NonNullable<(typeof fixtures)['pinnedMany']>;
  const { host } = mount(
    <ListView {...base(scheme)} {...NO_LIST_NOW} items={many.items} date={many.date} now={many.now} />,
  );
  await settled(host, 800);
  await until(() => parts(host, 'edgeFade').length > 0, 3000, 'edge fade');
  return {
    'pinnedStrip.track': { element: part(host, 'pinnedStripTrack'), sizes: W },
    'pinnedStrip.fadeRight': {
      element: parts(host, 'edgeFade').find((fade) => fade.dataset['rsSide'] === 'end') as HTMLElement,
      sizes: W,
    },
    'pinnedChip.multi': { element: parts(host, 'pinnedChip')[1] as HTMLElement, sizes: W },
  };
}

export async function compactTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const { host } = mount(<ListView {...base(scheme)} {...NO_LIST_NOW} />, { width: 390, height: 844 });
  const scroller = await settled(host, 800);
  const targets: Targets = {
    'list.stickyTop': { element: part(host, 'stickyTop'), sizes: W },
    'pinnedStrip.outer': { element: part(host, 'pinnedStrip'), sizes: W },
    'pinnedChip.root': { element: parts(host, 'pinnedChip')[0] as HTMLElement, sizes: W },
    'navTop.button': { element: nav(host, 'top') as HTMLElement, text: true, sizes: H, skip: NAV_SKIP },
    'listCard.content': {
      element: byClass(cardByTitle(host, 'Delivery delay', 'listCard'), 'rs-card__content'),
      sizes: H,
    },
    'listCard.description': {
      element: part(cardByTitle(host, 'Delivery delay', 'listCard'), 'cardDescription'),
      text: true,
      sizes: H,
    },
  };
  scroller.scrollTop = 600;
  await until(() => parts(host, 'scrollTopButton').length === 1, 3000, 'scroll-to-top button');
  // A fixed 48 px box: the source's 36 px minimum height never applies.
  targets['scrollTopButton'] = { element: part(host, 'scrollTopButton'), sizes: W, skip: ['minHeight'] };
  return targets;
}

export async function timelineTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const { host } = mount(<TimelineView {...base(scheme)} />);
  await settled(host, 800);
  const labels = parts(host, 'hourLabel');
  const lines = parts(host, 'hourLine');
  const bands = parts(host, 'offShiftBand');
  const c02 = cardByTitle(host, 'Delivery delay', 'timelineCard');
  const c01 = cardByTitle(host, 'Server room alert', 'timelineCard');
  const muted = parts(host, 'timelineCard').find((card) => card.dataset['rsVariant'] === 'muted') as HTMLElement;
  return {
    'timeline.root': { element: part(host, 'root'), sizes: W },
    'timeline.stickyTop': { element: part(host, 'stickyTop'), sizes: W },
    'timeline.navTop': { element: nav(host, 'top') as HTMLElement, text: true, sizes: H, skip: NAV_SKIP },
    'timeline.scroller': { element: part(host, 'scroller'), sizes: W },
    'timeline.content': { element: byClass(host, 'rs-timeline__content'), sizes: W },
    // The grid never overflows its root, so the source's overflow values paint nothing.
    'grid.root': { element: part(host, 'timeGrid'), sizes: W, skip: ['overflowX', 'overflowY'] },
    'grid.gutter': { element: part(host, 'timeGutter'), sizes: W },
    // The second label (index 1): the first sits at −6 px.
    'grid.hourLabel': { element: labels[1] as HTMLElement, text: true, sizes: W },
    'grid.hourLabel.boundary': {
      element: labels.find((label) => label.dataset['rsBoundary'] !== undefined) as HTMLElement,
      text: true,
      sizes: W,
    },
    'grid.nowPill': { element: part(host, 'nowLabel'), sizes: H },
    // One element is both the pill and its text: the text's own background is the pill's.
    'grid.nowPill.text': { element: part(host, 'nowLabel'), text: true, sizes: NONE, skip: ['backgroundColor'] },
    'grid.box': { element: part(host, 'gridBox'), sizes: W },
    'grid.bandLayer': { element: byClass(host, 'rs-grid-bands'), sizes: W },
    // Consecutive off-shift rows are one band (same painted area); vertical geometry differs.
    'grid.band.first': { element: bands[0] as HTMLElement, sizes: ['width'], skip: ['top', 'bottom', 'height'] },
    'grid.band.middle': { element: bands[1] as HTMLElement, sizes: ['width'], skip: ['top', 'bottom', 'height'] },
    'grid.hourLine': {
      element: lines.find((line) => line.dataset['rsBoundary'] === undefined) as HTMLElement,
      sizes: W,
    },
    'grid.hourLine.boundary': {
      element: lines.find((line) => line.dataset['rsBoundary'] !== undefined) as HTMLElement,
      sizes: W,
    },
    'grid.nowLine': { element: part(host, 'nowLine'), sizes: W },
    'grid.leftPad': { element: part(host, 'laneStartPad'), sizes: W },
    'grid.lane': { element: part(host, 'lane'), sizes: W },
    'grid.rightPad': { element: part(host, 'laneEndPad'), sizes: W },
    // The activator carries the pointer cursor and fills the card.
    'timelineCard.root': { element: c02, sizes: W, skip: ['cursor'] },
    'timelineCard.top': { element: byClass(c02, 'rs-card__top'), sizes: W },
    'timelineCard.rail': { element: part(c02, 'cardRail'), sizes: ['width'] },
    'timelineCard.textBlock': { element: byClass(c02, 'rs-card__body'), sizes: NONE },
    'timelineCard.title': { element: part(c02, 'cardTitle'), text: true, sizes: H },
    'timelineCard.description': { element: part(c02, 'cardDescription'), text: true, sizes: H },
    'timelineCard.time': { element: part(c02, 'cardTimeLabel'), text: true, sizes: H },
    'timelineCard.bottom': { element: byClass(c02, 'rs-card__bottom'), sizes: W },
    'timelineCard.pills': { element: part(c02, 'cardPills'), sizes: H },
    'timelineCard.suggestion': { element: part(c02, 'cardSuggestion'), text: true, sizes: H },
    'timelineCard.pinnedLevel.root': { element: c01, sizes: W, skip: ['cursor'] },
    'timelineCard.pinnedLevel.bottom': { element: byClass(c01, 'rs-card__bottom'), sizes: W },
    'timelineCard.pinnedLevel.description': { element: part(c01, 'cardDescription'), text: true, sizes: H },
    'timelineCard.pinnedLevel.suggestion': { element: part(c01, 'cardSuggestion'), text: true, sizes: H },
    'timelineCard.resolved.root': { element: muted, sizes: W, skip: ['cursor'] },
    'timelineCard.resolved.bottom': { element: byClass(muted, 'rs-card__bottom'), sizes: W },
    'timelineCard.resolved.title': { element: part(muted, 'cardTitle'), text: true, sizes: H },
    'timelineCard.resolved.suggestion': { element: part(muted, 'cardSuggestion'), text: true, sizes: H },
    'moreChip.root': { element: part(host, 'moreChip'), sizes: H },
    'moreChip.label': { element: byClass(host, 'rs-more-chip__label'), text: true, sizes: H },
    'timeline.stickyBottom': { element: part(host, 'stickyBottom'), sizes: W },
    'timeline.navBottom': { element: nav(host, 'bottom') as HTMLElement, text: true, sizes: H, skip: NAV_SKIP },
  };
}

export async function disabledTopTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const { host } = mount(<TimelineView {...base(scheme)} />);
  const scroller = await settled(host, 800);
  scroller.scrollTop = 0;
  await until(() => nav(host, 'top')?.dataset['rsDisabled'] !== undefined, 3000, 'disabled top');
  const top = nav(host, 'top') as HTMLElement;
  return {
    // aria-disabled keeps pointer events, so the hint's tooltip still shows (B-26).
    'timeline.navTop.disabled': { element: top, sizes: H, skip: [...NAV_SKIP, 'pointerEvents'] },
    'timeline.navTop.disabled.title': {
      element: byClass(top, 'rs-nav-button__title'),
      text: true,
      sizes: H,
      skip: ['pointerEvents'],
    },
    'timeline.navTop.disabled.range': {
      element: byClass(top, 'rs-nav-button__range'),
      text: true,
      sizes: H,
      skip: ['pointerEvents'],
    },
  };
}

/** The source's dropped domain column, titled "Age" in the reference (Feature Dossier 02 §5, 04 §10). */
const AGE: OverflowColumn<ParityItem> = { id: 'age', header: 'Age', minWidth: 140, renderCell: () => null };

export async function overflowTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const columns = [...(defaultOverflowColumns as readonly OverflowColumn<ParityItem>[])];
  columns.splice(3, 0, AGE);
  const { host } = mount(<TimelineView {...base(scheme)} overflowColumns={columns} />);
  await settled(host, 800);
  part(host, 'moreChip').click();
  await until(() => document.querySelector('dialog[open]') !== null, 5000, 'overflow dialog');
  const dialog = document.querySelector('dialog[open]') as HTMLDialogElement;
  const rows = [...dialog.querySelectorAll('tbody tr')];
  const first = rows[0] as Element;
  return {
    // The native ::backdrop replaces the source's backdrop element: its colour is what paints.
    'overflowDialog.backdrop': {
      element: dialog,
      pseudo: '::backdrop',
      sizes: NONE,
      skip: [
        'display',
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'zIndex',
        'height',
        'justifyContent',
        'alignItems',
        'transition',
      ],
    },
    // A native modal dialog is fixed and centred by margin: auto; the source centred a relative paper.
    'overflowDialog.paper': {
      element: dialog,
      sizes: W,
      skip: ['position', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
    },
    'overflowDialog.title': { element: byClass(dialog, 'rs-dialog__title'), sizes: W },
    'overflowDialog.title.text': { element: byClass(dialog, 'rs-dialog__heading'), text: true, sizes: H },
    'overflowDialog.closeIcon': {
      element: dialog.querySelector('.rs-dialog__title .rs-icon-button') as Element,
      sizes: W,
    },
    'overflowDialog.content': { element: byClass(dialog, 'rs-dialog__content'), sizes: W },
    'overflowTable.container': { element: byClass(dialog, 'rs-overflow-table__container'), sizes: W },
    'overflowTable.headCell': { element: dialog.querySelector('th[scope="col"]') as Element, text: true, sizes: H },
    'overflowTable.sortLabel.active': {
      element: dialog.querySelector('.rs-overflow-table__sort[data-rs-active]') as Element,
      text: true,
      sizes: H,
    },
    'overflowTable.rowOdd': { element: first, sizes: H },
    'overflowTable.rowEven': { element: rows[1] as Element, sizes: H },
    // Rows carry the stripe colour; the source repeated it on each cell.
    'overflowTable.cell.time': { element: first.querySelector('td') as Element, sizes: H, skip: ['backgroundColor'] },
    'overflowTable.cell.time.text': {
      element: first.querySelector('td .rs-overflow-table__text') as Element,
      text: true,
      sizes: H,
    },
    'overflowTable.cell.title.text': { element: byClass(first, 'rs-overflow-table__title'), text: true, sizes: H },
    'overflowTable.cell.description.text': {
      element: (first.querySelectorAll('td')[4] as Element).querySelector('span') as Element,
      text: true,
      sizes: H,
    },
    'overflowTable.cell.action': { element: byClass(first, 'rs-overflow-table__action'), sizes: W },
    'overflowDialog.actions': { element: byClass(dialog, 'rs-dialog__actions'), sizes: W },
    'overflowDialog.closeText': {
      element: dialog.querySelector('.rs-dialog__actions .rs-text-button') as Element,
      text: true,
      sizes: H,
    },
  };
}

export async function loadingTargets(scheme: 'light' | 'dark'): Promise<Targets> {
  const { host } = mount(<TimelineView {...base(scheme)} loading />);
  await wait(300);
  return {
    // The box of a rotating element follows the animation phase.
    // The recorded keyframe name went through the Dossier's identifier sanitising; the spinner is a
    // blockified flex item centred like the source's inline-block.
    spinner: { element: byClass(host, 'rs-spinner'), sizes: NONE, skip: ['transform', 'animationName', 'display'] },
    'spinner.wrapper': { element: part(host, 'loadingState'), sizes: W },
  };
}

export type Scene = (scheme: 'light' | 'dark') => Promise<Targets>;

export const SCENES: Record<string, Scene> = {
  list: listTargets,
  listEmpty: emptyTargets,
  pinnedMany: pinnedManyTargets,
  listCompact: compactTargets,
  timeline: timelineTargets,
  timelineDisabledTop: disabledTopTargets,
  overflowDialog: overflowTargets,
  loading: loadingTargets,
};

export type Render = (ui: ReactElement) => void;
