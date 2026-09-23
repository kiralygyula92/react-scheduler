// SPDX-License-Identifier: MIT
// Everything here is reachable with a keyboard alone. Press Tab from the button below and walk the
// schedule: pinned chips, the top navigation, the cards in time order, then the bottom navigation.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 1, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Keyboard(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({
    seed: 97,
    count: 14,
    start: demo.at(-2),
    hours: 16,
    levels: LEVEL_KEYS,
    pinnableShare: 0.3,
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
      aria-label={demo.t('controls.scheduleLabel')}
      localization={demo.localization}
    />
  );
}
