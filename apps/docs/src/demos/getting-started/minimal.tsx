// SPDX-License-Identifier: MIT
// The smallest useful schedule: items, the day they belong to, and nothing else.
import { Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

export default function Minimal(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({ count: 9, start: demo.at(6), hours: 8, levels: ['critical', 'normal', 'resolved'] });

  return <Scheduler items={items} date={demo.date} now={demo.now} localization={demo.localization} />;
}
