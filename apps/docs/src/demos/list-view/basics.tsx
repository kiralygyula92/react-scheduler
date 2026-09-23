// SPDX-License-Identifier: MIT
// The list: one section per rendered shift, cards in time order, the section header sticking to the
// top while its shift is being read.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 1 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function ListBasics(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({
    seed: 3,
    count: 18,
    start: demo.at(6),
    hours: 16,
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
