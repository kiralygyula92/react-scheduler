# @kingtech/react-scheduler

Shift schedules for React: a working day as a list or a timeline, for offices, factories and anywhere people work in shifts.

A working day as shifts, in a list or on a timeline: items placed by time and level, the ones that
matter kept in view as they scroll past, and every part replaceable. MIT licensed, with no runtime
dependencies beyond React.

**Documentation, demos and the Playground:** https://react-schedulerkit.vercel.app/react-scheduler/

## Install

```bash
npm install @kingtech/react-scheduler
```

## Usage

```tsx
import { Scheduler } from '@kingtech/react-scheduler';
import '@kingtech/react-scheduler/styles.css';

const items = [
  { id: 'a', start: '2031-03-12T09:00', end: '2031-03-12T10:30', level: 'critical', title: 'Handover' },
  { id: 'b', start: '2031-03-12T11:00', end: '2031-03-12T12:00', level: 'routine', title: 'Stock count' },
];

export function App() {
  return (
    <div style={{ height: 600 }}>
      <Scheduler items={items} />
    </div>
  );
}
```

Import the stylesheet once, where your application imports its global CSS.

`Scheduler` fills its container and scrolls inside it, so give the container a height — a fixed one,
or a flex or grid cell that has one. Without it, the schedule grows with its content and the shift
buttons have nothing to scroll.

## Peer dependencies

| Package     | Range                  |
| ----------- | ---------------------- |
| `react`     | `^18.2.0 \|\| ^19.0.0` |
| `react-dom` | `^18.2.0 \|\| ^19.0.0` |

The package has no runtime dependencies.

## Entry points

| Import                                         | Content                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `@kingtech/react-scheduler`                    | React components, hooks and types; English strings (`enUS`)      |
| `@kingtech/react-scheduler/core`               | Framework-agnostic functions: shifts, bucketing, layout, formats |
| `@kingtech/react-scheduler/headless`           | `createScheduler`, the framework-agnostic controller             |
| `@kingtech/react-scheduler/dom`                | DOM engines: pinning, navigation, compact detection              |
| `@kingtech/react-scheduler/locales/<language>` | One locale pack (`en`, `es`, `ro`, `hu`, `fr`, `de`, `pt`)       |
| `@kingtech/react-scheduler/locales`            | All locale packs                                                 |
| `@kingtech/react-scheduler/styles.css`         | Styles: both presets, both color schemes, densities              |
| `@kingtech/react-scheduler/base.css`           | Structural styles only, for unstyled mode                        |

## Localization

English is the default. Pass another pack through `localization`:

```tsx
import { roRO } from '@kingtech/react-scheduler/locales/ro';

<Scheduler items={items} localization={roRO} />;
```

| Pack   | Language                | Status                                      |
| ------ | ----------------------- | ------------------------------------------- |
| `enUS` | English (United States) | Default                                     |
| `esES` | Spanish (Spain)         | Newer strings not yet reviewed              |
| `roRO` | Romanian                | Draft, not yet reviewed by a native speaker |
| `huHU` | Hungarian               | Draft, not yet reviewed by a native speaker |
| `frFR` | French                  | Draft, not yet reviewed by a native speaker |
| `deDE` | German                  | Draft, not yet reviewed by a native speaker |
| `ptPT` | Portuguese (Portugal)   | Draft, not yet reviewed by a native speaker |

Dates, times and numbers follow the pack's `locale` through `Intl`.

## License

[MIT](./LICENSE) © kiralygyula92.
