// SPDX-License-Identifier: MIT
// The three states a schedule can be in besides showing data: loading, an error with a retry, and
// empty. Loading over existing items keeps them visible and marks the region busy.
import { useState } from 'react';
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const STATES = ['data', 'loading', 'error', 'empty'] as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function States(): React.ReactElement {
  const demo = useDemo();
  const [state, setState] = useState<(typeof STATES)[number]>('loading');
  const items = demo.items({ seed: 71, count: 8, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });

  return (
    <div>
      <fieldset>
        <legend>{demo.t('controls.state')}</legend>
        {STATES.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="state"
              checked={state === value}
              onChange={() => {
                setState(value);
              }}
            />
            {demo.t(`controls.state${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
          </label>
        ))}
      </fieldset>
      <Scheduler
        view="list"
        items={state === 'empty' ? [] : items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={demo.date}
        now={demo.now}
        loading={state === 'loading'}
        {...(state === 'error' && {
          error: new Error('demo'),
          onRetry: () => {
            setState('data');
          },
        })}
        localization={demo.localization}
      />
    </div>
  );
}
