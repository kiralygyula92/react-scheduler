---
'@react-schedulerkit/react-scheduler': minor
---

Add six locale packs, `esES`, `roRO`, `huHU`, `frFR`, `deDE` and `ptPT` (European Portuguese), each at `@react-schedulerkit/react-scheduler/locales/<language>` and together at `@react-schedulerkit/react-scheduler/locales`; all but English are drafts awaiting native review. `createScheduler` moves from `/core` to its own entry, `@react-schedulerkit/react-scheduler/headless`. Right-to-left layouts now mirror fully when the direction comes from an ancestor: the navigation buttons stay centered, and the alert tint and the pinned strip's edge fades follow the inline direction. In the default preset the overflow table's actions column is 96 px wide, so every locale's header fits. A list navigation no longer flashes when the pinned strip collapses on arrival, the pinned strip's track is no longer an extra tab stop in Firefox, and the internal clock stops when the now indicator is turned off.
