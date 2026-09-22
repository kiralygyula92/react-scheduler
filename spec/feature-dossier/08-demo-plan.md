# 08 — Demo plan

These are the demos the package repository ships. They are built from the package's own public API, and
they serve as manual test beds and as the source for documentation examples. The documentation site's own
milestones come from the docs pack. This plan covers the package demos only.

All sample data is **generated and copyright-free**: generic workplace tasks, invented titles, and dates in
2031 or relative to "today".

---

## 1. Capability demos

One minimal, self-contained example per feature. Each is a single file with its code shown next to the output.

| Demo | Feature | Shows |
|---|---|---|
| `basic` | F-03, F-04, F-05 | `<Scheduler items date>` with the defaults; toggling list/timeline |
| `classic-parity` | F-20 | `preset="classic"` beside the reference screenshot (image diff overlay toggle) |
| `shift-length` | F-01 | 8 h and 6 h regular shifts; anchor at 06:00 |
| `shift-pattern` | F-01 | irregular pattern: early 06:00, late 14:00, night 22:00 |
| `more-shifts` | F-01, F-08 | `before: 2, after: 3`; navigation labels "earlier"/"later" |
| `dst-day` | F-01, F-05 | a spring-forward date in a DST zone: 11 h night shift, correct boundary lines |
| `levels-custom` | F-02 | own 4-level scale with colours, a `pinOnPass` level, ranks reordered live |
| `compare-items` | F-02 | custom `compareItems` (by title) affecting the list, the timeline and the strip |
| `columns` | F-06 | `maxColumns` 2 / 3 / 5; crowded caps; compact cap |
| `column-placement` | F-06 | `'priority'` versus `'time'` side by side on the crowded fixture |
| `overflow-window` | F-06, F-13 | `overflowMergeWindow` slider (15 min … ∞) on the large fixture |
| `pinning` | F-07 | pin line visualised (debug overlay), per-item `pinned` / `pinnable`, `onPinnedChange` log |
| `navigation` | F-08 | carried-over count, navigation threshold, controlled `onNavigate` log |
| `header-signal` | F-09 | a real collapsing header driven by `onHeaderExpandedChange` (250 ms height transition) |
| `landing` | F-10 | every `LandingTarget` for list and timeline; a date picker changing `date` |
| `now` | F-11 | fake clock slider: the now marker in the list, the line in the timeline |
| `locales` | F-12 | all 7 packs; `locale` versus pack; `hourLabelFormat` |
| `overflow-columns` | F-13 | custom columns, controlled sort and page |
| `detail-custom` | F-14 | `renderItemDetail` with two detail layouts chosen from `item.data.kind` |
| `states` | F-15 | loading (first load and reload), error with retry, both empty states |
| `compact` | F-16 | resizable container: auto compact at 900, `listOnlyBreakpoint` at 600 |
| `reduced-motion` | F-17 | `reducedMotion` forced on/off |
| `accessibility` | F-18, F-19 | live axe report panel; keyboard path overlay; screen-reader text preview |
| `theming` | F-20 | token editor, density, colour scheme, `default` versus `classic` |
| `slots` | F-21 | custom card, chip, nav button and "+more" via slots; `slotProps` function form |
| `unstyled` | F-20, F-21 | `unstyled` plus a utility-class design built from `classNames` |
| `handlers` | F-22 | middleware that confirms before opening disabled-looking items; cancels navigation during a fake save |
| `render-props` | F-23 | `renderItem` with `getItemProps`, `renderTimeLabel`, `renderShiftHeader` |
| `flags` | F-24 | every `enableX` toggle |
| `events` | F-25 | a full event log with timestamps (ordering visible) |
| `imperative` | F-26 | buttons calling each handle method |
| `headless` | F-27 | both views rebuilt from `useScheduler` with plain markup |
| `ssr` | F-28 | server-rendered HTML snapshot and hydration (no warnings) |
| `rtl` | F-29 | `dir="rtl"` with a custom RTL test pack |
| `server-data` | F-31 | `onVisibleRangeChange` with a fake 600 ms fetch; `loading` with existing data |
| `typescript` | F-32 | typed levels with `as const`, `ItemOf`, typed `data` in `renderItemDetail` |

## 2. Scenario pages

One page per fixture in `characterization/fixtures/`, each with the view toggle, the theme toggle and the
compact toggle:

- `baseline-day`
- `empty`
- `sparse`
- `crowded`
- `night-shift`
- `past-date`
- `pinned-many`
- `large`

Each page also links the scenarios (`scenarios.json`) that use the fixture, and shows their `then`
statements as a checklist.

## 3. Playground

A single page with a live preview, an event log and a "Copy JSX" button that serialises the current setup.
The controls, grouped as in `04` §5:

| Group | Controls |
|---|---|
| Data | fixture select; generator (item count 0–1000, seed, density of overlaps, share of pinnable level); `date` picker; `now` (follow clock / fixed / offset slider); `loading`; `error` (with retry) |
| Model | levels editor (add/remove, reorder, colour, variant, `pinOnPass`); tags editor; `defaultDuration` |
| Shifts | mode (regular/pattern); `durationHours` (1, 2, 3, 4, 6, 8, 12, 24); `anchor`; pattern rows; `before`; `after` |
| View | `view`; `listOnlyBreakpoint`; `keepInactiveViewMounted`; `compact` (auto/on/off); `compactBreakpoint`; container width slider |
| List options | every `ListOptions` field |
| Timeline options | every `TimelineOptions` field, including `columnPlacement` and `overflowMergeWindow` |
| Pinning | edge, epsilon and hysteresis per view; debug overlay for pin lines |
| Header | `enableHeaderSignal`; demo header on/off |
| Detail and overflow | default versus custom detail; overflow page size |
| Flags | every `enableX` |
| Theming | `preset`, `colorScheme`, `density`, token overrides (colour pickers and numbers), `unstyled` |
| Localization | pack; `locale`; `dir`; `hourLabelFormat` |
| Debug | layout JSON viewer (`onLayout`); pinned ids; active shift; header value |

## 4. Sample data generator (copyright-free)

`createSampleItems({ seed, count, date, levels, overlapDensity, pinnableShare, withReferences, withTags })`:

- **Randomness:** a seeded PRNG (Park–Miller, as in the fixtures generator) keeps output deterministic.
- **Titles:** from an invented vocabulary of generic workplace tasks. Examples: "Delivery delay", "Staff briefing", "Inventory count", "Equipment check", "Safety inspection", "Supplier call", "Report review", "Maintenance window", "Training session", "Night check-in", "System update", "Backup verification", "Handover notes", "Cleaning round". An index suffix is added when the vocabulary runs out.
- **Descriptions:** "Short description for {title lowercased}." Suggestion: "Suggested next step."
- **Timing:**
  - Starts on a 15-minute grid within the rendered range.
  - Durations are drawn from {30, 45, 60, 90, 120} minutes; 10 % have no end.
  - Overlaps are increased by `overlapDensity`, which clusters starts.
- **Optional fields:**
  - reference numbers are 4-digit strings;
  - observed labels are "h:mm AM – Present";
  - `since` falls 0–3 h before the start.
- **No real data:** no real names, places, companies or domain terms.
