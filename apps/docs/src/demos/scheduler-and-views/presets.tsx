// SPDX-License-Identifier: MIT
// The two presets side by side: `default` and `classic`. Both read the same items and the same
// levels; only the look changes.
import { useState } from 'react';
import { classicLevels, type PresetName, Scheduler } from '@react-schedulerkit/react-scheduler';
import { Choice, Controls } from '../_shared/controls';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const PRESETS = ['default', 'classic'] as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Presets(): React.ReactElement {
  const demo = useDemo();
  const [preset, setPreset] = useState<PresetName>('default');
  const items = demo.items({ seed: 11, count: 10, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <div>
      <Controls>
        <Choice
          label={demo.t('controls.preset')}
          options={PRESETS.map((value) => ({
            value,
            label: demo.t(value === 'default' ? 'controls.presetDefault' : 'controls.presetClassic'),
          }))}
          value={preset}
          onChange={setPreset}
        />
      </Controls>
      <div style={{ height: 560 }}>
        <Scheduler
          items={items}
          levels={classicLevels}
          shifts={SHIFTS}
          date={demo.date}
          now={demo.now}
          preset={preset}
          colorScheme={demo.scheme}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
