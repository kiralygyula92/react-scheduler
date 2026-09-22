# 0002 — Headless core and layout engine

Status: proposed (M1 checkpoint, 2026-09-22). D3 and D6 were decided by kiralygyula92 during M1 planning.
Scope: `packages/react-scheduler/src/core/`: the shift model, bucketing, the timeline layout engine, formatters, localization and the pure feature modules. Covers every place where the Feature Dossier needed an interpretation, and every place where its prose and its characterization data disagree.

## Context

Feature Dossier `01` §T.5 describes the timeline layout algorithm in prose. `05` F-01…F-31 generalize the behavior, and `characterization/` holds the executable truth (golden layouts, format samples, 67 scenarios). When prose and a scenario disagree, the scenario wins (Dossier README, precedence 5). The Dossier asks for such discrepancies to be logged in its `11-open-questions.md`; `spec/` is read-only here, so they are logged in `GAPS.md` (section "Dossier discrepancies") and decided below.

## Decisions

### D1 — Layout engine: exact algorithm, sorted structures (B-11)

`computeTimelineLayout` implements `01` §T.5 steps 1–7 without the source's pairwise scans:

- **Overlap components:** a sweep over starts.
- **Overlap count at an instant:** binary search in sorted starts and ends.
- **Columns:** sorted, non-overlapping interval lists, with per-rank order lists so promotion finds the weakest weaker item of a column directly.
- **Gap-fill density:** a range-add / range-max segment tree over elementary intervals.
- **Column counts:** a sweep plus a sparse table.

A test-only transcription of the prose (`test/support/reference-layout.ts`) is the oracle. It reproduces all six golden layouts. A fast-check differential test compares both implementations on 400 random inputs across every option (compact, both placements, caps 1–4, four merge windows, custom `compareItems`, zero-length and end-before-start items).

Measured medians (Node 24, this machine): 240 items 0.82 ms regular / 0.54 ms compact, against a budget of 8 ms (the source took about 290 ms); 1 000 items 3.1 ms, against a budget of 40 ms. The `[B-11]` performance test enforces both budgets.

### D2 — Readings of §T.5 that the goldens settle

- **Promotion considers every weaker placed item,** not only items overlapping the overflowed one: removing that item must leave its column free around the promoted one. Restricting promotion to overlapping items breaks `layout-baseline-day-compact`.
- **Greedy column ends reset per overlap component.** The goldens pass with either reading; per component is the natural reading of "placement sequence".
- **Gap fill has one effective pass.** The source's second, weakest-first pass tests the same predicate on the same state as the first, so it can never place anything; the engine runs strongest-first only.
- **Card order:** placed cards are listed by start, then column, which is the order of the golden files. The timeline lane uses the same order in the DOM.

### D3 — Overflow merge window measured from the anchor (B-10)

F-06's prose ("merge while `mergedEnd − mergedAnchor ≤ window`") contradicts `layout-crowded-regular.json`, which is recorded with defaults and has one group spanning 09:00–11:30 (2.5 h).

Decided by the user: a bucket joins the previous group when it overlaps the group (`previous.end > bucket.start`) **and** starts at most `overflowMergeWindow` after the group's anchor. All default goldens pass, and `large` passes with `Infinity`. With the default 2 h, the large fixture has 14 groups instead of one chip holding 157 items.

F-06's check that "each group's span is ≤ 2 h" is tested as "every merged bucket starts within 2 h of the anchor", since a single hour bucket can already end more than 2 h after its first start.

### D4 — Compact layouts can overlap cards (source behavior, kept)

In compact mode, promotion can move a card into a column at or above its group's column count. Promotion ignores the cap, while column counts are capped by `maxColumnsCompact`. The goldens contain 28 such cards, all with `columns = 1` (1 in `baseline-day-compact`, 27 in `large-compact`). `01` §T.4 draws them full width, so they overlap other cards. Random data also produces `columns ≥ 2` cases in compact mode, which would render outside the lane.

The engine keeps the exact output (parity). Regular mode with constant caps never shows it (property test). **Open for M2:** the rendering rule for `column ≥ columns` (`GAPS.md` DQ-3).

### D5 — Zero-length items

An item whose end is at or before its start counts as zero duration (`04` §3.2) and covers no instant (half-open intervals). It overlaps only an item that strictly contains its start. It can therefore land in a column that its own start does not count; the column-count invariant is asserted for positive durations only. It is rendered at `minCardHeight`.

### D6 — Locale-native formats; the Spanish golden reproduced on request (B-15)

Decided by the user: formatters follow the requested locale (es-ES prints 24-hour times), and fall back to en-US only when `Intl` lacks the locale. The es entries of `format-samples.json` were recorded from the source's forced 12-hour pattern. The parity test reproduces them through the public API with `locale: 'es-ES-u-hc-h12'`.

- **Compact hour labels:** built with `formatToParts`, dropping whitespace only between an hour and a day period ("8AM"; German "08 Uhr" stays).
- **Timestamps:** "since" and date-time values drop the comma between date and time.
- **U+202F:** engines differ on printing the narrow no-break space before day periods, so every output uses an ordinary space, as the goldens do.

### D7 — Input normalization

- A date-only string (`2031-03-12`) is local midnight, as `04` §2 says for strings without an offset. `Date` alone would read it as UTC.
- An invalid `end` falls back to `start + defaultDuration`; the source produced NaN geometry (`01` §7, inferred).
- An invalid `start` drops the item, with one development warning. For duplicate ids the first occurrence wins, with a warning.
- Unknown level keys rank after every known level.
- `getShiftWindows` throws `RangeError` for an invalid date. In development it also throws for an invalid `durationHours`, `anchor` or `pattern`; in production it falls back to the defaults.

### D8 — Pin rule at exact equality

F-07 pins when `sentinelTop ≤ line − epsilon`; the source's timeline used `<` (`01` §T.8). The generalized rule is used; the two differ only when a sentinel sits exactly on the line.

### D9 — Scenario assertions that describe a fixed bug

Some scenarios not tagged `bug` record behavior that a listed fix changes. The tests assert the fixed behavior and name the bug:

- **TL-13:** from scrollTop 2500 the top button now targets the current shift start (1986). The recorded −78 came from the consumer's expanded header (B-22).
- **BR-L02:** at the end of the list, "View current shift" no longer shows "(2 inherited)" (B-06).
- **L-14:** languages other than es no longer fall back to en-US (B-15).
- **TL-11:** the accessible name is the visible label; the recorded names become the hint (B-26).
- **L-14 "shift date":** the "March 12, 2031" label was passed but never rendered (`01` §1.1), so it is not part of the new API.

### D10 — Scope boundaries of the core

- **Measured offsets as input:** list and timeline rules take measured offsets (`ListMetrics`, `TimelineGeometry`), so they run without a DOM. The DOM engines (`/dom`) measure and scroll in M2.
- **`createScheduler()`** (docs pack `09` §4.3, level 6) is built in M2 with `useScheduler`, because its controlled/uncontrolled shape follows the React props.
- **Public surface:** feature modules are internal. `/core` exports exactly the `04` §8 functions and the core types (tested).
- **Overflow tie-break:** `sortOverflowItems` breaks ties with the comparator it is given. The React layer passes rank, then placement order, which is the parity tie-break "rank, then start, then id".
- **`pageList`:** 0-based, applying the Dossier's literal rule (first two, last two, current ±1, an ellipsis in every gap).

## Consequences

- The six golden layouts, the format samples, and all 15 unit scenarios pass through the public API.
- The pure rules of 38 of the 52 DOM and browser scenarios pass in core; they count as coverage only when the React components render them (M2).
- M2 must decide D4's rendering rule, wire the internal feature modules, and add the DOM engines.
