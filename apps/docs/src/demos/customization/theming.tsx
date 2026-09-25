// SPDX-License-Identifier: MIT
// One schedule under the three dials that decide its looks: the preset, the color scheme and the
// density. Nothing here touches CSS — they are props.
import { useState } from 'react';
import {
  classicLevels,
  type ColorScheme,
  type Density,
  type PresetName,
  Scheduler,
} from '@react-schedulerkit/react-scheduler';
import { Choice, Controls } from '../_shared/controls';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const DENSITIES: readonly Density[] = ['standard', 'comfortable', 'dense'];
const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];
const PRESETS: readonly PresetName[] = ['default', 'classic'];
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Theming(): React.ReactElement {
  const demo = useDemo();
  const [preset, setPreset] = useState<PresetName>('default');
  const [picked, setScheme] = useState<ColorScheme | null>(null);
  const scheme = picked ?? demo.scheme;
  const [density, setDensity] = useState<Density>('standard');
  const items = demo.items({ seed: 107, count: 10, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  const titled = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

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
        <Choice
          label={demo.t('controls.scheme')}
          options={SCHEMES.map((value) => ({ value, label: demo.t(`controls.scheme${titled(value)}`) }))}
          value={scheme}
          onChange={setScheme}
        />
        <Choice
          label={demo.t('controls.density')}
          options={DENSITIES.map((value) => ({ value, label: demo.t(`controls.density${titled(value)}`) }))}
          value={density}
          onChange={setDensity}
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
          colorScheme={scheme}
          density={density}
          localization={demo.localization}
        />
      </div>
    </div>
  );
}
