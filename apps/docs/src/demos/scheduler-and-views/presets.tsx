// SPDX-License-Identifier: MIT
// The two presets side by side: `default` and `classic`. Both read the same items and the same
// levels; only the look changes.
import { useState } from 'react';
import { classicLevels, type PresetName, Scheduler } from '@react-schedulerkit/react-scheduler';
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
      <fieldset>
        <legend>{demo.t('controls.preset')}</legend>
        {PRESETS.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="preset"
              checked={preset === value}
              onChange={() => {
                setPreset(value);
              }}
            />
            {demo.t(value === 'default' ? 'controls.presetDefault' : 'controls.presetClassic')}
          </label>
        ))}
      </fieldset>
      <Scheduler
        items={items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={demo.date}
        now={demo.now}
        preset={preset}
        localization={demo.localization}
      />
    </div>
  );
}
