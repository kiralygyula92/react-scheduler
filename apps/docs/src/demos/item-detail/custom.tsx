// SPDX-License-Identifier: MIT
// `renderItemDetail` replaces the dialog with whatever your application already uses for detail.
// It receives the item, how it was opened, and the way to close it.
import { classicLevels, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function CustomDetail(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({
    seed: 61,
    count: 10,
    start: demo.at(6),
    hours: 8,
    levels: LEVEL_KEYS,
    withReferences: true,
  });

  return (
    <Scheduler
      view="list"
      items={items}
      levels={classicLevels}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      renderItemDetail={({ item, close }) => (
        <aside aria-label={item.title}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <p>{demo.t('detail.reference', { reference: item.reference ?? '—' })}</p>
          <button type="button" onClick={close}>
            {demo.t('detail.close')}
          </button>
        </aside>
      )}
      localization={demo.localization}
    />
  );
}
