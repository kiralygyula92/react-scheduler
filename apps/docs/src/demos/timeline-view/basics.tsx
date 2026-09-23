// SPDX-License-Identifier: MIT
// The timeline view with the defaults: one grid from the first shift's start to the last one's end,
// an hour label per elapsed hour, a boundary line at every shift change.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 1 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function TimelineBasics(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({
    count: 14,
    start: demo.at(6),
    hours: 16,
    levels: LEVEL_KEYS,
    withReferences: true,
  });

  return (
    <Scheduler
      view="timeline"
      items={items}
      levels={classicLevels}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      localization={demo.localization}
    />
  );
}
