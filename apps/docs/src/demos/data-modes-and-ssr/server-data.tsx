// SPDX-License-Identifier: MIT
// Fetching per rendered range: `onVisibleRangeChange` fires on mount and whenever the range moves,
// and `loading` over existing items keeps them on screen while the next answer arrives.
import { useEffect, useState } from 'react';
import { classicLevels, Scheduler, type SchedulerItem } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 1 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

interface Answer {
  readonly start: number;
  readonly items: readonly SchedulerItem[];
}

export default function ServerData(): React.ReactElement {
  const demo = useDemo();
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);

  // Stands in for a request: the same seeded generator, behind a delay.
  useEffect(() => {
    if (range === null) return;
    const start = range.start.getTime();
    const timer = setTimeout(() => {
      setAnswer({ start, items: demo.items({ seed: 83, count: 16, start, hours: 16, levels: LEVEL_KEYS }) });
    }, 600);
    return () => {
      clearTimeout(timer);
    };
  }, [range, demo]);

  // Loading is derived, not stored: it is true until the answer matches the range being shown.
  const loading = range === null || answer === null || answer.start !== range.start.getTime();

  return (
    <Scheduler
      view="list"
      items={answer?.items ?? []}
      levels={classicLevels}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      loading={loading}
      onVisibleRangeChange={setRange}
      localization={demo.localization}
    />
  );
}
