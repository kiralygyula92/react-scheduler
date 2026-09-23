// SPDX-License-Identifier: MIT
// Middleware runs before the component acts and decides whether it acts at all: here opening an
// item asks first, and a cancelled confirmation leaves the schedule as it was.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Middleware(): React.ReactElement {
  const demo = useDemo();
  const [log, setLog] = useState<readonly string[]>([]);
  const [guard, setGuard] = useState(true);
  const items = demo.items({ seed: 79, count: 10, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={guard}
          onChange={(event) => {
            setGuard(event.target.checked);
          }}
        />
        {demo.t('controls.guardOpening')}
      </label>
      <p aria-live="polite">{log.at(-1) ?? demo.t('controls.eventsIdle')}</p>
      <Scheduler
        view="list"
        items={items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={demo.date}
        now={demo.now}
        handlers={{
          onItemActivate: ({ item }, next) => {
            if (guard && item.level === 'critical') {
              setLog((entries) => [...entries, demo.t('controls.blocked', { title: item.title })]);
              return;
            }
            next();
          },
        }}
        onItemOpen={(item) => {
          setLog((entries) => [...entries, demo.t('controls.opened', { title: item.title })]);
        }}
        localization={demo.localization}
      />
    </div>
  );
}
