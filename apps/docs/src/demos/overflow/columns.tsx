// SPDX-License-Identifier: MIT
// The overflow table with columns of your own: a reference number that sorts as a number, the
// title, and the level. Open a "+ more" chip in the grid to see it.
import { classicLevels, type OverflowColumn, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

export default function OverflowColumns(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({
    seed: 59,
    count: 70,
    start: demo.at(6),
    hours: 8,
    levels: LEVEL_KEYS,
    overlapDensity: 0.8,
    withReferences: true,
  });

  const columns: readonly OverflowColumn<(typeof items)[number]>[] = [
    {
      id: 'reference',
      header: demo.t('columns.reference'),
      minWidth: 96,
      sortValue: (item) => Number(item.reference ?? 0),
      renderCell: (item) => item.reference ?? '',
    },
    { id: 'title', header: demo.t('columns.title'), sortValue: (item) => item.title, renderCell: (item) => item.title },
    {
      id: 'level',
      header: demo.t('columns.level'),
      align: 'end',
      sortValue: (item) => item.level,
      renderCell: (item) => item.level,
    },
  ];

  return (
    <div style={{ height: 560 }}>
      <Scheduler
        view="timeline"
        items={items}
        levels={classicLevels}
        shifts={SHIFTS}
        date={demo.date}
        now={demo.now}
        overflowColumns={columns}
        overflowPageSize={6}
        colorScheme={demo.scheme}
        localization={demo.localization}
      />
    </div>
  );
}
