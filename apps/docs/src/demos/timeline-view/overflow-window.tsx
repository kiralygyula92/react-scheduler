// SPDX-License-Identifier: MIT
// `overflowMergeWindow` on a very busy day: consecutive hour buckets merge into one "+ more" group
// only while the merged group stays inside the window. The shorter the window, the more groups —
// and the closer each group stays to the hour it belongs to.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const WINDOWS = [15, 60, 120, Infinity];
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function TimelineOverflowWindow(): React.ReactElement {
  const demo = useDemo();
  const [minutes, setMinutes] = useState<number>(120);
  const items = demo.items({
    seed: 34,
    count: 90,
    start: demo.at(6),
    hours: 8,
    levels: LEVEL_KEYS,
    overlapDensity: 0.8,
  });

  const label = (value: number): string => {
    if (value === Infinity) return demo.t('controls.unlimited');
    return value < 60 ? demo.t('controls.minutes', { count: value }) : demo.t('controls.hours', { count: value / 60 });
  };

  return (
    <div>
      <fieldset>
        <legend>{demo.t('controls.mergeWindow')}</legend>
        {WINDOWS.map((value) => (
          <label key={String(value)}>
            <input
              type="radio"
              name="merge-window"
              checked={minutes === value}
              onChange={() => {
                setMinutes(value);
              }}
            />
            {label(value)}
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
        timeline={{ overflowMergeWindow: minutes * 60_000 }}
        localization={demo.localization}
      />
    </div>
  );
}
