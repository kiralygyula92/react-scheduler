// SPDX-License-Identifier: MIT
// `before` and `after` decide how much of the day around the current shift is rendered. Two shifts
// back and three forward is one scroller holding six shifts.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 2, after: 3 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function MoreShifts(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({ seed: 13, count: 40, start: demo.at(-16), hours: 48, levels: LEVEL_KEYS });

  return (
    <Scheduler
      items={items}
      levels={classicLevels}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      localization={demo.localization}
    />
  );
}
