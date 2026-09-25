// SPDX-License-Identifier: MIT
// The navigation buttons: where each one goes depends on the shift being read and on how far into
// it the reader is. `onNavigate` reports every jump, with the offset it went to.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 2, after: 2 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Navigation(): React.ReactElement {
  const demo = useDemo();
  const [log, setLog] = useState<readonly string[]>([]);
  const items = demo.items({
    seed: 47,
    count: 40,
    start: demo.at(-16),
    hours: 40,
    levels: LEVEL_KEYS,
    pinnableShare: 0.25,
  });

  return (
    <div>
      <p aria-live="polite">{log.at(-1) ?? demo.t('controls.navigateIdle')}</p>
      <div style={{ height: 560 }}>
        <Scheduler
          view="list"
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          onNavigate={(info) => {
            setLog((entries) => [...entries, demo.t('controls.navigated', { offset: info.to.offset })]);
          }}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
