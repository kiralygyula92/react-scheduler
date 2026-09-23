// SPDX-License-Identifier: MIT
// The Playground (docs pack 04 §4): controls above, the component below, then the code for exactly
// what was changed and the log of what the component emitted. Every control is generated from the
// declarations, so the page cannot fall behind the component.
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { classicLevels, Scheduler, type WallClock } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '~/demos/_shared/useDemo';
import { type FixtureData, fixtureItems, fixtureMoment } from '~/demos/_shared/fixture';
import baselineDay from '~/content/fixtures/baseline-day.json';
import crowded from '~/content/fixtures/crowded.json';
import empty from '~/content/fixtures/empty.json';
import large from '~/content/fixtures/large.json';
import nightShift from '~/content/fixtures/night-shift.json';
import pastDate from '~/content/fixtures/past-date.json';
import pinnedMany from '~/content/fixtures/pinned-many.json';
import sparse from '~/content/fixtures/sparse.json';
import { useI18n } from '~/i18n/I18nProvider';
import { useT } from '~/i18n/useT';
import { Code } from '~/shell/doc';
import { Controls, type SetupField } from './Controls';
import { generate } from './code';
import { EventLog, LOG_LIMIT, type LoggedEvent, summarize } from './EventLog';
import { controls as buildControls, groups as buildGroups, parseValue } from './model';
import { decode, EMPTY, type PlaygroundState, search } from './state';
import { Stage } from './Stage';

/** The eight recorded days, in the order the Demos section lists them, plus the generated sample. */
const FIXTURES: Readonly<Record<string, FixtureData>> = {
  'baseline-day': baselineDay,
  empty,
  sparse,
  crowded,
  'night-shift': nightShift,
  'past-date': pastDate,
  'pinned-many': pinnedMany,
  large,
};

const LEVEL_KEYS = classicLevels.map((level) => level.key);
const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
const DEFAULT_SETUP = { dataset: 'baseline-day', count: '24', language: '' } as const;

/** "Has this page hydrated yet?", without a state update in an effect. */
const subscribeNothing = (): (() => void) => () => undefined;
const hydratedNow = (): boolean => true;
const hydratedOnServer = (): boolean => false;

export function Playground(): React.ReactElement {
  const demo = useDemo();
  const t = useT('pages/demos/playground');
  const { locale } = useI18n();
  // The configuration arrives in the URL, which the prerendered page knows nothing about. Reading it
  // during the first render would disagree with that page, so the panel shows the defaults until
  // hydration and the shared configuration from then on.
  const hydrated = useSyncExternalStore(subscribeNothing, hydratedNow, hydratedOnServer);
  const [edited, setEdited] = useState<PlaygroundState>(() =>
    typeof window === 'undefined' ? EMPTY : decode(window.location.search),
  );
  const state = hydrated ? edited : EMPTY;
  const [filter, setFilter] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);
  const [events, setEvents] = useState<readonly LoggedEvent[]>([]);
  const nextEventId = useRef(0);

  const all = useMemo(() => buildControls(), []);
  const groups = useMemo(() => buildGroups(all), [all]);
  const listed = useMemo(() => all.filter((control) => control.kind === 'code-only'), [all]);
  const eventProps = useMemo(() => all.filter((control) => control.kind === 'event'), [all]);
  const byName = useMemo(() => new Map(all.map((control) => [control.prop.name, control])), [all]);

  const update = useCallback((next: PlaygroundState) => {
    setEdited(next);
    // `replaceState` rather than a navigation: the page does not change, only what it is showing.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${search(next)}`);
  }, []);

  const setProp = useCallback(
    (name: string, value: string) => {
      const props = { ...state.props };
      if (value === '') delete props[name];
      else props[name] = value;
      update({ ...state, props });
    },
    [state, update],
  );

  const setSetup = useCallback(
    (name: string, value: string) => {
      const setup = { ...state.setup };
      if (value === '' || value === DEFAULT_SETUP[name as keyof typeof DEFAULT_SETUP]) delete setup[name];
      else setup[name] = value;
      update({ ...state, setup });
    },
    [state, update],
  );

  const resetAll = useCallback(() => {
    update(EMPTY);
  }, [update]);

  const dataset = state.setup['dataset'] ?? DEFAULT_SETUP.dataset;
  const count = Number(state.setup['count'] ?? DEFAULT_SETUP.count);
  const language = state.setup['language'] ?? locale;

  const midnight = demo.at(0);
  const titles = demo.t.list('sample.titles');
  const scenario = useMemo(() => {
    const wording = { titles, describe: (title: string) => demo.t('sample.description', { title }) };
    if (dataset === 'sample') {
      const items = demo.items({
        seed: 31,
        count: Number.isFinite(count) ? Math.max(0, Math.min(500, count)) : 24,
        start: midnight + 6 * 3_600_000,
        hours: 12,
        levels: LEVEL_KEYS,
        overlapDensity: 0.3,
        pinnableShare: 0.15,
        withReferences: true,
      });
      return { items, date: demo.date.getTime(), now: demo.now.getTime(), shiftHours: 12, anchorHour: 6 };
    }
    const fixture = FIXTURES[dataset] ?? baselineDay;
    return {
      items: fixtureItems(fixture, midnight, wording),
      date: fixtureMoment(fixture, midnight, 'date'),
      now: fixtureMoment(fixture, midnight, 'now'),
      shiftHours: fixture.shiftHours,
      anchorHour: fixture.anchorHour,
    };
    // `demo` changes identity with the locale, which is exactly when the wording has to be rebuilt.
  }, [dataset, count, midnight, demo, titles]);

  const log = useCallback((name: string, args: readonly unknown[]) => {
    const entry: LoggedEvent = {
      id: (nextEventId.current += 1),
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      name,
      args: summarize(args),
    };
    setEvents((previous) => [entry, ...previous].slice(0, LOG_LIMIT));
  }, []);

  const handlers = useMemo(() => {
    const out: Record<string, (...args: unknown[]) => void> = {};
    for (const control of eventProps) {
      out[control.prop.name] = (...args: unknown[]) => {
        log(control.prop.name, args);
      };
    }
    return out;
  }, [eventProps, log]);

  const chosen = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const [name, raw] of Object.entries(state.props)) {
      const control = byName.get(name);
      if (control === undefined) continue;
      const value = parseValue(control, raw);
      if (value !== undefined) out[name] = value;
    }
    return out;
  }, [state.props, byName]);

  const anchor: WallClock = `${scenario.anchorHour}:00`;
  const setup: readonly SetupField[] = [
    {
      name: 'dataset',
      value: dataset,
      options: [
        ...Object.keys(FIXTURES).map((id) => ({ value: id, label: t(`datasets.${id}`) })),
        { value: 'sample', label: t('datasets.sample') },
      ],
    },
    { name: 'count', value: String(count), options: [], min: 0, max: 500, step: 1 },
    {
      name: 'language',
      value: language,
      options: LOCALES.map((code) => ({ value: code, label: t(`languages.${code}`) })),
    },
  ];

  const code = generate({
    controls: all.filter((control) => control.kind !== 'event'),
    changed: state.props,
    locale: language,
    dataset: t(`datasets.${dataset}`),
  });

  return (
    <div className="ds-pg">
      <Controls
        groups={groups}
        listed={listed}
        events={eventProps}
        values={state.props}
        setup={setup}
        filter={filter}
        changedOnly={changedOnly}
        onProp={setProp}
        onSetup={setSetup}
        onFilter={setFilter}
        onChangedOnly={setChangedOnly}
        onResetAll={resetAll}
        total={all.length}
      />

      <Stage message={t('stage.error')}>
        <Scheduler
          items={scenario.items}
          levels={classicLevels}
          shifts={{ durationHours: scenario.shiftHours, anchor, before: 1, after: 1 }}
          date={scenario.date}
          now={scenario.now}
          localization={demo.packs[language] ?? demo.localization}
          {...handlers}
          {
            /* Strings from the controls, parsed back to what each prop's type says. */ ...chosen
          }
        />
      </Stage>

      <div>
        <h2 id="code">{t('sections.code')}</h2>
        <Code lang="tsx">{code}</Code>
      </div>
      <EventLog
        events={events}
        onClear={() => {
          setEvents([]);
        }}
      />
    </div>
  );
}
