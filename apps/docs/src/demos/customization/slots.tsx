// SPDX-License-Identifier: MIT
// Two parts replaced: the "+ more" chip and the level pill. A slot keeps the part's place, its
// props and its behaviour — spread what it gives you and wrap it in whatever you like.
import { classicLevels, Scheduler, type SchedulerItem, type SlotProps } from '@react-schedulerkit/react-scheduler';
import { useDemo } from '../_shared/useDemo';

const SHIFTS = { durationHours: 8, anchor: '06:00', before: 0, after: 0 } as const;
const LEVEL_KEYS = classicLevels.map((level) => level.key);

function LevelPill({ ownerState, Default, ...props }: SlotProps<'levelPill', SchedulerItem>): React.ReactElement {
  // Spreading what the slot is given keeps the ref, the classes and the handlers; `ownerState`
  // carries the resolved level, so the strongest one can be drawn heavier than the rest.
  const strongest = ownerState.level?.rank === 0;
  return (
    <Default
      {...props}
      style={{
        ...props.style,
        borderRadius: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontWeight: strongest ? 700 : 500,
      }}
    />
  );
}

export default function Slots(): React.ReactElement {
  const demo = useDemo();
  const items = demo.items({
    seed: 101,
    count: 40,
    start: demo.at(6),
    hours: 8,
    levels: LEVEL_KEYS,
    overlapDensity: 0.7,
  });

  return (
    <Scheduler
      view="timeline"
      items={items}
      levels={classicLevels}
      shifts={SHIFTS}
      date={demo.date}
      now={demo.now}
      slots={{ levelPill: LevelPill }}
      slotProps={{ moreChip: { style: { fontWeight: 700 } } }}
      localization={demo.localization}
    />
  );
}
