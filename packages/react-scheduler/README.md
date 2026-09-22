# @react-schedulerkit/react-scheduler

React Scheduler used to showcase a schedule in different domains, such as office or factory work.

> **Status:** under construction and not published to npm.

## Install

```bash
npm install @react-schedulerkit/react-scheduler
```

## Peer dependencies

| Package     | Range                  |
| ----------- | ---------------------- |
| `react`     | `^18.2.0 \|\| ^19.0.0` |
| `react-dom` | `^18.2.0 \|\| ^19.0.0` |

The package has no runtime dependencies.

## Entry points

| Import                                                   | Content                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| `@react-schedulerkit/react-scheduler`                    | React components, hooks and types; English strings (`enUS`)      |
| `@react-schedulerkit/react-scheduler/core`               | Framework-agnostic functions: shifts, bucketing, layout, formats |
| `@react-schedulerkit/react-scheduler/headless`           | `createScheduler`, the framework-agnostic controller             |
| `@react-schedulerkit/react-scheduler/dom`                | DOM engines: pinning, navigation, compact detection              |
| `@react-schedulerkit/react-scheduler/locales/<language>` | One locale pack (`en`, `es`, `ro`, `hu`, `fr`, `de`, `pt`)       |
| `@react-schedulerkit/react-scheduler/locales`            | All locale packs                                                 |
| `@react-schedulerkit/react-scheduler/styles.css`         | Styles: both presets, both color schemes, densities              |
| `@react-schedulerkit/react-scheduler/base.css`           | Structural styles only, for unstyled mode                        |

## Localization

English is the default. Pass another pack through `localization`:

```tsx
import { roRO } from '@react-schedulerkit/react-scheduler/locales/ro';

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

[MIT](LICENSE) © 2026 kiralygyula92
