# Feature Dossier — React Scheduler

A complete, sanitized specification for rebuilding an existing **shift scheduling feature**. The feature has
a list view of shift sections and a 36-hour timeline grid. The rebuild is a standalone, **MIT-licensed,
zero-dependency** React package, extended into a fully customizable library.

The feature was reverse-engineered from a production code base. Everything here is generic: no project,
product, client, people, domain or file names from the source are included (see "Zero-reference" below).

## Carried-over inputs

| Input | Value |
|---|---|
| Package name (working) | `react-scheduler` — taken on the public registry; final scoped name is open question Q-01 |
| Display name | React Scheduler |
| CSS prefix | `rs` → classes `rs-*`, attributes `data-rs-*`, variables `--rs-*` |
| Engine peer | **none** — React and React DOM (`>=18.2 <20`) are the only peers |
| Denylist salt | `k3v9-q1x7` (see `09-quality.md` §7) |

## Scope

**In scope** (rebuilt natively):
- the list view and the timeline view;
- the shift model (windows and bucketing);
- the timeline layout engine (columns, overflow groups);
- pin-on-pass with the pinned strip, shift navigation, the header-expanded signal and scroll landing;
- the now indicator;
- the overflow dialog with a sortable, paginated table;
- a default item detail dialog;
- empty, loading and error states;
- compact and responsive behaviour, motion and accessibility;
- localization, theming and customization.

**Out of scope:**
- the server API client and authentication;
- the source's domain-specific detail dialogs (replaced by `renderItemDetail`);
- the consumer's summary header, date picker and filters (the library emits a header-expanded signal and offers a header slot);
- server-paged overflow, week/resource views and editing workflows (except v1.x drag-and-drop).

## Reading order

1. `01-behaviour-spec.md` — how the feature behaves **today** (parity reference).
2. `02-visual-spec.md` — measured visual values; the `classic` preset.
3. `07-parity-and-bugs.md` — the definition of parity; bugs **B-01…B-26** with fixes.
4. `04-api-reference.md` — the public API (names and signatures).
5. `05-features.md` — behaviour of every v1.0 and v1.x capability.
6. `06-customization-theming.md` — parts, slots, tokens, presets, density, unstyled mode, localization (7 packs).
7. `03-dependency-audit.md` — imports, licences, native replacements.
8. `09-quality.md` — tests, budgets, browser matrix, zero-reference scan, licence checks.
9. `08-demo-plan.md` — demos, scenario pages, playground, sample data.
10. `10-roadmap.md` — milestones and acceptance criteria.
11. `11-open-questions.md` — unresolved items with proposed defaults.
12. `characterization/` — scenarios, fixtures, golden outputs, screenshots and measured styles.

## Precedence (when documents disagree)

1. **`04` wins for names, types and signatures.**
2. **`07` wins over `01`** for any behaviour marked as a bug: fixes are implemented, bugs are not reproduced.
3. **`05` wins for behaviour** of anything beyond parity, and for the generalised rules. At default options,
   `05` MUST reduce to `01` (plus `07` fixes).
4. **`02` wins for visual values** of the `classic` preset. `06` wins for token names and the `default` preset.
5. **`characterization/`** (scenarios and golden files) is the executable truth for parity. If prose and a
   scenario disagree, the scenario wins; log the discrepancy in `11`.
6. Anything still unclear → `11-open-questions.md` (use the proposed default).

## Engine decision

**No engine peer.** Everything the source used third-party code for is re-implemented natively:
- UI kit components → native elements, including `<dialog>`;
- CSS-in-JS → a static stylesheet with CSS variables;
- icons → hand-drawn SVG;
- the i18n runtime → a localization object plus `Intl`;
- the state store → local state plus controlled props.

Details and licences are in `03`.

## Naming map

Concepts as described in `01`, mapped to the generic names used everywhere else.

| Concept (today) | Generic name |
|---|---|
| Page-level host that mounts both views and switches between them | `<Scheduler>` (`view="list" \| "timeline"`) |
| Compact-first vertical list of shift sections | `ListView` |
| 36-hour hourly grid with positioned cards | `TimelineView` |
| Scheduled entry | `SchedulerItem` (`start`, `end`, `level`, `title`, `description`, `suggestion`, `tags`, `reference`, `observedLabel`, `since`, `data`) |
| Severity category and its priority order | `level`, `levels[].rank` |
| "Only the top level sticks when scrolled past" | `levels[].pinOnPass`, pinning |
| "Impacts next shift" / "inherited" badges | tags `impactsNextShift` / `carriedOver` |
| Reference-number badge | `reference`, `ReferencePill` |
| Previous / current / next shift, day / night | `ShiftWindow` with `offset` and `role`; shift `key` (`day` / `night`) |
| Selected date, wall clock, loading flag | `date`, `now`, `loading` |
| Consumer header expand/collapse signal | `headerExpanded` / `onHeaderExpandedChange` |
| Sticky strip of critical chips | `PinnedStrip` / `PinnedChip` |
| Areas above and below the scrolling content | `StickyTop` / `StickyBottom` |
| Previous/current/next jump buttons | `ShiftNavButton` (`position: 'top' \| 'bottom'`) |
| "(N inherited)" suffix | carried-over count |
| Shift section title + range | `ShiftHeader` |
| List card / grid card | `ListCard` / `TimelineCard` |
| Hour gutter, grid, off-shift bands, hour lines | `TimeGrid` (`TimeGutter`, `HourLabel`, `OffShiftBand`, `HourLine`) |
| Now line + time pill | `NowIndicator` (`nowLine`, `nowLabel`; list: `nowMarker`) |
| Column-packing layout algorithm | `computeTimelineLayout` |
| Start → rank → id ordering | `compareByPlacement` (placement order) |
| "+more" chip and its dialog/table | `MoreChip`, `OverflowDialog`, `OverflowTable` |
| Severity pill, diamond marker, tooltip, scroll-to-top button | `LevelPill`, `DiamondIcon`, `Tooltip`, `ScrollTopButton` |
| Mobile/narrow mode | `compact` (`'auto'` = container width) |
| Domain detail dialogs | `renderItemDetail` / `DefaultItemDetail` |
| Theme palette and translation namespace | `--rs-*` tokens, `SchedulerLocalization` keys |

## Zero-reference

- `denylist.sha256.txt` holds salted SHA-256 hashes of every source-specific term found during extraction (253 terms). The terms themselves never leave the source environment.
- The new repository MUST run the scan in `09` §7 in CI.
- This dossier passed the same scan with zero hits, and a plain-text search for every term returned nothing.

## Evidence

- 45 unit/DOM characterization tests (passing in two time zones) and 22 real-browser tests passed against the source before export. They are summarised as **67 scenarios** in `characterization/scenarios.json`.
- The source's measured performance and visual values are recorded in `01` §11 and `02`.
