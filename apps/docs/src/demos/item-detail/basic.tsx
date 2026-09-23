// SPDX-License-Identifier: MIT
// The built-in detail: activate any card and the dialog opens on it. Nothing here asks for that —
// the detail is what an item does when it is activated, in either view.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function BasicDetail(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({
    seed: 43,
    count: 9,
    start: demo.at(6),
    hours: 8,
    levels: LEVEL_KEYS,
    withReferences: true,
  });

  return (
    <Scheduler
      view="list"
      items={items}
      levels={classicLevels}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      localization={demo.localization}
    />
  );
}
