// SPDX-License-Identifier: MIT
// Two numbers that change how the list behaves while it is read: when the navigation buttons appear
// at all, and how far you have to scroll before the button back to the top does.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { Choice, Controls } from '../_shared/controls';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 1, after: 1 } as const;
const THRESHOLDS = [5, 40] as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function ListOptionsDemo(): React.ReactElement {
  const demo = useDemo();
  const [threshold, setThreshold] = useState<(typeof THRESHOLDS)[number]>(5);
  const items = demo.items({ seed: 17, count: 24, start: demo.at(-2), hours: 24, levels: LEVEL_KEYS });

  return (
    <div>
      <Controls>
        <Choice
          label={demo.t('controls.navigationThreshold')}
          options={THRESHOLDS.map((value) => ({ value, label: demo.t('controls.items', { count: value }) }))}
          value={threshold}
          onChange={setThreshold}
        />
      </Controls>
      <div style={{ height: 560 }}>
        <Scheduler
          view="list"
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          list={{ navigationThreshold: threshold, scrollTopThreshold: 96 }}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
