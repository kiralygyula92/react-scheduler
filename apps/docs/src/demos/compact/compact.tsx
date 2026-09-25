// SPDX-License-Identifier: MIT
// Compact mode follows the width of the schedule's own container, not the viewport: resize the box
// below `compactBreakpoint` and the cards, the chips and the timeline caps change with it.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { Choice, Controls } from '../_shared/controls';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const WIDTHS = [1000, 700, 420] as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Compact(): React.ReactElement {
  const demo = useDemo();
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(1000);
  const items = demo.items({ seed: 67, count: 14, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <div>
      <Controls>
        <Choice
          label={demo.t('controls.containerWidth')}
          options={WIDTHS.map((value) => ({ value, label: demo.t('controls.pixels', { count: value }) }))}
          value={width}
          onChange={setWidth}
        />
      </Controls>
      <div style={{ maxWidth: width, height: 560 }}>
        <Scheduler
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
