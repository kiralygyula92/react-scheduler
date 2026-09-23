// SPDX-License-Identifier: MIT
// `maxColumns` on a crowded morning: the same items laid out in at most two, three or five columns.
// What does not fit the cap is merged into an overflow group and reached through "+ more".
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const CAPS = [2, 3, 5];
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function TimelineColumns(): React.ReactElement {
  const demo = useDemo();
  const [maxColumns, setMaxColumns] = useState(3);
  const items = demo.items({
    seed: 21,
    count: 26,
    start: demo.at(6),
    hours: 8,
    levels: LEVEL_KEYS,
    overlapDensity: 0.65,
  });

  return (
    <div>
      <fieldset>
        <legend>{demo.t('controls.maxColumns')}</legend>
        {CAPS.map((cap) => (
          <label key={cap}>
            <input
              type="radio"
              name="max-columns"
              checked={maxColumns === cap}
              onChange={() => {
                setMaxColumns(cap);
              }}
            />
            {cap}
          </label>
        ))}
      </fieldset>
      <Scheduler
        view="timeline"
        items={items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={demo.date}
        now={demo.now}
        timeline={{ maxColumns, maxColumnsCrowded: maxColumns }}
        localization={demo.localization}
      />
    </div>
  );
}
