import type { ComponentProps, RefObject } from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import {
  type ItemOf,
  type LevelDefinition,
  type OverflowGroup,
  Scheduler,
  type SchedulerHandle,
  type SchedulerItem,
  type SchedulerProps,
  type SlotProps,
  type TimelineLayout,
  useScheduler,
} from '../../src/index';

// Type-level tests (Feature Dossier 05 F-32): TItem is inferred from `items` and reaches callbacks,
// render props, handlers and slots; level keys are checked against `as const` levels.
const _levels = [{ key: 'high', pinOnPass: true }, { key: 'low' }] as const satisfies readonly LevelDefinition[];

type Task = ItemOf<typeof _levels, readonly [], { owner: string }>;

const tasks: readonly Task[] = [
  { id: 't1', start: '2031-03-12T09:00', level: 'high', title: 'A', data: { owner: 'x' } },
];

describe('type inference', () => {
  it('checks level keys against as-const levels', () => {
    expectTypeOf<Task['level']>().toEqualTypeOf<'high' | 'low'>();
    // @ts-expect-error: 'medium' is not a declared level.
    const wrong: Task = { id: 't2', start: 0, level: 'medium', title: 'B' };
    void wrong;
  });

  it('infers TItem from items in props, callbacks, render props, handlers and slots', () => {
    const element = (
      <Scheduler
        items={tasks}
        onItemOpen={(item) => expectTypeOf(item).toEqualTypeOf<Task>()}
        renderItem={(item, ctx) => {
          expectTypeOf(item.data).toEqualTypeOf<{ owner: string } | undefined>();
          return ctx.defaultRender();
        }}
        handlers={{
          onItemActivate: (ctx, next) => {
            expectTypeOf(ctx.item).toEqualTypeOf<Task>();
            next();
          },
          onMoreActivate: (ctx) => {
            expectTypeOf(ctx.group).toEqualTypeOf<OverflowGroup<Task>>();
          },
        }}
        slots={{
          listCard: (props) => {
            expectTypeOf(props.ownerState.item).toEqualTypeOf<Task | undefined>();
            const { Default, ownerState: _owner, ...rest } = props;
            return <Default {...rest} />;
          },
        }}
      />
    );
    void element;
  });

  it('types the handle, the headless hook and slot props', () => {
    expectTypeOf<SchedulerHandle<Task>['getLayout']>().returns.toEqualTypeOf<TimelineLayout<Task> | null>();
    expectTypeOf(useScheduler<Task>)
      .parameter(0)
      .toEqualTypeOf<SchedulerProps<Task>>();
    expectTypeOf<SlotProps<'navButton', Task>['navState']['label']>().toEqualTypeOf<string>();
    expectTypeOf<SchedulerProps['items']>().toEqualTypeOf<readonly SchedulerItem[] | undefined>();
  });

  it('lets prop getters spread onto any element and slotProps take element refs', () => {
    type Getters = ReturnType<typeof useScheduler<Task>>;
    expectTypeOf<ReturnType<Getters['getScrollerProps']>>().toExtend<ComponentProps<'div'>>();
    expectTypeOf<ReturnType<Getters['getSectionProps']>>().toExtend<ComponentProps<'section'>>();
    expectTypeOf<{ ref: RefObject<HTMLDivElement | null> }>().toExtend<
      NonNullable<SchedulerProps<Task>['slotProps']>['scroller']
    >();
  });
});
