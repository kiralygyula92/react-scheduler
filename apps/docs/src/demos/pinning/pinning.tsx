// SPDX-License-Identifier: MIT
// Pinning: a level may pin its items as they scroll past, an item may ask for it on its own, and
// `onPinnedChange` reports the set every time it changes.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 1, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Pinning(): React.ReactElement {
  const demo = useDemo();
  const [pinned, setPinned] = useState<readonly string[]>([]);
  const items = demo.items({
    seed: 41,
    count: 20,
    start: demo.at(-2),
    hours: 16,
    levels: LEVEL_KEYS,
    pinnableShare: 0.3,
  });

  return (
    <div>
      <p aria-live="polite">{demo.t('controls.pinnedCount', { count: pinned.length })}</p>
      <div style={{ height: 560 }}>
        <Scheduler
          view="list"
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          onPinnedChange={(ids) => {
            setPinned(ids);
          }}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
