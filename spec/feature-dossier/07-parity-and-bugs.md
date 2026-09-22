# 07 — Parity definition and bug list

## 1. What "parity" means

The library reaches parity when **all** of the following hold. Each item has a matching test in the new
repository.

1. **Behaviour parity:**
   - Every scenario in `characterization/scenarios.json` passes against the new library, re-expressed through the API of `04`. The mapping is in §3.
   - Scenarios tagged `bug` expect the **fixed** behaviour described in §4, not the recorded one.
2. **Engine parity:**
   - `computeTimelineLayout` reproduces every golden file in `characterization/golden/` exactly.
   - The `large` fixture runs with `overflowMergeWindow: Infinity` (B-10); every other file uses the defaults.
3. **Format parity:** `golden/format-samples.json` is reproduced for `en-US`. For `es-ES`, only the clock time and boundary range formats are compared.
4. **Visual parity:**
   - With `preset="classic"`, the screenshots in `characterization/screenshots/` are reproduced within the tolerance in `09` §4.
   - Rendering conditions: fixtures, viewport, time zone UTC, locale en-US, device pixel ratio 1, both fonts installed, animations off.
   - Where a bug fix intentionally changes pixels, those regions are masked (§5).
5. **Consumer parity:** the source's three mounts can be expressed with `<Scheduler>` as in `04` §10, and nothing else is needed.

**Tolerances:**
- Scroll positions ±1 px (the source corrects to ±1 px);
- geometry ±0.5 px;
- timings are not compared (budgets are in `09`).

## 2. Known limitations (from the brief) → extension features

| Limitation today | Resolved by |
|---|---|
| Exactly two fixed view modes | F-03 wrapper + standalone views; view switch toolbar (F-44, v1.x) |
| Always 3 shifts | `shifts.before` / `after` (F-01) |
| Shift length fixed at 12 h | `shifts.durationHours` (F-01) |
| Shift start/end fixed at 08:00 / 20:00 | `shifts.anchor`, `shifts.pattern` (F-01) |
| Column count fixed (3 / 3 / 1) | `timeline.maxColumns`, `maxColumnsCrowded`, `maxColumnsCompact` (F-06) |
| Card priority order fixed | `levels` order / rank, `compareItems` (F-02) |
| Left-column placement fixed to priority | `timeline.columnPlacement: 'time'` (F-06) |
| Nothing overridable | slots, render props, handlers, tokens, presets (F-20 … F-23) |

## 3. Re-expressing scenarios

| Scenario field | New API |
|---|---|
| `given.fixture` | `items` = fixture items mapped as: `level` unchanged; `tags` unchanged; `observedLabel`, `since`, `reference`, `suggestion` unchanged; `detail` → `data.kind` (consumed by the test's `renderItemDetail`) |
| `given.fixture.selectedDate` / `now` | `date`, `now` |
| `given.view` | `view` on `<Scheduler>`, or render `<ListView>` / `<TimelineView>` |
| `given.compact` | `compact={true}`, or a root width below 900 |
| `given.loading` | `loading` |
| `given.headerExpanded` | `headerExpanded` (controlled) |
| `given.roles` / `userRole` | ignored (B-09) |
| "header signal" in `then` | `onHeaderExpandedChange` — compare values only; the new library emits only on change |
| "detail view / dialog named X opens" | `onItemOpen` is called with the item, and the default detail dialog (or the test's `renderItemDetail`) is labelled X |
| test ids and DOM structure | `data-rs-part` attributes (06 §1) |
| scroll positions | the same numbers: classic preset, standard density, default options |

## 4. Bug list

**Severity levels:**
- **S1** — wrong data or information shown, or a user blocked;
- **S2** — noticeably wrong behaviour or an accessibility failure;
- **S3** — cosmetic, performance or robustness.

"Repro" cites a scenario or gives the steps. Every fix is **MUST** unless marked otherwise.

| ID | Sev | Bug (current behaviour) | Repro | Fix |
|---|---|---|---|---|
| **B-01** | S2 | The list view never shows the now indicator; the source computes it and passes it down, but it is never rendered. | `[LV-08]` | List now marker (F-04, F-11). |
| **B-02** | S2 | The list ignores `loading` (content or the empty text renders instead). Neither view shows an error state. | `[LV-09]`; pass an error: nothing changes | Loading and error states in both views; keep existing data visible and dimmed while reloading (F-15). |
| **B-03** | S2 | An open detail view unmounts when its item disappears from the data and **reopens by itself** when the item returns. | `[LV-12]` | Close with reason `itemRemoved` and clear the open id (F-14). |
| **B-04** | S3 | On a list→timeline switch the timeline emits "collapsed" and then immediately "expanded" when the landing is above the collapse threshold, so the header flickers. | `[BR-T05]` | Compute the signal once after the landing settles (F-09). |
| **B-05** | S2 | Timeline pinning uses the line "scroller top + sticky height", although the sticky top is outside the scroller. Cards still visible (up to one sticky height) are pinned, so they appear twice. | `[BR-T02]` | Pin line = scroller visible top (F-07). |
| **B-06** | S3 | The "(N inherited)" count means different things in the two views (list: all pinned-level items of the previous shift; timeline: only the currently pinned ones). The list shows it even when the button says "View current shift". | `[LV-06]`, `[BR-T01]`, `[BR-L02]` | One definition: pinnable items in shifts with offset < 0. Shown only when the top button targets an earlier shift (F-08). |
| **B-07** | S1 | Shift windows are fixed 12 h durations in milliseconds. On DST days the boundaries drift (the night shift ends at 09:00), and hour-of-day boundary lines misalign. | `[L-13]` (DST zone) | Wall-clock boundaries (F-01); boundary lines by timestamp (F-05). |
| **B-08** | S3 | The list header-collapse rule takes the "3rd card" from a selector that also matches the hidden pin sentinels. With pinned-level cards first, the threshold moves up by one card per sentinel. | `[LV-14]` (threshold at 878) | Count only cards (F-09). |
| **B-09** | S3 | The timeline's user-role branch for the first landing yields the same target as the other branch (dead code); the consumer passes a role only for this. | `[TL-08]`, `[TL-09]` | Drop the role input; landing is configurable instead (F-10). |
| **B-10** | S2 | Overflow buckets merge transitively while ranges overlap. Dense data collapses into **one** "+more" chip at the earliest hour (240 items → one chip with 157), hiding items many hours later. | `golden/layout-large-regular.json` | `overflowMergeWindow` (default 2 h) (F-06). |
| **B-11** | S3 | The layout engine is super-linear (pairwise overlap tests, repeated scans): ~290 ms for 240 items in Node; ~200 ms to mount the timeline. | `[L-10]`, `[PERF]` | Sweep-line implementation with identical output; budget in `09` (F-06, F-30). |
| **B-12** | S2 | Scrolling the list with many items produces 50–60 ms long tasks (p95 frame 62 ms): the list's pin refresh reads every pinned-level card's rect each frame. | `[PERF]` `scroll.list.large` | Observer-based pinning with a single measurement pass (F-07). |
| **B-13** | S3 | The timeline's pin hook re-attaches its scroll listener on every render. | code review | Attach once per mount (F-07). |
| **B-14** | S3 | Both views stay mounted on desktop; the hidden one keeps its listeners, observers and timers running. | consumer mount | Mount only the active view; `keepInactiveViewMounted` pauses the other (F-03). |
| **B-15** | S2 | Formats and strings are hard-coded:<ul><li>hour labels are always en-US;</li><li>the "since" timestamp is always the US pattern;</li><li>only en/es are recognised for dates (every other language falls back to en-US);</li><li>the dialog close button's accessible name is English-only.</li></ul> | `[L-14]`, `[L-15]` | Locale-aware formatters and localization keys (F-12, F-13). |
| **B-16** | S3 | Compact mode is true for any mobile user agent at any width, and uses a 900 px viewport query. The consumer uses 600 px, so between 600 and 899 px the timeline is shown in compact mode. | code review; `[BR-L08]` | Container-width detection, no user-agent sniffing; `listOnlyBreakpoint` for the consumer rule (F-16, F-03). |
| **B-17** | S2 | The pinned strip is a polite, atomic `status` live region wrapping interactive buttons: every change re-announces all chips, and the buttons live inside a live region. | code review | A labelled region with a list, plus a separate throttled announcement (F-18). |
| **B-18** | S2 | The list card activator is a `div role="button"`; the timeline card is a `<button>` containing block elements. For both, the accessible name is the title only (level and time are not exposed). | `[LV-07]`, `[TL-03]` | A `<button>` with phrasing content only; level, time and tags via `aria-describedby`; list semantics (F-18). |
| **B-19** | S2 | Dark-scheme contrast failures:<ul><li>scroll-to-top button, spinner and "+more" focus ring are `#000000` on `#121212`;</li><li>white text on light level pills (1.97–4.07:1);</li><li>muted text on the alert tint (3.25–3.4:1);</li><li>now label (2.72:1).</li></ul> | screenshots `list-compact-dark-scroll-top-button.png`; `measured-styles.dark.json` | The `default` preset uses the corrected tokens (06 §3). `classic` keeps the source colours for pixel parity and documents these shortfalls. |
| **B-20** | S2 | The consumer appends a role suffix to item ids of the previous/next shifts. The views detect carried-over items by substring match on that suffix, so an id containing the suffix is misclassified and callbacks receive altered ids. | `[L-12]` | Ids are never mutated; carried-over status comes from the segment offset (F-02). |
| **B-21** | S3 | The pinned strip is in normal flow inside the sticky top. When it first gains chips it grows (+128 px), and browser scroll anchoring shifts `scrollTop`; engines without scroll anchoring make the content jump. Programmatic targets need repeated corrections. | `[BR-L01]` measurements; setting `scrollTop` = 600 yields 728 | `overflow-anchor: none` plus deterministic compensation in the same frame (F-07). |
| **B-22** | S3 | The timeline top button's label and target depend on the consumer's header state, not on the scroll position. | `[TL-12]` | Derive from the scroll position (F-08). |
| **B-23** | S3 *(inferred)* | If the date input is missing, a new "now" date is created on every render, and landing re-runs on every render. | code review | Uncontrolled `defaultDate` captured once (F-10). |
| **B-24** | S3 *(inferred)* | An item of the critical kind without an observed label prints "Observed at: undefined". | code review | The observed rule applies only when `observedLabel` is a non-empty string (04 §3.2). |
| **B-25** | S3 | Pinned chips of previous-shift items replace the item's tags with the carried-over tag, dropping others (e.g. "Impacts Next Shift"). | code review; `[BR-L01]` chip content | Append the tag (F-07). |
| **B-26** | S2 | The navigation buttons' accessible name is the tooltip ("Scroll to next shift start") while the visible label is "View next shift" (fails WCAG 2.5.3 Label in Name); disabled buttons are named "No … available." while showing a header and range. | `[TL-11]`, `[BR-L02]` | The visible label is the name; the hint goes to the tooltip and `aria-describedby` (F-08). |

## 5. Visual masks for the classic comparison

| Screenshot | Mask | Reason |
|---|---|---|
| list screenshots with now inside the current shift | none; render with `enableNowIndicator={false}` | B-01 adds a marker |
| `timeline-desktop-light-bottom-disabled.png` | the pinned strip | B-05 changes which cards are pinned at the end |
| all | focus rings (none are visible in the references) | — |
| all | the top navigation button's count suffix | B-06 changes when it is shown |

Everything else **MUST** match within the `09` tolerance.
