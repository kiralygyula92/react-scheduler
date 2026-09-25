// SPDX-License-Identifier: MIT
// The same schedule with markup of your own: `useScheduler` returns the model and the props to
// spread, and nothing here comes from the package's stylesheet.
import { classicLevels, useScheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function Headless(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({ seed: 89, count: 8, start: demo.at(6), hours: 8, levels: LEVEL_KEYS });
  const scheduler = useScheduler({
    items,
    levels: classicLevels,
    shifts: SHIFTS,
    date: demo.date,
    now: demo.now,
    localization: demo.localization,
  });

  return (
    <div {...scheduler.getRootProps()}>
      <div {...scheduler.getScrollerProps()} style={{ maxHeight: 320, overflowY: 'auto' }}>
        {scheduler.segments.map((segment) => (
          <section {...scheduler.getSectionProps(segment)} key={segment.shift.key}>
            <h4>{segment.shift.label}</h4>
            <ul>
              {segment.items.map((item) => (
                <li key={item.id}>
                  <button {...scheduler.getItemProps(item)} className="ds-button">
                    {item.title}
                    {' · '}
                    {scheduler.formatters.clockTime(new Date(Number(item.start)))}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
