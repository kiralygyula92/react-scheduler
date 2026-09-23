// SPDX-License-Identifier: MIT
// The now marker appears only while now is inside the shift being read, on the day being read.
// Move the clock and watch it appear, move, and disappear.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const HOURS = [7, 10, 13] as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function NowMarker(): React.ReactElement {
  const demo = useDemo();
  const [hour, setHour] = useState<(typeof HOURS)[number]>(10);
  const items = demo.items({ seed: 53, count: 12, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <div>
      <fieldset>
        <legend>{demo.t('controls.clock')}</legend>
        {HOURS.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="clock"
              checked={hour === value}
              onChange={() => {
                setHour(value);
              }}
            />
            {`${String(value).padStart(2, '0')}:00`}
          </label>
        ))}
      </fieldset>
      <Scheduler
        view="timeline"
        items={items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={new Date(demo.at(hour))}
        now={new Date(demo.at(hour))}
        localization={demo.localization}
      />
    </div>
  );
}
