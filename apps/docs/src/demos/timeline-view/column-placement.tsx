// SPDX-License-Identifier: MIT
// `columnPlacement` on the same crowded morning. `'priority'` (the default) groups the items that
// overlap and lets the most important one take the left column; `'time'` keeps plain start order, so
// whatever started first stays on the left.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { Choice, Controls } from '../_shared/controls';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const PLACEMENTS = ['priority', 'time'] as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function TimelineColumnPlacement(): React.ReactElement {
  const demo = useDemo();
  const [placement, setPlacement] = useState<(typeof PLACEMENTS)[number]>('priority');
  const items = demo.items({
    seed: 21,
    count: 20,
    start: demo.at(6),
    hours: 8,
    levels: LEVEL_KEYS,
    overlapDensity: 0.6,
  });

  return (
    <div>
      <Controls>
        <Choice
          label={demo.t('controls.columnPlacement')}
          options={PLACEMENTS.map((value) => ({
            value,
            label: demo.t(value === 'priority' ? 'controls.placementPriority' : 'controls.placementTime'),
          }))}
          value={placement}
          onChange={setPlacement}
        />
      </Controls>
      <div style={{ height: 560 }}>
        <Scheduler
          view="timeline"
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          timeline={{ columnPlacement: placement }}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
