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
import { Check, Choice, Controls } from './controls';
import { type FixtureData, fixtureItems, fixtureMoment } from './fixture';
import { useDemo } from './useDemo';

export type { FixtureData };

const VIEWS: readonly ViewKind[] = ['list', 'timeline'];
const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

export function FixtureBoard({ fixture }: { fixture: FixtureData }): React.ReactElement {
  const demo = useDemo();
  const [view, setView] = useState<ViewKind>('timeline');
  // The site's scheme until the reader picks one here.
  const [picked, setScheme] = useState<ColorScheme | null>(null);
  const scheme = picked ?? demo.scheme;
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
      <Controls>
        <Choice
          label={demo.t('controls.view')}
          options={VIEWS.map((kind) => ({ value: kind, label: demo.localization.views[kind] }))}
          value={view}
          onChange={setView}
        />
        <Choice
          label={demo.t('controls.scheme')}
          options={SCHEMES.map((value) => ({
            value,
            label: demo.t(value === 'light' ? 'controls.schemeLight' : 'controls.schemeDark'),
          }))}
          value={scheme}
          onChange={setScheme}
        />
        <Check label={demo.t('controls.compact')} checked={compact} onChange={setCompact} />
      </Controls>
      <div style={{ height: 560 }}>
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
    </div>
  );
}
