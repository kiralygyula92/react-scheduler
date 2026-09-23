// SPDX-License-Identifier: MIT
// `compareItems` decides the order inside a shift — and with it the timeline's placement sequence
// and the pinned strip. Here it sorts by title; leaving it out is the default, which is by time.
import { useState } from 'react';
import { classicLevels, Scheduler, type SchedulerItem } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

const byTitle = (a: SchedulerItem, b: SchedulerItem): number => a.title.localeCompare(b.title);

export default function CompareItems(): React.ReactElement {
  const demo = useDemo();
  const [byName, setByName] = useState(false);
  const items = demo.items({ seed: 29, count: 12, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={byName}
          onChange={(event) => {
            setByName(event.target.checked);
          }}
        />
        {demo.t('controls.sortByTitle')}
      </label>
      <Scheduler
        view="list"
        items={items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={demo.date}
        now={demo.now}
        {...(byName && { compareItems: byTitle })}
        localization={demo.localization}
      />
    </div>
  );
}
