// SPDX-License-Identifier: MIT
// The board every scenario page shows (Feature Dossier 08 §2): one characterization fixture under a
// view toggle, a color-scheme toggle and a compact toggle. The fixture decides the shape of the day
// — the starts, the ends, the levels and the tags — and `useDemo` decides the wording, so a scenario
// reads in the language of the page it is on.
import { useState } from 'react';
import {
  classicLevels,
  type ColorScheme,
  Scheduler,
  type SchedulerItem,
  type ViewKind,
  type WallClock,
} from '@react-schedulerkit/react-scheduler';
import { type FixtureData, fixtureItems, fixtureMoment } from './fixture';
import { useDemo } from './useDemo';

export type { FixtureData };

const VIEWS: readonly ViewKind[] = ['list', 'timeline'];
const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

export function FixtureBoard({ fixture }: { fixture: FixtureData }): React.ReactElement {
  const demo = useDemo();
  const [view, setView] = useState<ViewKind>('timeline');
  const [scheme, setScheme] = useState<ColorScheme>('light');
  const [compact, setCompact] = useState(false);

  // Every offset in a fixture is minutes from midnight of the day it was recorded on; midnight of
  // the demo day stands in for it, so the eight scenarios all show the same week as the rest of the
  // site and the prerendered schedule agrees with the hydrated one.
  const midnight = demo.at(0);
  const anchor: WallClock = `${fixture.anchorHour}:00`;
  const items: SchedulerItem[] = fixtureItems(fixture, midnight, {
    titles: demo.t.list('sample.titles'),
    describe: (title) => demo.t('sample.description', { title }),
  });

  return (
    <div>
      <div role="group" aria-label={demo.t('controls.view')}>
        {VIEWS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={view === kind}
            onClick={() => {
              setView(kind);
            }}
          >
            {demo.localization.views[kind]}
          </button>
        ))}
      </div>
      <fieldset>
        <legend>{demo.t('controls.scheme')}</legend>
        {SCHEMES.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name={`${fixture.id}-scheme`}
              checked={scheme === value}
              onChange={() => {
                setScheme(value);
              }}
            />
            {demo.t(value === 'light' ? 'controls.schemeLight' : 'controls.schemeDark')}
          </label>
        ))}
      </fieldset>
      <label>
        <input
          type="checkbox"
          checked={compact}
          onChange={(event) => {
            setCompact(event.target.checked);
          }}
        />
        {demo.t('controls.compact')}
      </label>
      <Scheduler
        items={items}
        levels={classicLevels}
        shifts={{
          durationHours: fixture.shiftHours,
          anchor,
          before: 1,
          after: 1,
        }}
        date={fixtureMoment(fixture, midnight, 'date')}
        now={fixtureMoment(fixture, midnight, 'now')}
        view={view}
        onViewChange={setView}
        colorScheme={scheme}
        compact={compact}
        localization={demo.localization}
      />
    </div>
  );
}
