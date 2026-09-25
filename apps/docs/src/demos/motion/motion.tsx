// SPDX-License-Identifier: MIT
// Motion is one switch. `reducedMotion: 'auto'` follows the system; forcing it on removes every
// transition and makes each jump instant, which is what a reader who asked for that expects.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { Check, Controls } from '../_shared/controls';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 1, after: 1 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Motion(): React.ReactElement {
  const demo = useDemo();
  const [reduced, setReduced] = useState(false);
  const items = demo.items({ seed: 73, count: 24, start: demo.at(-2), hours: 20, levels: LEVEL_KEYS });

  return (
    <div>
      <Controls>
        <Check label={demo.t('controls.reducedMotion')} checked={reduced} onChange={setReduced} />
      </Controls>
      <div style={{ height: 560 }}>
        <Scheduler
          view="list"
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          reducedMotion={reduced ? true : 'auto'}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
