// SPDX-License-Identifier: MIT
// An irregular pattern: early at 06:00, late at 14:00, night at 22:00. Each entry ends where the
// next one starts, and the last wraps around midnight.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = {
  pattern: [
    { key: 'early', start: '06:00' },
    { key: 'late', start: '14:00' },
    { key: 'night', start: '22:00' },
  ],
  before: 1,
  after: 1,
} as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function ShiftPattern(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({ seed: 8, count: 16, start: demo.at(6), hours: 16, levels: LEVEL_KEYS });

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
