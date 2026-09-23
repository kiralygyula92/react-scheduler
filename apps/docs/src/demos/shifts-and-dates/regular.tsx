// SPDX-License-Identifier: MIT
// Regular shifts: one length, one anchor. Eight hours from 06:00, or six hours from 00:00 — the
// rest of the day follows from those two numbers.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const LENGTHS = [8, 6] as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function RegularShifts(): React.ReactElement {
  const demo = useDemo();
  const [hours, setHours] = useState<(typeof LENGTHS)[number]>(8);
  const items = demo.items({ seed: 5, count: 12, start: demo.at(6), hours: 10, levels: LEVEL_KEYS });

  return (
    <div>
      <fieldset>
        <legend>{demo.t('controls.shiftLength')}</legend>
        {LENGTHS.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="shift-length"
              checked={hours === value}
              onChange={() => {
                setHours(value);
              }}
            />
            {demo.t('controls.hours', { count: value })}
          </label>
        ))}
      </fieldset>
      <Scheduler
        items={items}
        levels={classicLevels}
        shifts={{ durationHours: hours, anchor: '06:00', before: 0, after: 0 }}
        date={demo.date}
        now={demo.now}
        localization={demo.localization}
      />
    </div>
  );
}
