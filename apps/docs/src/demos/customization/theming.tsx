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
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const DENSITIES: readonly Density[] = ['standard', 'comfortable', 'dense'];
const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];
const PRESETS: readonly PresetName[] = ['default', 'classic'];
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Theming(): React.ReactElement {
  const demo = useDemo();
  const [preset, setPreset] = useState<PresetName>('default');
  const [scheme, setScheme] = useState<ColorScheme>('light');
  const [density, setDensity] = useState<Density>('standard');
  const items = demo.items({ seed: 107, count: 10, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <div>
      <fieldset>
        <legend>{demo.t('controls.preset')}</legend>
        {PRESETS.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="theme-preset"
              checked={preset === value}
              onChange={() => {
                setPreset(value);
              }}
            />
            {demo.t(value === 'default' ? 'controls.presetDefault' : 'controls.presetClassic')}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{demo.t('controls.scheme')}</legend>
        {SCHEMES.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="theme-scheme"
              checked={scheme === value}
              onChange={() => {
                setScheme(value);
              }}
            />
            {demo.t(`controls.scheme${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{demo.t('controls.density')}</legend>
        {DENSITIES.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="theme-density"
              checked={density === value}
              onChange={() => {
                setDensity(value);
              }}
            />
            {demo.t(`controls.density${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
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
        colorScheme={scheme}
        density={density}
        localization={demo.localization}
      />
    </div>
  );
}
