// SPDX-License-Identifier: MIT
// A scale of your own: four ranks, their colors, and one that pins when it scrolls past. The keys
// are yours, so the item type follows them and a typo is a type error.
import { type LevelDefinition, Scheduler } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const LEVELS = [
  { key: 'blocking', rank: 0, color: '#b3261e', onColor: '#ffffff', variant: 'alert', pinOnPass: true },
  { key: 'attention', rank: 1, color: '#a16207', onColor: '#ffffff' },
  { key: 'planned', rank: 2, color: '#1d4ed8', onColor: '#ffffff' },
  { key: 'done', rank: 3, color: '#4b5563', onColor: '#ffffff', variant: 'muted' },
] as const satisfies readonly LevelDefinition<string>[];

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const KEYS = LEVELS.map((level) => level.key);

export default function CustomLevels(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({ seed: 23, count: 14, start: demo.at(6), hours: 8, levels: KEYS });

  return (
    <Scheduler
      items={items}
      levels={LEVELS}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      localization={{
        ...demo.localization,
        levels: {
          blocking: demo.t('levels.blocking'),
          attention: demo.t('levels.attention'),
          planned: demo.t('levels.planned'),
          done: demo.t('levels.done'),
        },
      }}
    />
  );
}
