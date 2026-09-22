# 05 — Features (behaviour of every v1.0 and v1.x capability)

This document is the **source of truth for behaviour** of the library, including the generalisations the
source never had. Names and signatures are defined in `04-api-reference.md`.

With every option at its default:

- every rule here **MUST** reduce to the parity behaviour in `01-behaviour-spec.md`;
- the bug fixes of `07-parity-and-bugs.md` are the only exceptions.

Each feature lists its rules (**MUST**/**SHOULD**) and its acceptance checks (**AC**).
Scenario IDs `[..]` refer to `characterization/scenarios.json`.

| ID | Feature | Mark |
|---|---|---|
| F-01 | Shift model | v1.0 |
| F-02 | Bucketing and ordering | v1.0 |
| F-03 | Scheduler wrapper and view selection | v1.0 |
| F-04 | List view | v1.0 |
| F-05 | Timeline view | v1.0 |
| F-06 | Timeline layout engine and options | v1.0 |
| F-07 | Pinning | v1.0 |
| F-08 | Shift navigation | v1.0 |
| F-09 | Header-expanded signal | v1.0 |
| F-10 | Landing | v1.0 |
| F-11 | Now indicator | v1.0 |
| F-12 | Localization and formatting | v1.0 |
| F-13 | Overflow dialog and table | v1.0 |
| F-14 | Detail view | v1.0 |
| F-15 | Empty, loading and error states | v1.0 |
| F-16 | Compact and responsive | v1.0 |
| F-17 | Motion | v1.0 |
| F-18 | Accessibility | v1.0 |
| F-19 | Keyboard | v1.0 (baseline) |
| F-20 | Theming | v1.0 |
| F-21 | Slots and per-part styling | v1.0 |
| F-22 | Handler middleware | v1.0 |
| F-23 | Render props | v1.0 |
| F-24 | Feature and item flags | v1.0 |
| F-25 | Events and ordering | v1.0 |
| F-26 | Imperative API | v1.0 |
| F-27 | Headless hooks and core | v1.0 |
| F-28 | SSR safety | v1.0 |
| F-29 | RTL | v1.0 |
| F-30 | Performance | v1.0 |
| F-31 | Data modes | v1.0 |
| F-32 | TypeScript generics | v1.0 |
| F-40 | Drag-and-drop editing, locked/static items | v1.x |
| F-41 | Persistence | v1.x |
| F-42 | Feature registry (plugins) | v1.x |
| F-43 | Virtualization and culling | v1.x |
| F-44 | Date toolbar | v1.x |
| F-45 | Explicit time zone | v1.x |
| F-46 | Roving focus and shortcuts | v1.x |

### Extension categories (every category answered)

| Category | Answer | Mark | Reason |
|---|---|---|---|
| Headless core + hooks | `react-scheduler/core`, `/dom`, `useScheduler` and focused hooks (F-27) | v1.0 | custom markup without losing behaviour |
| Controlled and uncontrolled state | `view`, `date`, `headerExpanded`, `openItemId`, `openOverflowId`, overflow sort/page; `activeShift` and `pinned` are read-only with callbacks (04 §5) | v1.0 | every stateful value can be owned by the consumer |
| Slots for every visible part | ~50 parts (06 §1) | v1.0 | wishlist: everything overridable |
| `slotProps`, `classNames`, `styles` per part | 06 §1–2 | v1.0 | wishlist: everything stylable |
| Handler middleware | 11 interactions (04 §5.11, F-22) | v1.0 | wishlist: all handlers accessible |
| Render props | 12 render props (04 §5.12, F-23) | v1.0 | user-defined content |
| Feature flags (component level) | 11 `enableX` flags (04 §5.8) | v1.0 | opt out of any behaviour |
| Feature flags (item level) | `pinned`, `pinnable`, `disabled` (04 §3.2) | v1.0 | per-item control |
| Static / pinned / locked items | `pinned` | v1.0 | the source already pins |
| Static / pinned / locked items | `locked`, `static` (with drag-and-drop, F-40) | v1.x | only meaningful with editing |
| Events and callbacks | 04 §5.9 and the state callbacks (F-25) | v1.0 | |
| Imperative ref API | `SchedulerHandle` (04 §6, F-26) | v1.0 | |
| Theming tokens, light/dark/classic | `--rs-*`; presets `default` and `classic`, each light and dark (06 §3) | v1.0 | |
| Density | `standard`, `comfortable`, `dense` (06 §4) | v1.0 | |
| Unstyled mode | `unstyled` (06 §2) | v1.0 | |
| Localization, 7 packs | en, es, ro, hu, fr, de, pt-PT (06 §6) | v1.0 | |
| RTL-safe layout | logical properties, `dir` (F-29) | v1.0 | |
| Accessibility | semantics, names, descriptions, live region, contrast (F-18); baseline keyboard (F-19) | v1.0 | |
| Accessibility | roving focus and shortcuts (F-46) | v1.x | not needed for parity; larger design |
| SSR safety | F-28 | v1.0 | |
| Performance: memoization, lazy loading, algorithmic budgets | F-30, F-06 | v1.0 | |
| Performance: virtualization and culling | F-43 | v1.x | budgets are met without them up to 1 000 items |
| Persistence | F-41 | v1.x | not in the source; storage policy belongs to consumers |
| Data modes: client + visible-range fetching | F-31 | v1.0 | |
| Data modes: server-paged overflow | — | out of scope | no need in the source; overflow groups are small |
| Error, empty and loading states | F-15 | v1.0 | fixes B-02 |
| Extensibility: feature registry | F-42 | v1.x | flags cover v1.0 |
| TypeScript generics and inference | F-32 | v1.0 | |
| Drag-and-drop editing | F-40 | v1.x | decision at checkpoint 2 |
| Date toolbar | F-44 | v1.x | the consumer owns date selection today |
| Explicit time zone | F-45 | v1.x | v1.0 is local-zone and DST-safe |
| Week / resource views, editing workflows | — | out of scope | a different product |

---

## F-01 Shift model

- **Boundaries:**
  - Shift boundaries are **wall-clock times**, repeated every day.
  - Regular mode: `24 / durationHours` boundaries starting at `anchor`. `durationHours` MUST divide 24; otherwise the library throws in development and falls back to 12 in production.
  - Pattern mode: the entry start times.
  - Keys: in regular mode, the boundary at `anchor` gets `keys[0]` and the following ones cycle through `keys`. In pattern mode each entry has its own key.
- **Current shift:** `[latest boundary ≤ date, next boundary > date)`. Offsets ±k walk k boundaries backwards/forwards across days.
- **Local time:** boundaries are built with the local date constructor. A boundary that falls in a spring-forward gap moves forward by the gap. A repeated autumn time uses its first occurrence.
- **Durations:** a window's duration is the real elapsed time between its boundaries (11 h or 13 h on DST days) (**B-07** fix).
- **Rendered windows:** the library renders the windows with offsets `-before … +after`.
- **AC:** `[L-11]` passes in UTC. On a spring-forward day in a DST zone the night window runs from 20:00 to 08:00 (not 09:00). The regular defaults (12 h, 08:00, `day`/`night`) reproduce parity windows. A pattern `[{key:'early',start:'06:00'},{key:'late',start:'14:00'},{key:'night',start:'22:00'}]` yields 8 h windows.

## F-02 Bucketing and ordering

- **Bucketing:**
  - An item goes to the window with `start ≤ item.start < end`.
  - Items outside all rendered windows are not shown.
  - An item with an invalid start is dropped and reported once in development.
- **Ids:** ids are **never changed** (**B-20** fix).
  - Duplicate ids: the first occurrence wins and a development warning is issued.
  - Carried-over status comes from the segment's `offset < 0`, never from the id.
- **Order:** items in a segment follow `compareItems`. The default is the placement order: start, level rank, id (locale compare) `[L-01]`.
- **`segments` input** (parity drop-in):
  - The given buckets are used as they are.
  - Offsets come from the role (-1/0/1) unless given.
  - Items are sorted inside each segment.
- **AC:** `[L-12]` (without the id suffix). A consumer-supplied `compareItems` changes the list order, the timeline placement sequence and the pinned-strip order together.

## F-03 Scheduler wrapper and view selection

- **Mounting:**
  - `<Scheduler>` renders the active view only (**B-14** fix).
  - With `keepInactiveViewMounted`, the inactive view stays in the DOM (`hidden`) with every listener, observer and timer **paused**; it resumes on activation.
- **`listOnlyBreakpoint`:**
  - When the root is narrower (content-box width, measured with `ResizeObserver`), the effective view is `list`.
  - The controlled `view` value is left untouched and no `onViewChange` fires.
- **View switches:** a switch triggers the entered view's `onViewEnter` landing and header rule (F-09, F-10).
- **AC:** `[LV-13]`, `[TL-10]`; only one scroller exists in the DOM by default.

## F-04 List view

- **Parity:** reproduces `01` §L, except for the fixes.
- **Now marker (B-01 fix):** when the now conditions hold (F-11), the current section shows a now marker:
  - a 2 px line in `--rs-color-now`, preceded by a label pill with the clock time;
  - placed before the first card whose start is after now, or after the last card;
  - `role="separator"` with `aria-label = localization.now.label`.
- **Sections:**
  - A section header uses `localization.shiftHeader.previous|current|next` for offsets −1, 0, +1.
  - Other offsets use `earlier` / `later` with `count = |offset|`.
  - The range label is `formatters.shiftRange(start, end)`.
- **Active shift:** the last section whose `top − segmentEpsilon ≤ visibleTop`. When no section qualifies, the first section is active. At the scroll end (`scrollTop ≥ max − segmentEpsilon`), the last section is active.
- **AC:** every `LV-*` and `BR-L*` scenario, except those tagged `bug`, which expect the fixes.

## F-05 Timeline view

- **Range:** from the first rendered shift's start to the last one's end. The grid height is `realHours × hourHeight`.
- **Hour labels:** one label per real elapsed hour from the range start, formatted with `formatters.hourLabel`.
- **Boundary lines:** drawn at **every shift boundary strictly inside the range**, by timestamp, not by hour of day (**B-07**). Parity: the two inner lines.
- **Off-shift bands:** hour rows outside the current window.
- **Anchors:** `anchor(offset) = (shift.start − rangeStart) px + gridPadTop (8)`.
- **Active shift:** the shift whose `[anchor − lead, nextAnchor − lead)` contains `scrollTop`, where `lead = leadMinutes × hourHeight / 60` (86 px at the defaults).
- **AC:** `[TL-02]`, `[BR-T03]`, `[BR-T06]`, `[TL-11]`.

## F-06 Timeline layout engine and options

- **Equivalence:** the engine MUST produce **exactly** the golden outputs in `characterization/golden/` for parity options, with `overflowMergeWindow: Infinity` for the `large` fixture (see B-10).
- **Algorithm:**
  - Implement the algorithm of `01` §T.5 with these parameters: `maxColumns`, `maxColumnsCrowded`, `maxColumnsCompact`, `minCardHeight`, `cardGap`, `hourHeight`, `defaultDuration`.
  - The placement sequence uses `compareItems` inside overlap components when `columnPlacement = 'priority'`.
- **`columnPlacement: 'time'`:**
  - The placement sequence is plain start order: start, then rank, then id, without grouping by component.
  - Promotion (step 3) is **skipped**, so earlier items always keep the left columns.
  - Gap fill still runs.
- **`overflowMergeWindow`:** consecutive hour buckets merge only while `previous.end > bucket.start` **and** `mergedEnd − mergedAnchor ≤ overflowMergeWindow` (**B-10** fix). Parity fixtures without dense data are unaffected (`[L-07]` still yields one group).
- **Performance** (**B-11** fix):
  - Pairwise overlap tests MUST be replaced by a sweep over sorted start/end events. The overlap count at an instant and the column checks use sorted structures.
  - The target is O(n log n + k) for typical data; the budget is in `09`.
- **AC:** all golden files match. The `large` fixture with the default merge window produces more than one group, and each group's span is ≤ 2 h. `columnPlacement: 'time'` places the earliest overlapping item in column 0.

## F-07 Pinning

- **Pinnable items:** `item.pinned === true` (always pinned while its shift is rendered), otherwise `item.pinnable ?? level.pinOnPass`.
- **Sentinels and pin line:**
  - A 1 px sentinel sits at the card edge given by `pinning.<view>.edge`.
  - **List:** the pin line is the sticky top's bottom edge.
  - **Timeline:** the pin line is the scroller's visible top edge. The sticky top is outside the scroller, so no sticky-height offset applies (**B-05** fix).
- **Pin rules:**
  - an unpinned item pins when `sentinelTop ≤ line − epsilon`;
  - a pinned item unpins when `sentinelTop > line + hysteresis − epsilon`.
- **Mechanism** (**B-12**, **B-13** fixes):
  - One `IntersectionObserver` per view on the scroller; its root margin places the line.
  - Rect reads happen only for observer entries and once after programmatic scrolls.
  - Listeners are attached once per mount.
- **Overflow:** a "+more" chip is a sentinel for the pinnable items inside its group.
- **Order:** the strip follows `pinning.compare` (default: placement order).
- **Carried-over tag:** items from shifts with `offset < 0` get the `carriedOver` tag **appended** unless already present. Existing tags are kept (**B-25** fix).
- **Stability** (**B-21** fix):
  - The scroller sets `overflow-anchor: none`.
  - When the sticky top changes height, the library adjusts `scrollTop` by the difference in the same frame, so visible content does not move in any browser (including WebKit, which lacks scroll anchoring).
  - Programmatic landing targets are computed after that adjustment.
- **Reset:** the pinned set resets when `date` changes.
- **Events:** `handlers.onPin` can veto a change. `onPinnedChange` reports the new id list and the difference.
- **AC:** `[BR-L05]` (hysteresis unchanged). The timeline `[BR-T02]` now pins only once the card's bottom crosses the scroller top. No `scrollTop` jump when the first chip appears (compare element positions before and after). A 240-item scroll has no long task above 50 ms.

## F-08 Shift navigation

Let `A` be the active shift offset, `first`/`last` the extreme offsets, and `atStart(A)` true when the view is
at the start of shift `A`:
- list: `scrollTop ≤ segmentEpsilon` for the first shift, otherwise `visibleTop ≤ sectionTop(A)`;
- timeline: `scrollTop ≤ 0` for the first shift, otherwise `scrollTop ≤ anchor(A) − lead + 2`.

**Top button target:**

| Condition (first match) | Target | Label key | Visible |
|---|---|---|---|
| `A > 0` | 0 | `nav.viewCurrent` | yes |
| `A = 0` and not at the start of shift 0 | 0 | `nav.viewCurrent` | yes |
| `A ≤ 0` and at the start of `A`, and `A = first` | — | — | list: hidden; timeline: disabled, content = header title + range of `A`, hint `nav.noPrevious` |
| `A = 0` and at the start of shift 0 | −1 | `nav.viewPrevious` | yes |
| `A < 0` and not at the start of `A` | A | label for A | yes |
| `A < 0` and at the start of `A` | A − 1 | label for A − 1 | yes |

**Bottom button target:**

| Condition (first match) | Target | Visible |
|---|---|---|
| `A = last` | — | list: hidden; timeline: disabled, content = header title + range of `last`, hint `nav.noNext` |
| list only: `A < 0` and `visibleBottom > sectionTop(+1) + segmentEpsilon` | +1 | yes |
| otherwise | A + 1 | yes |

- **Label for an offset:** −1 `viewPrevious`, 0 `viewCurrent`, +1 `viewNext`, < −1 `viewEarlier`, > +1 `viewLater`. The hint keys follow the same pattern (`toPreviousHint`, …).
- **List threshold:** list navigation shows only when some shift has ≥ `navigationThreshold` items. The timeline always shows it.
- **Accessible name** (**B-26** fix): the visible label is the accessible name. The hint is the tooltip and `aria-describedby`.
- **Carried-over count** (**B-06** fix):
  - `N` = number of pinnable items in shifts with `offset < 0` (the definition used in both views).
  - It is shown after the label only when the top button targets an earlier shift, with `localization.nav.carriedOverCount`.
- **Timeline label independence** (**B-22** fix): the timeline's top-button choice between "current" and "previous" depends only on the scroll position (the table above), never on the consumer's header state.
- **Targets:**
  - List: `sectionTop − stickyHeight − alignOffset`, minus `previousJumpExtraOffset` when the target offset is < 0 (an earlier shift). Parity: every jump to the previous shift uses the extra offset.
  - Timeline: `anchor(target) − lead`.
- **Motion:** smooth unless reduced motion (F-17). Correction after `scrollend` (fallback 500 ms) as in `01` §L.7 / §T.10.
- **Events:** `handlers.onNavigate` middleware, then `onNavigate`.
- **AC:** with 1/1 shifts, every navigation scenario matches `01`, except B-06, B-22 and B-26. With `before: 2`, the top button reaches offset −2 from the start of −1.

## F-09 Header-expanded signal

- **List rule:** `01` §L.8, with two changes:
  - the "3rd card" counts only cards, never sentinels (**B-08** fix);
  - `collapseMinItems`, `collapseAfterCards` and `collapseMargin` parameterise the rule.
- **Timeline rule:** `expanded = scrollTop ≤ anchor(0) − lead + 2`.
- **Emission:**
  - The callback fires **only on change**, with a reason.
  - `handlers.onHeaderSignal` can alter or veto it.
- **Forced values:**
  - forced `true` when no shift has items (reason `empty`);
  - on view enter, the value is computed **once after the landing settles** (reason `viewEnter`), so a switch no longer flickers (**B-04** fix).
- **Opt-out:** `enableHeaderSignal: false` disables the computation. The consumer then owns the header entirely.
- **AC:** `[BR-L07]` transitions; `[BR-T05]` emits exactly one value; `[LV-14]` expects the corrected threshold.

## F-10 Landing

| Target | List | Timeline |
|---|---|---|
| `shiftStart` | current section top − sticky − `alignOffset` | `anchor(0) − lead` |
| `date` | start of the first card at or after `date` in the current section (else section top) | `anchor(0) + (date − shift0.start) h × hourHeight − lead` |
| `dateNearBottom` | same as `date` | `anchor(0) + clamp(date − shift0.start) × hourHeight − (clientHeight − nearBottomGutter)` |
| `none` | no scroll | no scroll |

- **When:**
  - `initial` runs once, when the view first has data and loading is false;
  - `onDateChange` runs on every `date` change after that;
  - `onViewEnter` runs when the view becomes active through a view switch.
- **Motion:** landings are instant. The timeline's `onViewEnter` repeats after `viewEnterRealignDelay`.
- **User role:** the source's role-dependent branch is dropped, because it had no effect (**B-09**).
- **Missing date:** an absent `date` means uncontrolled: `defaultDate` is captured once at mount, so there are no repeated landings (**B-23** fix).
- **AC:** `[TL-08]`, `[TL-09]`, `[TL-10]`, `[BR-L01]`, `[BR-T01]`.

## F-11 Now indicator

- **Conditions:** shown when all hold:
  - `enableNowIndicator`;
  - the selected calendar day is not before today;
  - now is within the current shift window (half-open);
  - now is within the rendered range;
  - the selected day equals now's day.
- **Timeline:** as in `01` §T.12.
- **List:** F-04 marker.
- **Clock:** the internal clock ticks every `nowTickInterval` while mounted, and is paused while the document is hidden.
- **AC:** `[TL-04]`. The list shows the marker for the baseline fixture with now 10:41; it is absent for the past-date fixture.

## F-12 Localization and formatting

- **Strings:**
  - Every user-visible and ARIA string comes from `localization` (keys in `06` §6).
  - Plurals use `Intl.PluralRules(locale)` over `PluralForms`.
  - Interpolation uses `{{name}}`.
- **Packs:** `enUS`, `esES`, `roRO`, `huHU`, `frFR`, `deDE` and `ptPT` are complete.
- **Formats** (**B-15** fix) use `Intl.DateTimeFormat(locale)`:
  - `clockTime`: `{ hour: 'numeric', minute: '2-digit' }`.
  - `shiftRange`: `{ month: 'short', day: 'numeric', hour: 'numeric' }`, joined by `" - "`.
  - `timeRange`: clock times joined by `" – "`.
  - `sinceTimestamp` and `dateTime`: `{ year, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }`. In `en-US` this MUST equal "03/12/2031 07:45 AM" (drop the comma). Other locales use their own order.
  - `hourLabel`: `hourLabelFormat: 'compact'` formats `{ hour: 'numeric' }` and removes the whitespace between the number and a day-period marker ("8 AM" → "8AM"; "8 Uhr" stays). `'locale'` keeps the `Intl` output as is.
- **Locale mismatch:** the source silently fell back to en-US for any language other than es. The library MUST use the requested locale and fall back to `en-US` only when `Intl` does not support it.
- **Right-to-left packs** set `dir: 'rtl'` (F-29).
- **AC:** golden `format-samples.json` for en and es; snapshot of each pack's formatted samples; no hard-coded strings in the rendered DOM (lint rule + test that renders with a pseudo-locale).

## F-13 Overflow dialog and table

- **Dialog:**
  - A native `<dialog>` opened with `showModal()` (focus containment, Escape, backdrop click).
  - Labelled by its title `overflow.title` (count = group size).
  - The close icon uses `overflow.closeIcon` (**B-15**).
- **Default columns:** time, level, title, description, actions. The source's domain column is dropped.
- **Columns:** `overflowColumns` replaces them. Unsortable columns omit `sortValue`.
- **Sorting:**
  - Clicking a sortable header sorts ascending; clicking it again toggles the direction.
  - Changing the column resets to page 0.
  - Ties break by `compareItems`, in the chosen direction.
- **Paging:** `overflowPageSize` rows per page. Pagination uses `pageList` (all pages when ≤ 7; otherwise first 2, last 2, current ±1, ellipses).
- **State:** sort and page are controlled/uncontrolled and reset on each open unless controlled.
- **Row action:** opens the detail view above the dialog (stacked `<dialog>` elements). Closing the detail view returns focus to the row action.
- **"+more" chip:** its accessible name is `more.ariaLabel` ("{{count}} more items from {{time}}"). The visible text stays `more.label`.
- **AC:** `[TL-06]`, `[TL-07]`; keyboard-only open/sort/page/close.

## F-14 Detail view

- **State:** `openItemId` is controlled or uncontrolled.
- **Opening:** activation (card, chip, overflow row or `openItem`) runs `handlers.onItemActivate`, then sets the id, then calls `onItemOpen`.
- **Rendering:** `renderItemDetail` renders the consumer's detail. Otherwise `DefaultItemDetail`:
  - a native modal `<dialog>`, max width 560, radius 16, padding 24;
  - content: level rail and title (heading), description, pills (level, reference, tags), time label, suggestion, and a close button (`detail.close`).
- **Item removed** (**B-03** fix): the view closes with reason `itemRemoved` and the id is cleared. It never reopens by itself.
- **Focus:** returns to the activator on close. When the activator is gone, focus goes to the scroller.
- **Disabled items:** `item.disabled` items do not open.
- **AC:** `[LV-11]`, `[TL-14]`, `[BR-L06]`, `[BR-T07]`; `[LV-12]` expects no reopen.

## F-15 Empty, loading and error states

- **Empty:**
  - all shifts empty → `emptyAll`;
  - an empty shift → `emptyShift`;
  - the timeline shows the grid plus a centred `emptyAll` overlay line *(new; previously only an empty grid)*.
- **Loading (B-02 fix):**
  - `loading` shows `LoadingState` (spinner and `localization.loading` for assistive technology) in **both** views.
  - When data already exists, it is kept visible and dimmed (`aria-busy="true"`) rather than replaced.
- **Error:** a truthy `error` shows `ErrorState` (`errorTitle` and a retry button when `onRetry` is given) in place of the content.
- **Overrides:** `renderEmpty`, `renderLoading` and `renderError`, or the matching slots.
- **AC:** each state rendered in both views; `[TL-01]` spinner; `[LV-09]` expects the loading state.

## F-16 Compact and responsive

- **Compact:** `compact: 'auto'` is true when the root's content width is below `compactBreakpoint` (default 900), measured with `ResizeObserver`. There is no user-agent sniffing (**B-16** fix). A boolean forces it.
- **Compact effects:** as in `01` §9, keyed on the root width, not the viewport.
- **Pinned chip width:** `≥ 900` → 436 px; `600–899` → 360 px; `< 600` → 90 %. These thresholds use the root width.
- **AC:** `[BR-L08]` at a 390 px root width; a 1000 px root inside a 390 px viewport iframe renders the regular layout.

## F-17 Motion

- **Smooth motion:** smooth scrolling and the chip entrance run only when `enableAnimations` is true and reduced motion is off.
- **Reduced motion:** `reducedMotion: 'auto'` follows `prefers-reduced-motion`.
- **Transitions:** all CSS transitions are removed under reduced motion.
- **AC:** `[LV-16]`, `[TL-13]`.

## F-18 Accessibility

- **Root:** `role="region"` with `aria-label` (prop) or `aria-labelledby` (header slot).
- **Structure:**
  - Each shift section is a `section` element labelled by its header, which is a heading of `headingLevel`.
  - Its cards are a `ul role="list"` of `li` elements.
- **Cards** (**B-18** fix):
  - The activator is a `<button type="button">` containing only phrasing content (spans styled as blocks).
  - Accessible name = title.
  - `aria-describedby` points to a visually hidden text built from `card.description` ("{{level}}, {{time}}") plus the tag labels.
  - Disabled items use `aria-disabled="true"`.
- **Timeline:**
  - The card lane is a `ul` in placement order (DOM order = placement order).
  - The "+more" chip follows the cards of its hour in DOM order.
- **Pinned strip** (**B-17** fix):
  - a `region` labelled `pinnedStrip.label` containing a list of chip buttons;
  - a separate visually hidden `aria-live="polite"` element announces `pinnedStrip.announcement` when the count changes, at most once per 1000 ms.
- **Navigation:** F-08 (label in name; the hint in the description).
- **Now marker and line:** `role="separator"`, name `now.label`.
- **Contrast:** the `default` preset meets WCAG 2.2 AA:
  - text ≥ 4.5:1, large text and UI parts ≥ 3:1, focus indicators ≥ 3:1;
  - values in `06` §3, fixing **B-19**.
  - The `classic` preset reproduces the source colours exactly and documents its known contrast shortfalls.
- **Tooling:** axe-core: zero violations in both views and both presets for the default preset; classic is allowed only the documented colour-contrast exceptions.
- **AC:** axe runs in the browser suite; a screen-reader smoke test (names and descriptions snapshot).

## F-19 Keyboard (baseline v1.0)

- **Tab order:** root → pinned strip chips → top navigation → sections in order (cards) → "+more" chips in time order → bottom navigation → scroll-to-top button.
- **Keys:**
  - Enter/Space activate.
  - Escape closes the topmost dialog.
  - Focus is restored to the activator (`[BR-T07]`).
- **Visibility:** focus is always visible (2 px ring, offset 2, `--rs-focus-color` or the level colour).

## F-20 Theming

Presets, colour schemes, density, tokens and unstyled mode — full definition in `06`.

- **AC:** the `classic` preset matches the reference screenshots (tolerance in `09`), light and dark.

## F-21 Slots and per-part styling

- **Parts:** every part in `06` §1 is replaceable (`slots`) and receives typed props plus `ownerState`.
- **Styling:** `slotProps` merge over the defaults (a function form receives `ownerState`). `classNames` are appended and `styles` merged into each part's element.
- **Preserved attributes:** replacing a slot MUST keep refs and the `data-rs-part` attribute (passed in the props).

## F-22 Handler middleware

- **Sequence:** for each interaction, `handlers.onX(ctx, next)` runs first.
  - Calling `next()` runs the default behaviour and then the event callbacks.
  - Not calling it cancels both.
- **Mutation:** `ctx` is read-only. Middleware may call imperative methods instead.
- **Async:** a middleware may call `next()` asynchronously. The default behaviour then runs at that time, if the component is still mounted.

## F-23 Render props

- **Precedence:** render props take precedence over slots for the same content. `defaultRender()` returns the built-in content.
- **Wrappers:** returned content is rendered inside the part's wrapper, so the wrapper keeps its semantics and events. `renderItem` is the exception: it replaces the whole card.
  - With `renderItem`, the consumer MUST spread `getItemProps` on the activator.
  - A development warning fires when the activator lacks the required attributes.

## F-24 Feature and item flags

- **Feature flags:** each `enableX` flag (`04` §5.8) removes the feature's DOM, listeners and computations.
- **Item flags:** `pinned`, `pinnable` and `disabled` are defined in `04` §3.2.

## F-25 Events and ordering

For one user action:

1. middleware;
2. default behaviour;
3. state change callbacks (`onXChange`);
4. domain events (`onItemOpen`, `onNavigate`, …).

Scroll-derived events (`onActiveShiftChange`, `onHeaderExpandedChange`, `onPinnedChange`) fire at most once per animation frame, and only on change.

## F-26 Imperative API

- **Behaviour:** methods behave like the matching user action but use source `'api'` and skip middleware (they are an explicit consumer call).
- **Timing:** calls before mount are ignored with a development warning.
- **`scrollToItem`:** scrolls so the card's top sits `alignOffset` (list) or `lead` (timeline) below the sticky edge.

## F-27 Headless hooks and core

- **Core:** `react-scheduler/core` MUST be free of React and DOM (tested by importing it in a plain Node environment).
- **Hooks:** they expose the complete state; `useScheduler` plus the getters are enough to rebuild both views.
- **Demo requirement:** the demo includes a headless example (`08`).

## F-28 SSR safety

- **Render phase:** no access to `window`, `document` or layout during render.
- **Server output:**
  - The server renders with `compact` false (unless a boolean is given), no pinned items, and the header expanded.
  - The clock starts from `now` or `defaultDate`. Supplying `now` makes hydration deterministic.
- **Effects:** layout-dependent work happens in effects. There are no hydration warnings in React 18 and 19 (tested).

## F-29 RTL

- **CSS:** uses logical properties only (`inline-start`, `padding-inline`, …).
- **RTL layout:**
  - The timeline gutter is on the inline-start side.
  - Column order starts at inline-start.
  - The pinned strip scrolls and fades in the inline direction.
  - Icons with direction are mirrored.
- **AC:** screenshots with `dir="rtl"` mirror the LTR screenshots (checked by flipping).

## F-30 Performance

- **Rendering:** every part is memoized. Item-level parts re-render only when their own item changes (reference equality) or their layout changes.
- **Loading:** the default detail view and the overflow dialog are lazy-loaded chunks.
- **Budgets and measurement method:** `09`.

## F-31 Data modes

- **Client mode:** items are held by the consumer.
- **Server fetching:** `onVisibleRangeChange({ start, end })` fires on mount and whenever the rendered range changes (a date or shift-options change). The consumer then fetches and updates `items`.
- **Loading:** `loading` with existing items keeps them visible (F-15).
- **Out of scope:** server-paged overflow.

## F-32 TypeScript generics

- **Inference:**
  - `Scheduler` infers `TItem` from `items`.
  - Level keys are checked against `levels` when the levels are declared `as const` (with `ItemOf`).
  - Callbacks, render props and slots receive `TItem`.
- **Type tests:** type-level tests (expect-type style) cover the inference.

---

## v1.x capabilities (designed now, shipped later)

### F-40 Drag-and-drop editing (v1.x)

- **Enable:** `enableEditing` (default false).
- **Timeline gestures:**
  - dragging a card moves it in time;
  - dragging its bottom edge resizes it.
  - Both snap to `editing.snapMinutes` (default 15).
- **List gesture:** dragging between sections moves an item to another shift, keeping its time-of-day.
- **Item flags:** `locked` (cannot move or resize) and `static` (not draggable, and others cannot drop onto its slot).
- **Callbacks:**
  - `onItemChange(item, { start, end })` is **proposal-only**: the consumer decides and updates `items`;
  - `handlers.onItemDrag` / `onItemDrop` middleware.
- **Keyboard alternative:** Arrow keys move by the snap step; Shift+Arrow resizes; Enter confirms; Escape cancels.
- **Native only:** Pointer Events; no library.

### F-41 Persistence (v1.x)

- **What is stored:** with `persistKey`, the view, header state and per-view scroll offset relative to the current shift are stored through `persistence.storage` (default `localStorage`, guarded).
- **Restore:** on mount the stored state is restored before landing, and it takes precedence over `landing.initial`.

### F-42 Feature registry (v1.x)

- **Registry:** `features={[nowIndicator(), pinning(), overflow(), …]}` replaces the flags. Third parties can register features that contribute parts, state and handlers through a typed contract.
- **Default:** the default registry equals the v1.0 flags.

### F-43 Virtualization and culling (v1.x)

- **List:** renders only sections and cards within an overscan of 2 viewports. Anchors are estimated and then corrected.
- **Timeline:** renders only cards intersecting the viewport plus 1 h of overscan.
- **Pinning:** keeps working through virtual sentinels computed from layout, not the DOM.

### F-44 Date toolbar (v1.x)

- **Slot:** optional `slots.toolbar` default. Contents:
  - previous/next shift-day buttons;
  - a "Today" button;
  - a view switch.
- **Callbacks:** it calls `onDateChange` / `onViewChange`. There is no date picker (the consumer supplies one).

### F-45 Explicit time zone (v1.x)

- **Prop:** `timeZone` (IANA). Boundaries and labels are computed in that zone with `Intl` offset lookups instead of local `Date` construction.

### F-46 Roving focus and shortcuts (v1.x)

- **Model:** the cards of a section form a roving-tabindex group:
  - Up/Down move between cards;
  - Home/End go to the section's first/last card;
  - PageUp/PageDown jump to the previous/next section;
  - T goes to "now";
  - `[` / `]` trigger the top/bottom navigation.
- **Timeline:** Left/Right move between columns.
