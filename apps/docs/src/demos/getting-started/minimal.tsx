// SPDX-License-Identifier: MIT
// The smallest useful schedule: items, the day they belong to, and nothing else.
import { Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

export default function Minimal(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({ count: 9, start: demo.at(6), hours: 8, levels: ['critical', 'normal', 'resolved'] });

  // The schedule fills its container and scrolls inside it, so the container has a height.
  return (
    <div style={{ height: 560 }}>
      <Scheduler
        items={items}
        date={demo.date}
        now={demo.now}
        colorScheme={demo.scheme}
        localization={demo.localization}
      />
    </div>
  );
}
