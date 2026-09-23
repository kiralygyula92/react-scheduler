// SPDX-License-Identifier: MIT
// Motion is one switch. `reducedMotion: 'auto'` follows the system; forcing it on removes every
// transition and makes each jump instant, which is what a reader who asked for that expects.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 1, after: 1 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Motion(): React.ReactElement {
  const demo = useDemo();
  const [reduced, setReduced] = useState(false);
  const items = demo.items({ seed: 73, count: 24, start: demo.at(-2), hours: 20, levels: LEVEL_KEYS });

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={reduced}
          onChange={(event) => {
            setReduced(event.target.checked);
          }}
        />
        {demo.t('controls.reducedMotion')}
      </label>
      <Scheduler
        view="list"
        items={items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={demo.date}
        now={demo.now}
        reducedMotion={reduced ? true : 'auto'}
        localization={demo.localization}
      />
    </div>
  );
}
