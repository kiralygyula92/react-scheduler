# 01 — Behaviour specification (current behaviour)

This document describes, precisely, how the feature behaves **today**. It is the reference for the
**parity layer** (see `04-api-reference.md`). Every statement is backed by a characterization scenario
(`[ID]`, see `characterization/scenarios.json`) or by reading the implementation; anything not directly
observed is marked *(inferred)*.

- The parity layer **MUST** reproduce every behaviour in this document, except behaviours marked
  **BUG B-nn**. Those **MUST** be fixed as described in `07-parity-and-bugs.md`.
- Numbers are CSS pixels, milliseconds and local wall-clock time unless stated otherwise.
- Time computations use the browser's local time zone.

---

## 0. Vocabulary

| Term | Meaning |
|---|---|
| **item** | One scheduled entry: id, start, optional end, level, title, description, suggestion, tags, optional reference, optional time hints. |
| **level** | Ordered category of an item (lower **rank** = stronger). The classic preset has 9 levels (§2.2). |
| **pinned level** | A level whose items are *pinned* into the pinned strip once scrolled past. Classic: only `critical`. |
| **shift** | A time window. Today: fixed 12 h windows starting at 08:00 (day) or 20:00 (night). |
| **previous / current / next shift** | The three shifts shown. "Current" is the shift containing the selected date-time. |
| **list view** | Vertical list of shift sections with cards (compact-first view). |
| **timeline view** | 36 h vertical time grid with absolutely positioned cards in up to 3 columns. |
| **sticky top / sticky bottom** | Areas above/below the scrolling content holding the pinned strip and the navigation buttons. |
| **pinned strip / pinned chip** | Horizontal strip in the sticky top showing compact chips of pinned items. |
| **navigation buttons** | Top and bottom buttons that scroll to the previous/current/next shift start. |
| **carried-over count** | "(N inherited)" suffix on the top navigation button. |
| **header-expanded signal** | Boolean the feature emits so the consumer can expand/collapse its own summary header. |
| **"+more" chip / overflow dialog** | Chip marking items that did not fit in the timeline columns; opens a sortable table of them. |
| **detail view** | Consumer-provided dialog for one item (behind the boundary; today two domain dialogs). |
| **compact** | Narrow/mobile mode (§2.6). |

---

## 1. Public contract today

### 1.1 Inputs (identical for both views)

```ts
type ShiftRole = 'previous' | 'current' | 'next';
type ShiftVariant = 'day' | 'night';

interface ViewInputs {
  data: ShiftData;
  /** Which view the consumer currently shows. Default: 'list' for the list view, 'timeline' for the timeline. */
  activeView?: 'list' | 'timeline';
  /** Current value of the consumer's header state. Read ONLY by the timeline view (top button label). */
  headerExpanded: boolean;
  onHeaderExpandedChange(expanded: boolean): void;
}

interface ShiftData {
  loading: boolean;
  /** Selected date-time; decides the current shift. Default when absent: new Date() (see B-23). */
  date: Date;
  /** Wall clock in ms. The consumer ticks it every 60 000 ms. */
  now: number;
  /** Current shift window in ms. Defaults when absent: −∞ / +∞. */
  currentShiftStart: number;
  currentShiftEnd: number;
  /** Timeline only. Default 'day'. Selects which hour-of-day lines are drawn as boundaries (§T.3). */
  currentShiftVariant?: ShiftVariant;
  /** Selected calendar day is before today (local midnight comparison). Default false. */
  isPastDate: boolean;
  /** Timeline only. Has NO observable effect (B-09). */
  userRole?: string;
  /** Always previous, current, next in the source consumer. */
  segments: Array<{
    role: ShiftRole;
    variant?: ShiftVariant;
    start?: number; // ms
    end?: number;   // ms
    dateLabel: string; // e.g. "March 12, 2031" — passed but NOT rendered
    items: Item[];
  }>;
  // The consumer also passes 8 fields that neither view reads: error flag, error message, fetching flag,
  // last-updated timestamp, refetch function, reference list, full item list, date setter.
}

interface Item {
  id: string;
  start: string;          // ISO-8601, local
  end?: string;           // missing ⇒ start + 2 h
  level: LevelKey;        // §2.2
  tags: TagKey[];         // 'impactsNextShift' | 'carriedOver'
  title: string;
  description: string;
  suggestion: string;     // shown on timeline cards only
  detailKind: 'critical' | 'standard'; // selects the detail dialog and the time label rule
  observedLabel?: string; // critical kind: "Observed at: {observedLabel}"
  since?: string;         // standard kind: "Ready since: {formatted since}"
  reference?: string;     // reference pill "{referenceLabel} {reference}"
}
```

### 1.2 Outputs

- `onHeaderExpandedChange(expanded)` — the only callback (rules §L.8, §T.9, §5).
- Activating an item opens a detail dialog inside the feature (lazy-loaded; behind the boundary).
- There is no imperative API, no ref, no other event.

### 1.3 How the consumer prepares the data today (moves into the library core)

1. **Shift windows** `[L-11]`. Take the selected date-time. If its hour is in [08, 20), the current
   shift is `day` = [08:00, 20:00) of that day. Otherwise it is `night`: [20:00 of the same day,
   08:00 next day) when the hour is ≥ 20, else [20:00 of the previous day, 08:00). Previous and next
   shifts are the windows ±12 h. Their variant alternates. Windows are computed as **start + 12 h in
   milliseconds**, so boundaries drift on DST days `[L-13]` (**B-07**).
2. **Bucketing** `[L-12]`. Each item goes to the first window whose half-open range [start, end)
   contains the item **start**. Items outside all three windows are dropped; items with an invalid start are
   dropped. The source then **mutates the id** by appending a role suffix for previous/next items (**B-20**).
3. **Segment date label** = the first item's start formatted "March 12, 2031" (window start when empty).
4. **Now** ticks every 60 000 ms.
5. **Mounting**:
   - Viewport < 600 px: only the list view is mounted and the view switch is hidden.
   - Otherwise **both** views are mounted and the inactive one is hidden with `display: none` (**B-14**).
6. **Header**:
   - The consumer's summary header expands/collapses with a 250 ms height transition.
   - It follows the header-expanded signal of the visible view.
   - Each view keeps its own stored value.

---

## 2. Shared rules

### 2.1 Placement order `[L-01]`

Items are ordered by, in turn:

1. Start time, ascending.
2. Level rank, ascending (stronger first).
3. Id, ascending by locale string comparison.

Both views use this order. So do the pinned strip and the overflow groups (§T.5).

### 2.2 Classic levels

| Rank | Key | Label (en) | Colour light / dark | Pill text | Card variant | Pinned |
|---:|---|---|---|---|---|---|
| 0 | `critical` | Critical | `#F26D43` / `#D36A4D` | light | **alert** | yes |
| 1 | `watch` | Watch | `#FFB443` / `#C08E32` | **dark** | default | no |
| 2 | `monitoring` | Monitoring | `#2477FF` / `#3F76D6` | light | default | no |
| 3 | `capacityWatch` | Capacity Watch | `#FFB443` / `#C08E32` | **dark** | default | no |
| 4 | `ready` | Ready | `#4FCF8E` / `#3FA36F` | light | default | no |
| 5 | `normal` | Normal | `#4FCF8E` / `#3FA36F` | light | default | no |
| 6 | `onTarget` | On target | `#4FCF8E` / `#3FA36F` | light | default | no |
| 7 | `routine` | Routine | `#4FCF8E` / `#3FA36F` | light | default | no |
| 8 | `resolved` | Resolved | `#999DA6` / `#6F747C` | light | **muted** | no |

- "Pill text light" = `#FFFFFF`; "dark" = `#000000`, in both themes.
- Card variants are defined in `02-visual-spec.md` §4.

### 2.3 Time label `[L-15]`

| Condition (first match) | Label |
|---|---|
| `detailKind = critical` | `"{timeLabel.observed} {observedLabel}"` → "Observed at: 8:12 AM – Present". A missing `observedLabel` prints the literal `undefined` *(inferred from code, B-24)*. |
| `since` present and valid | `"{timeLabel.since} MM/DD/YYYY hh:mm AM"` → "Ready since: 03/12/2031 07:45 AM" — fixed US pattern (**B-15**). |
| `since` present but invalid | `"{timeLabel.since}"` alone *(inferred)*. |
| otherwise | `"{start} – {end}"` (space, en dash, space). Clock format `h:mm AM` via `Intl` `en-US` or `es-ES`. Every other language falls back to `en-US` `[L-14]`. A missing end uses start + 2 h. |

### 2.4 Pinned strip content

- **Which items:** the pinned items are those whose pin sentinel has crossed the pin line (list §L.4; timeline §T.8).
- **Order:** the strip shows them in placement order (§2.1).
- **Carried-over tag:** a pinned item from the previous shift without the `carriedOver` tag is shown with its tags **replaced by** `[carriedOver]` ("Inherited"). Other tags are dropped from the chip (**B-25**).
- **Chip content:**
  - The chip is a native `<button>` named by the item title.
  - It shows the title (1 line), the time label (1 line), the level pill, the reference pill and the tag pills.
  - Activating it opens the item's detail view `[BR-L06]`.
- **Strip behaviour:**
  - The strip scrolls horizontally.
  - With 2 or more chips it uses mandatory x scroll-snap (`start` alignment, `always` stop).
  - Edge fades appear only when the strip can scroll that way (2 px epsilon) `[BR-L09]`.
- **Empty strip:** renders an empty element with no height.
- **Live region:** the strip is a polite, atomic live region with role `status` (**B-17**).
- **New chips** animate in (180 ms, §02 motion) unless reduced motion is requested.

### 2.5 Detail view hosting

- **Opening:** activating a card, a pinned chip or an overflow-table row opens the detail view for that item id.
- **Lookup:** the view looks the item up by id in the current data on every render.
- **Close:** Escape, the backdrop or the dialog's own controls close it and clear the id `[LV-11]`.
- **Item disappears:** the view unmounts because the item is missing, but the open flag stays set. When the item reappears, the dialog reopens by itself `[LV-12]` (**B-03**).
- **Loading:** the dialog code is loaded lazily on first open.
- **Kind:** the dialog kind follows `detailKind`.

### 2.6 Compact mode

- **When it applies:** compact is true when the viewport matches `(max-width: 899.95px)` **or** the user agent matches a mobile regex (**B-16**).
- **Updates:** it re-evaluates on media-query change, window resize and visual-viewport resize.
- **Server rendering:** during server rendering it is `false`.

### 2.7 Reduced motion

- **What changes:** when `prefers-reduced-motion: reduce` matches, smooth programmatic scrolls become instant `[LV-16]` `[TL-13]`.
- **Chip animation:** the chip snap-in animation is removed.

---

## L. List view

### L.1 Structure (DOM order)

1. Root (fills the parent, clips overflow).
2. Only when a current segment exists:
   1. **Scroller** (vertical scroll):
      1. **Sticky top** (`position: sticky; top: −1px`, stacking 10):
         - pinned strip;
         - top navigation button, centred on the sticky's bottom edge (`translate(−50%, 50%)`).
      2. **Body** (padding 24 / 16):
         - global empty text, **or**
         - for each segment: a section = shift header + (card list | per-shift empty text).
   2. **Sticky bottom** (height 16, top border 1 px divider):
      - bottom navigation button, centred on its top edge (`translate(−50%, −50%)`).
3. Detail view host.
4. Compact only: fixed **scroll-to-top button**.

When there is no current segment, only the root renders `[LV-10]`.

### L.2 Sections `[LV-01]` `[LV-03]` `[LV-04]`

- **Header:** a title by role ("Previous shift", "Current shift", "Next shift") and a range label `"{start} - {end}"`.
  - Format: `Intl` `month: short, day: numeric, hour: numeric` → "Mar 12, 8 AM - Mar 12, 8 PM".
  - The range label is empty when start/end are missing or not finite.
- **Cards:** sorted by placement order `[LV-02]`.
- **Per-shift empty:** "No items in this shift."
- **Global empty:** when no segment has items, the body shows "No agenda data available." instead of the sections. The header-expanded signal is then emitted `true` `[LV-04]`.

### L.3 Card `[LV-07]`

- **Root:** a bordered box. Inside it sits a full-size activator: an element with `role="button"`, `tabindex="0"` and `aria-label = title` (**B-18**).
- **Row, left to right:**
  - a 4 px level rail (right margin 20);
  - a content block with two columns:
    - regular mode: `row`, space-between, gap 24; compact mode: `column-reverse`, gap 8;
    - column A: the time label (2-line clamp), then a pills row (margin-top 8, gap 6, wrapping): level pill, optional reference pill, tag pills;
    - column B (flexible): the title (2-line clamp), then the description (1-line clamp; margin-top 6 in regular, 0 in compact).
- **No suggestion line** in the list.
- **Pin sentinel:** pinned-level cards contain a 1 px, `aria-hidden` sentinel pinned to the card's **top** edge.
- **Hover** raises the shadow (150 ms).
- **Focus-visible:** 2 px outline in the level colour, offset 2 px.

### L.4 Pinning (rect strategy) `[BR-L01]` `[BR-L05]`

- **Pin line:** the bottom edge of the sticky top (its bounding rect). The sticky top fallback is the scroller's top.
- **Pin rule:** an unpinned item pins when `sentinelTop ≤ pinLine − 2`. A pinned item stays pinned while `sentinelTop ≤ pinLine + 24 − 2` (**hysteresis 22 px**).
- **Recomputed:**
  - on scroll (throttled to one per animation frame);
  - when the sticky top resizes;
  - in a microtask after a sentinel mounts or unmounts;
  - one frame after the data changes;
  - forced after programmatic navigation.
- **Pause:** refresh is paused during programmatic navigation and resumed 180 ms after the final correction.
- **Reset:** the pinned set resets to empty (in a microtask) when the selected date changes.
- **Landing:** items above the landing position are pinned immediately. With the baseline fixture the two previous-shift pinned items are pinned right after landing `[BR-L01]`.
- **Layout effect:** the pinned strip is in normal flow. When it gains its first chip the sticky top grows (baseline: 24 → 152 px) and browser scroll anchoring shifts `scrollTop` by the same amount (observed 600 → 728) (**B-21**).

### L.5 Active shift detection

- **Constants:** `eps = 8`, `stickyH = sticky top offsetHeight`, `visibleTop = scrollTop + stickyH`, `visibleBottom = scrollTop + clientHeight`. `P`, `C`, `N` = offsetTop of the previous, current and next section.
- **Active shift:**

| Condition (first match) | Active shift |
|---|---|
| `P` exists and `visibleTop < C − eps` | previous |
| `N` exists and (`visibleTop ≥ N − eps` **or** `scrollTop ≥ maxScroll − eps`) | next |
| otherwise | current |

- **Derived flags:**
  - `atPreviousStart = scrollTop ≤ eps`;
  - `atOrAboveCurrentStart = visibleTop ≤ C`;
  - `bottomTargetsCurrent = active is previous and not (N exists and visibleBottom > N + eps)`.
- **When evaluated:** on every scroll event, when the sticky top resizes, and once when the listener is attached.

### L.6 Navigation buttons `[LV-05]` `[BR-L02]`

- **Top button** is shown when: some shift has items, **some shift has ≥ 5 items**, and not (active is previous and `atPreviousStart`).
- **Bottom button** is shown when: some shift has items, some shift has ≥ 5 items, and active ≠ next.

| Button | Condition | Visible label | Accessible name / tooltip | Target |
|---|---|---|---|---|
| Top | active = next, **or** (active = current and not `atOrAboveCurrentStart`) | View current shift | Scroll to current shift start | current, smooth |
| Top | otherwise | View previous shift | Scroll to previous shift start | previous, smooth, extra offset 104 |
| Bottom | `bottomTargetsCurrent` | View current shift | Scroll to current shift start | current, smooth |
| Bottom | otherwise | View next shift | Scroll to next shift start | next, smooth |

- **Carried-over count:**
  - The top button shows " (N inherited)" (bold, pinned-level colour, left margin 6) whenever N > 0.
  - N is the number of pinned-level items in the previous segment, whatever the label and pinning state `[LV-06]` (**B-06**).
- **Accessible name:** the tooltip text becomes the accessible name, which differs from the visible label (**B-26**).
- **Compact:** the top button stacks label and count vertically (gap 8).

### L.7 Scroll targets and motion `[BR-L03]` `[BR-L04]`

- **Target:** `target(anchor) = anchor.offsetTop − stickyH − 8 − extra`. It is re-measured at every step.
- **Smooth path:**
  1. `scrollTo({ top, behavior: 'smooth' })`.
  2. On `scrollend` (fallback: 500 ms timer): force a pin refresh; wait 2 animation frames; re-measure; if more than 1 px off, set `scrollTop` directly; after 180 ms, resume pinning and refresh.
- **Instant path** (landing, reduced motion):
  1. Set `scrollTop`.
  2. Next frame: set it again and refresh pinning.
  3. Next frame: correct if more than 1 px off.
  4. After 180 ms: resume pinning.
- **Replacement:** a new navigation replaces a pending `scrollend` handler or timer.
- **Top-to-previous:** the extra 104 px usually drives the target below 0, so the browser clamps it to 0 `[BR-L04]`.

### L.8 Header-expanded signal `[LV-14]` `[BR-L07]`

- **When emitted:** on every evaluation of §L.5 the view emits `onHeaderExpandedChange(expanded)`. It emits even when the value is unchanged.
- **Formula:**

```
canCollapse = currentSegment.items.length > 3
third       = 3rd element in the current section matching the card selector (sentinels count — B-08)
threshold   = third ? third.offsetTop + third.offsetHeight : (C + currentHeaderHeight + 32)
dividerSeen = current header visible by rect (allow +32 below) OR by offsets (allow +32)
expanded = !canCollapse
        || (P, N exist and visibleTop < C − eps and visibleBottom ≥ N − eps)  // all three visible
        || active = previous
        || atOrAboveCurrentStart
        || dividerSeen
        || scrollTop ≤ threshold + eps
```

- **Forced values:**
  - forced `true` when there are no items at all;
  - forced `true` when the consumer's view changes from timeline to list `[LV-13]`, which also resets the active shift to current.

### L.9 Landing

- **When:** once loading is false, and again whenever `date` changes.
- **How:** one animation frame later the view scrolls **instantly** to the current section: `C − stickyH − 8` `[BR-L01]`.
- **Loading flag:** `loading` does not change what is rendered (**B-02**) `[LV-09]`.

### L.10 Scroll-to-top button (compact only) `[LV-15]` `[BR-L08]`

- **Shown when:** a current segment exists and `scrollTop > 96`.
- **Appearance:** fixed position, 48 × 48, `right/bottom = max(16px, env(safe-area-inset-*))`.
- **Name:** accessible name and tooltip "Scroll to top".
- **Action:** smooth scroll to 0, or `behavior: 'auto'` with reduced motion.

### L.11 Now indicator

- **Not rendered** in the list view, even when now is inside the current shift `[LV-08]` (**B-01**).

---

## T. Timeline view

### T.1 Structure

1. Root (page background).
2. **Loading:** a centred circular spinner and nothing else `[TL-01]`.
3. **Current segment exists:**
   1. **Sticky top** (outside the scroller; stacking 10; padding-bottom 28; shadow):
      - pinned strip;
      - top navigation button, centred on the bottom edge.
   2. **Scroller** (vertical, `overscroll-behavior-y: contain`) → content (padding 24 top/bottom, 32 right) → time grid.
   3. **Sticky bottom** (height 32, top border):
      - bottom navigation button, centred on the top edge.
4. Overflow dialog (always mounted, closed).
5. Detail view host.

### T.2 Range

- **Range:** `rangeStart = currentShiftStart − 12 h`, `rangeEnd = rangeStart + 36 h` (fixed 12 h, **B-07**).
- **Item order:** items of all segments are merged and sorted by placement order before layout.

### T.3 Grid anatomy `[TL-02]` `[BR-T03]` `[BR-T06]`

- **Grid:** padding 8 top, 12 bottom.
- **Gutter** (88 px):
  - 37 hour labels, one per hour index `i` = 0…36, at `top = i × 172 − 6`, right-aligned with 24 px right padding.
  - Labels use the compact en-US form "8PM" whatever the language (**B-15**).
  - The labels at the current shift start and end indexes use the strong text colour; the others use the muted colour.
- **Grid box:** border 1 px, radius 12; height = hours × 172 (minimum 172). It contains, back to front:
  1. **Off-shift bands:** one per hour row whose start is outside [currentShiftStart, currentShiftEnd). The layer is inset 1 px with radius 11; the first and last rows are rounded.
  2. **Hour lines:** at `i × 172`, 1 px, grid-line colour.
     - A line is a **boundary** (2 px, strong text colour) when its hour of day equals the current variant's start hour (08 day, 20 night) or that hour + 12.
     - The first and last lines are transparent.
  3. **Now line:** 2 px, now colour, from −9 px to the right edge (§T.10).
  4. **Left pad** (64 px), **card lane** (flexible), **right pad** (64 px, holds "+more" chips).
- **Stacking:** bands and lines 0; lanes 1; right pad 2; now line and label 3.

### T.4 Card `[TL-03]` `[BR-T03]`

- **Element:** a native `<button>` named by the title (**B-18**).
- **Geometry:**
  - absolutely positioned: `top`, `height` from §T.5;
  - horizontally: `n = columns`, `c = column`, `g = 4`;
  - `width = (100% − (n−1)·g) / n`, `left = c × (width + g)`, full width when `n ≤ 1`.
- **Top block** (padding 20 / 12 / 16 / 12, bottom border):
  - rail 4 px (margin-right 20);
  - a column holding: title (1-line clamp), description (1-line clamp), and at the bottom the time label (1-line clamp).
- **Bottom block** (padding 12, gap 12, background by variant):
  - pills (level, reference, tags);
  - **suggestion** (1-line clamp).
- **Pin sentinel:** 1 px, pinned to the card's **bottom** edge, on pinned-level cards.
- **States:**
  - hover raises the shadow;
  - focus-visible: 2 px outline in the level colour, offset 2.

### T.5 Layout engine `[L-02]…[L-10]` (golden outputs in `characterization/golden/`)

**Input:** items sorted by placement order, `compact` flag, `rangeStart`.
**Constants:** `hourHeight = 172`, `maxColumns = 3`, `maxColumnsCrowded = 3`, `maxColumnsCompact = 1`, `minCardHeight = 80`, `cardGap = 4`, default duration 2 h.

- **Definitions:**
  - All intervals are half-open [start, end).
  - `overlapCount(t)` = number of **input** items covering instant `t`.
  - `cap(t) = overlapCount(t) > 3 ? (compact ? 1 : 3) : 3`.

1. **Placement sequence.**
   - Build overlap-connected components (union of pairwise overlaps).
   - Order components by earliest start (tie: smallest input index).
   - Inside a component, order by level rank, then start, then id.
2. **Greedy columns.** Keep, per column, the end of the **last** item placed in it. For each item in sequence:
   - take the first column whose last end ≤ item start;
   - otherwise, if the column count < `cap(item.start)`, open a new column;
   - otherwise, send the item to **overflow**.
3. **Promotion** (repeat until nothing changes):
   - Take overflow sorted by (rank, placement order).
   - For each overflowed item `o`, consider the placed items weaker than `o`, weakest first (then placement order).
   - If `o` does not overlap any other item in that item's column, swap them: `o` takes the column, the weaker item goes to the end of overflow. Restart.
4. **Gap fill** (repeat until nothing changes).
   - Two passes over overflow: strongest-first, then weakest-first (ties by placement order).
   - For each item, for each column `c < cap(item.start)`: place it there if
     - it overlaps nothing in `c`, **and**
     - for every elementary interval of its span, (placed items covering the midpoint + 1) ≤ `cap(midpoint)`.
   - Restart after each placement.
5. **Geometry.** `top = (start − rangeStart) min × 172 / 60`; `height = max(duration min × 172 / 60 − 4, 80)`. A negative duration counts as 0.
6. **Overflow groups.**
   - Bucket overflow items by local start **hour**. Each bucket spans [min start, max end].
   - Sort buckets by earliest start.
   - Merge a bucket into the previous one while `previous.end > bucket.start`. This is transitive, so dense data collapses into one group (**B-10**).
   - Sort each group's items by (rank, placement order).
   - Group anchor = the earliest start.
7. **Column count per card.**
   - At each placed-card start `t`: `slots(t) = min(cap(t), max(1, highest column index + 1 among placed cards covering t))`.
   - A card's initial count = the maximum `slots(t)` over the `t` inside its span.
   - Cards that overlap (transitively) all take their group's maximum `[L-08]`.

- **Output:** placed cards `{item, column, columns, top, height}` and groups `{anchor, items}`.
- **Complexity:** measured ~290 ms for 240 items in Node (**B-11**).

### T.6 "+more" chip `[TL-06]` `[BR-T09]`

- **Rendering:** rendered in the right pad for each overflow group whose anchor is within the range, at `top = anchor offset`, left 4 px, height 28.
- **Element:** a native button with the label "More".
- **Activation:** opens the overflow dialog with the group's items.
- **Pinning:** the chip acts as one pin sentinel for all pinned-level items in its group, so hidden pinned items still reach the pinned strip.

### T.7 Overflow dialog `[TL-06]` `[TL-07]`

- **Dialog:**
  - modal, max width 1200, radius 16;
  - title "More overlapping items ({n})";
  - a close icon button with the **hard-coded** English name "Close" (**B-15**);
  - content with top and bottom dividers;
  - a text button "Close".
- **Close:** Escape, backdrop, icon and text button all close it.
- **Table:** bordered container, radius 10, fixed height 500, sticky header row. Columns:

| Column | Header | Cell | Sort key |
|---|---|---|---|
| time | Observed at | start as `MM/DD/YYYY hh:mm AM` (secondary text) | start ms (invalid → +∞) |
| level | Severity | level pill | rank |
| title | Title | title, weight 600 | lower-case title |
| *(domain column — dropped, see 07)* | | | |
| description | Description | text (max width 360, wraps) | lower-case description |
| actions | Actions | icon button "View details" with tooltip, centred | not sortable |

- **Sorting:**
  - default by time, ascending;
  - activating the active column toggles asc/desc; another column starts ascending and resets to page 1;
  - ties break by rank, then start, then id, all in the chosen direction.
- **Paging:** 10 rows per page; odd rows use the alternate background.
- **Pagination** (only when > 1 page):
  - Regular: Previous / page buttons / Next.
  - Compact: a compact pager.
  - Page list: all pages when ≤ 7; otherwise the first 2, the last 2, the current page ±1, and ellipses in the gaps.
- **Row action:** opens the detail view **on top of** the still-open overflow dialog.
- **Empty text:** "No additional items." (only reachable with an empty group).

### T.8 Pinning (observer strategy) `[BR-T01]` `[BR-T02]`

- **Pin line:** `scroller top + sticky-top offsetHeight`.
  - The sticky top is **outside** the scroller, so this line lies inside the visible scroll area.
  - A card is therefore pinned while its bottom is still up to one sticky-height visible (**B-05**).
- **Pin rule:** pinned when `sentinelTop < pinLine` (no epsilon, no hysteresis).
- **Mechanism:**
  - An IntersectionObserver uses `rootMargin: −stickyHeight 0 0 0` and thresholds 0 / 0.5 / 1. It is recreated whenever the sticky height changes, and each observed item re-evaluates the rule.
  - A full rect-based refresh also runs on every scroll (one per frame) and after programmatic navigation.
  - The scroll listener is re-attached on every render (**B-13**).
- **Reset:** the pinned set resets when the date changes.
- **Landing:** previous-shift pinned items are pinned right after landing.

### T.9 Active shift and header signal `[TL-11]` `[TL-12]`

- **Anchors:** `anchor(role) = (roleStart − rangeStart) × 172/h + 8` → previous 8, current 2072, next 4136.
- **Active shift:**

| scrollTop | Active |
|---|---|
| `< current − 86` | previous |
| `≥ current + 12 × 172 − 86` | next |
| otherwise | current |

- **Other flags:**
  - `atPreviousStart = scrollTop ≤ 0`;
  - header signal on every scroll event: `expanded = scrollTop ≤ current − 86 + 2` (not emitted at mount).

### T.10 Navigation buttons `[TL-11]` `[TL-13]` `[BR-T04]`

- **Visibility:** both buttons are always shown while a current segment exists.
- **Top button:**

| State | Visible content | Accessible name / tooltip | Disabled | Action |
|---|---|---|---|---|
| active = previous and `atPreviousStart` | "Previous shift" (bold 15.2 px) over the range label (12.48 px) | No previous shift available. | yes | none |
| active = next, or (active = current and **consumer header collapsed**) (**B-22**) | View current shift | Scroll to current shift start | no | current start, smooth |
| otherwise | View previous shift | Scroll to previous shift start | no | previous start, smooth |

- **Bottom button:**

| State | Visible content | Accessible name / tooltip | Disabled | Action |
|---|---|---|---|---|
| active = next | "Next shift" over the range label | No next shift available. | yes | none |
| active = previous | View current shift | Scroll to current shift start | no | current start, smooth |
| otherwise | View next shift | Scroll to next shift start | no | next start, smooth |

- **Carried-over count** (top button, hidden while the button is disabled):
  - the number of **currently pinned** items that carry the `carriedOver` tag or come from the previous shift (**B-06**) `[BR-T01]`;
  - "(2 inherited)" after landing on the baseline fixture.
- **Disabled styling:** disabled buttons keep the enabled colours.
- **Scroll target:**
  - default: `anchor(role) + hourOffset × 172 − 86`;
  - "near-bottom" variant: `anchor(role) + clamp((t − roleStart) h, 0, 12 − ε) × 172 − (clientHeight − 86)`.
- **Motion and correction:**
  - Smooth scroll, then on `scrollend` (fallback 500 ms): refresh pinning, wait 2 frames, and correct if more than 1 px off.
  - Instant path: the same as §L.7, without pause or resume.

### T.11 Landing `[TL-08]` `[TL-09]` `[TL-10]` `[BR-T05]`

- **Initial:** on mount (or when loading becomes false), one frame later: instant scroll to `current − 86` (1986 with 172 px/h). This is the same for every user role (**B-09**).
- **Date change:** every later change of `date` lands the selected time near the bottom (§T.10) → `2072 + h × 172 − (clientHeight − 86)`.
- **List → timeline switch:** one frame later:
  1. reset the active shift to current;
  2. emit header `false`;
  3. land near-bottom at the selected time;
  4. repeat the same landing **280 ms** later.
- **Flicker:** the scroll handler then emits `true` whenever the landing is above the collapse threshold (**B-04**).

### T.12 Now indicator `[TL-04]` `[BR-T06]`

- **Conditions:** shown only when all hold:
  - the selected date is not in the past;
  - `now ∈ [currentShiftStart, currentShiftEnd)`;
  - `now ∈ [rangeStart, rangeEnd]`;
  - the selected calendar day equals now's calendar day.
- **Line:** at `(now − rangeStart) × 172/h`.
- **Label:** a pill in the gutter, right 8 px, vertically centred on the line. Text is the clock time ("10:30 AM").

---

## 5. Events and callback order

| Trigger | Order of observable effects |
|---|---|
| List mount | (1) the scroll listener attaches and immediately emits the header signal; (2) next frame: instant landing (§L.9), then pin refresh; each resulting scroll event re-emits the signal. Observed sequence on the baseline fixture: `true, true, true, true`. |
| Timeline mount | next frame: instant landing → the scroll event emits the header signal (`true` at 1986). |
| Scroll (list) | per event: active shift, button states, header signal; per frame: pin refresh. |
| Scroll (timeline) | per event: active shift, header signal, previous-start flag; per frame: pin refresh; observer callbacks as sentinels cross the line. |
| Navigation button | smooth scroll → scroll events (as above) → `scrollend` → correction → (list) resume pinning after 180 ms. |
| Card / chip / row activation | open the detail view (lazy) → Escape/close → focus returns to the activator `[BR-T07]`. |
| "+more" | open the overflow dialog; sort/page state is local to the dialog and resets on every open *(inferred: remounted content)*. |
| View switch timeline → list | list: active = current; emit `true`. |
| View switch list → timeline | timeline: next frame, emit `false` and land; 280 ms later, land again; scroll events emit (possibly `true`, B-04). |
| Date change | both views: reset pinned set; re-land (list: current start; timeline: near-bottom at the time). |
| Data change | pin refresh next frame; layout recomputed; header rule re-evaluated (list). |
| Unmount | pending scroll-end timers and view-switch timers are cleared. The list's 180 ms resume timer is not cleared (harmless) *(inferred)*. |

---

## 6. States

| State | List view | Timeline view | Trigger |
|---|---|---|---|
| loading | ignored — content or empty text renders (B-02) | spinner only | `loading = true` |
| ready | sections + cards | grid + cards | data present |
| empty (no items) | "No agenda data available.", header forced expanded | grid with no cards; navigation still shown | all segments empty |
| empty shift | "No items in this shift." | empty hours | a segment empty |
| no current segment | root only | root only | segments without `current` |
| error | not represented | not represented | — (B-02) |
| refreshing | not represented | not represented | fetching flag ignored |
| active shift = previous / current / next | §L.5 | §T.9 | scroll |
| navigation disabled | buttons hidden instead | top at the very top of previous; bottom in next | §L.6, §T.10 |
| pinned | chips in the strip | chips in the strip | §L.4, §T.8 |
| header expanded / collapsed | signal §L.8 | signal §T.9 | scroll, view switch, empty |
| detail open | lazy dialog | lazy dialog | activation |
| overflow open | — | dialog | "+more" |
| focused | 2 px outline, level colour | same | keyboard focus |
| hovered | shadow raise | shadow raise; "+more" outer shadow | pointer |
| compact | stacked card content, scroll-to-top button | 1-column crowded cap | §2.6 |
| reduced motion | instant scrolls, no chip animation | same | media query |
| past date / now outside shift | — | no now indicator | §T.12 |
| dragging, selection, editing | not supported | not supported | — |

---

## 7. Edge cases

1. **Known limitations (from the brief):**
   - only two fixed view modes;
   - always exactly 3 shifts;
   - shift length fixed at 12 h;
   - anchors fixed at 08:00 and 20:00;
   - column caps fixed at 3 / 3 / 1;
   - level order fixed;
   - navigation threshold fixed at 5;
   - header collapse rule fixed at > 3 items;
   - hour height fixed at 172.
   
   Nothing is configurable. These become extension features (`05-features.md`).
2. **Empty data:** §6.
3. **Huge data:** 240 items render. There is no virtualization, and the layout cost grows super-linearly (B-11). The list shows long frames while scrolling (B-12). Dense overflow collapses into one chip (B-10).
4. **Ends:**
   - a missing end means start + 2 h;
   - an end before the start is treated as duration 0 (height 80);
   - an invalid end produces NaN geometry *(inferred)*.
5. **Boundaries:** an item that starts exactly at a boundary belongs to the later shift (half-open) `[L-12]`. Now exactly at the shift end is not shown.
6. **Items crossing shifts** are bucketed by start only. In the timeline they extend into the next shift's rows.
7. **Duplicate ids** make React keys collide and the id→item lookup keeps the last *(inferred)*.
8. **Rapid navigation clicks** replace the pending `scrollend` handler and timers. The last click wins.
9. **Date change during a smooth scroll:** the landing overrides it; any pending correction runs against the new layout *(inferred)*.
10. **Data change with the detail view open:** B-03.
11. **Unmount mid-scroll:** timers cleared (§5); observers disconnected.
12. **DST days:** boundaries drift by the transition (B-07).
13. **Time zone:** every rule uses the browser's local zone. The data's own zone is not considered.
14. **Invalid `date`:** falls back to `new Date()` only when the field is missing, not when it is invalid *(inferred)*.
15. **Missing `observedLabel` on a critical-kind item:** prints "Observed at: undefined" *(inferred, B-24)*.
16. **Many pinned items:** the strip scrolls horizontally; nothing wraps.

---

## 8. Accessibility (as-is)

- **Roles and names**
  - List card activator: `div` with `role=button`, `tabindex=0`, name = title. Timeline card: `<button>`, name = title. For both, the level, time and description are **not** in the accessible name or description.
  - Pinned chip: `<button>`, name = title.
  - Navigation buttons: name = tooltip text, which differs from the visible label (B-26).
  - Disabled buttons: name = "No previous/next shift available.".
  - "+more" chip: `<button>`, name "More" (no count, no time).
  - Scroll-to-top button: name "Scroll to top".
  - Decorative parts (rails, icons, fades, sentinels) are hidden from assistive technology.
- **Structure:** there are no list or landmark semantics. Section titles and card titles render as `h6` elements, so heading levels are skipped *(inferred)*.
- **Keyboard**
  - Tab order: pinned chips → top button → cards in DOM order → bottom button. In the timeline, "+more" chips come after all cards `[BR-T07]`.
  - Enter and Space activate. Escape closes dialogs, and focus returns to the trigger.
  - There are no arrow keys, no roving focus and no skip link.
- **Focus-visible:** 2 px outline, offset 2, in the level colour. The "+more" chip uses the primary colour, which is invisible in dark mode (B-19).
- **Announcements**
  - Only the pinned strip is announced (polite, atomic status region wrapping interactive buttons, B-17).
  - Shift changes, header state and overflow counts are not announced.
- **Motion:** reduced motion is honoured for programmatic scrolls and the chip animation.
- **Contrast:** several dark-mode parts fail: scroll-to-top button, spinner, "+more" focus ring (B-19).

---

## 9. Responsive behaviour

| Width / condition | Behaviour |
|---|---|
| ≥ 900 px, desktop user agent | Regular. List card columns side by side (gap 24). Pinned chips 436 px wide; strip padding 32 px horizontally. Crowded cap 3. |
| 600–899 px, or a mobile user agent at any width | **Compact.** Card content stacked (`column-reverse`, gap 8). List sticky padding-bottom 28 (regular 24). Top button stacks label and count (gap 8). Scroll-to-top button. Timeline crowded cap 1. Chips 360 px wide. |
| < 600 px | As compact; chips 90 % of the strip; strip padding 16 px. The consumer shows only the list view. |
| Any | The timeline sticky padding-bottom is 28. The timeline grid width follows the container; gutter and pads stay fixed. |

---

## 10. Strings (current en / es) — generic keys

| Key | en | es |
|---|---|---|
| `emptyAll` | No agenda data available. | No hay datos de agenda disponibles. |
| `emptyShift` | No items in this shift. | No hay elementos programados para este turno. |
| `shiftHeader.previous` | Previous shift | Turno anterior |
| `shiftHeader.current` | Current shift | Turno actual |
| `shiftHeader.next` | Next shift | Próximo turno |
| `nav.viewPrevious` | View previous shift | Ver turno anterior |
| `nav.viewCurrent` | View current shift | Ver turno actual |
| `nav.viewNext` | View next shift | Ver próximo turno |
| `nav.carriedOverCount` | ({{count}} inherited) | ({{count}} heredados) |
| `nav.toPreviousHint` | Scroll to previous shift start | Ir al inicio del turno anterior |
| `nav.toCurrentHint` | Scroll to current shift start | Ir al inicio del turno actual |
| `nav.toNextHint` | Scroll to next shift start | Ir al inicio del próximo turno |
| `nav.noPrevious` | No previous shift available. | No hay un turno anterior disponible. |
| `nav.noNext` | No next shift available. | No hay un próximo turno disponible. |
| `scrollTop` | Scroll to top | Volver arriba |
| `timeLabel.observed` | Observed at: | Observado a las: |
| `timeLabel.since` | Ready since: | Listo desde: |
| `referenceLabel` | *(source: a domain word)* → parity default **Ref:** | Ref.: |
| `more.label` | More | Más |
| `overflow.title` | More overlapping items ({{count}}) | Más elementos superpuestos ({{count}}) |
| `overflow.empty` | No additional items. | No hay más elementos. |
| `overflow.tableLabel` | Overflow items table | Tabla de elementos superpuestos |
| `overflow.close` | Close | Cerrar |
| `overflow.closeIcon` | Close *(hard-coded today)* | Cerrar |
| `overflow.viewDetails` | View details | Ver detalles |
| `overflow.column.time` | Observed at | Observado a las |
| `overflow.column.level` | Severity | Severidad |
| `overflow.column.title` | Title | Título |
| `overflow.column.description` | Description | Descripción |
| `overflow.column.actions` | Actions | Acciones |
| `pagination.previous` | Previous | Anterior |
| `pagination.next` | Next | Siguiente |
| `levels.critical` … `levels.resolved` | Critical, Watch, Monitoring, Capacity Watch, Ready, Normal, On target, Routine, Resolved | Crítico, Vigilancia, Supervisión, Vigilancia de capacidad, Listo, Normal, En objetivo, Rutina, Resuelto |
| `tags.impactsNextShift` | Impacts Next Shift | Afecta al siguiente turno |
| `tags.carriedOver` | Inherited | Heredado |

**Formats** (golden: `characterization/golden/format-samples.json`):

| Format | Rule | en | es |
|---|---|---|---|
| Hour label | always en-US compact | 8AM | — |
| Clock time | `Intl` `h:mm AM` | 10:30 AM | 10:30 a. m. |
| Boundary range | `Intl` short month, day, hour; joined with " - " | Mar 11, 8 PM - Mar 12, 8 AM | 11 mar, 8 p. m. - 12 mar, 8 a. m. |
| Since timestamp | fixed `MM/DD/YYYY hh:mm AM` | 03/12/2031 07:45 AM | same (B-15) |
| Segment date | `Intl` long month | March 12, 2031 | — |

Any language other than `es` uses the en-US formats.

---

## 11. Performance traits

- **Memoization**
  - The list section list, the timeline grid and the timeline card are memoized components.
  - Layout is memoized on (items, compact, rangeStart). Time labels are memoized per item.
  - The clock and range `Intl` formatters are cached. The hour-label formatter is created per call.
- **Rendering and loading**
  - There is no virtualization: every card renders, and every timeline card is absolutely positioned.
  - The detail dialogs are code-split and mounted only while open.
- **Event handling**
  - Scroll listeners are passive.
  - Pin refresh is throttled to one per animation frame.
  - The list pin refresh reads the bounding rect of every pinned-level card each frame.
- **Measurements** (source production build, Chromium, 1440 × 900, no CPU throttling — `[PERF]`):

| Measure | Baseline fixture (17 items) | Large fixture (240 items) |
|---|---|---|
| Mount to first frame, list | 33–81 ms (first run includes warm-up) | 179–221 ms |
| Mount to first frame, timeline | 29–35 ms | 213–249 ms |
| DOM nodes, list / timeline | 383 / 461 | 4 294 / 1 838 |
| Scripted scroll, 120 frames, timeline | — | median 16.7 ms, p95 18 ms, no long tasks |
| Scripted scroll, 120 frames, list | — | median 16.5 ms, **p95 62 ms, 13 long tasks of 50–60 ms** (B-12) |
| Layout computation (Node) | — | ~290 ms per run (B-11) |
