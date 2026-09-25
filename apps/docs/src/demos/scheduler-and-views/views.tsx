// SPDX-License-Identifier: MIT
// One schedule, two views. The package draws no view switch, so this is what building one looks
// like: two buttons carrying `aria-pressed`, labelled from the locale pack the schedule uses.
import { useState } from 'react';
import { classicLevels, Scheduler, type ViewKind } from '@react-schedulerkit/react-scheduler';
import { Choice, Controls } from '../_shared/controls';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const VIEWS: readonly ViewKind[] = ['list', 'timeline'];
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Views(): React.ReactElement {
  const demo = useDemo();
  const [view, setView] = useState<ViewKind>('list');
  const items = demo.items({ count: 12, start: demo.at(6), hours: 8, levels: LEVEL_KEYS, withReferences: true });

  return (
    <div>
      <Controls>
        <Choice
          label={demo.t('controls.view')}
          options={VIEWS.map((kind) => ({ value: kind, label: demo.localization.views[kind] }))}
          value={view}
          onChange={setView}
        />
      </Controls>
      <div style={{ height: 560 }}>
        <Scheduler
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          view={view}
          onViewChange={setView}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
