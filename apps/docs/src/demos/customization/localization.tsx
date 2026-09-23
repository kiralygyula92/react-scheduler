// SPDX-License-Identifier: MIT
// A locale pack is a plain object, so a partial override is a spread: here the empty-shift line and
// the pinned-strip label are replaced and everything else stays as the pack has it.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 1 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Localization(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({ seed: 103, count: 6, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <Scheduler
      view="list"
      items={items}
      levels={classicLevels}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      localization={{
        ...demo.localization,
        emptyShift: demo.t('localization.emptyShift'),
        pinnedStrip: { ...demo.localization.pinnedStrip, label: demo.t('localization.pinnedLabel') },
      }}
    />
  );
}
