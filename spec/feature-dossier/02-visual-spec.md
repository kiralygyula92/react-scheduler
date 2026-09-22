# 02 — Visual specification and the "classic" preset

Every value below was **measured** in Chromium from the running source, in both colour schemes. The
measurements are in `characterization/measured-styles.{light,dark}.json`. The reference renders are in
`characterization/screenshots/`.

The **classic** preset **MUST** reproduce these values exactly (pixel parity at 1× device pixel ratio,
same fonts available). Values marked *(code)* were read from the implementation because a transition or
state made them impractical to measure; *(lib default)* marks values that came from the source UI kit's
defaults.

Colours are hex; `#RRGGBB/a` means that colour at alpha `a`. Sizes are CSS px.

---

## 1. Design tokens — classic preset

The CSS custom properties use the `--rs-` prefix. The same token names are used by the `light` and `dark`
library presets (`06-customization-theming.md`); only the values differ.

### 1.1 Colour

| Token | Classic light | Classic dark | Used by |
|---|---|---|---|
| `--rs-color-bg` | `#FFFFFF` | `#121212` | view background, sticky top, edge-fade base |
| `--rs-color-surface` | `#FFFFFF` | `#1E1E1E` | default card surface, timeline card top block |
| `--rs-color-surface-muted` | `#F9F9F9` | `#161616` | timeline card bottom block, muted card surface |
| `--rs-color-surface-overlay` | `#FFFFFF` | `#202020` | dialog paper |
| `--rs-color-text` | `#000000` | `#FFFFFF` | card titles, suggestion, nav text, boundary hour labels/lines |
| `--rs-color-text-muted` | `#6F7173` | `#8A8D92` | time label, description, hour labels, muted titles, disabled-nav range |
| `--rs-color-text-secondary` | `#000000/0.6` | `#FFFFFF/0.7` | shift-header range, empty texts, table secondary text |
| `--rs-color-text-body` | `#000000/0.87` | `#FFFFFF` | shift-header title, dialog title, table body text |
| `--rs-color-text-inverse` | `#FFFFFF` | `#000000` | now label text, "+more" label |
| `--rs-color-on-pill-dark` | `#000000` | `#000000` | text/icon on light pills (tag, reference, watch-type levels) |
| `--rs-color-on-pill-light` | `#FFFFFF` | `#FFFFFF` | text/icon on strong level pills |
| `--rs-color-divider` | `#DFDFDF` | `#333333` | card border and inner divider, reference-pill border, sticky-bottom border, dialog dividers |
| `--rs-color-grid-line` | `#DFDFDF` | `#222222` | grid border, hour lines, table borders |
| `--rs-color-grid-boundary` | `#000000` | `#FFFFFF` | shift-boundary lines (= text) |
| `--rs-color-off-shift` | `#F2F2F2` | `#161616` | off-shift hour bands |
| `--rs-color-now` | `#999DA6` | `#999DA6` | now line and now label background |
| `--rs-color-nav-bg` | `#F9F9F9` | `#161616` | navigation buttons |
| `--rs-color-nav-bg-hover` | `#ECECEC` | `#2A2A2A` | navigation buttons, hover |
| `--rs-color-nav-border` | `#B8B8B8` | `#222222` | navigation buttons |
| `--rs-color-alert-surface` | `linear-gradient(45deg, #F8B6A1 0%, #FFFFFF 100%)` | `linear-gradient(45deg, #5C2410 0%, #1E0F0A 100%)` | alert-variant cards, pinned chips |
| `--rs-color-alert-border` | `#D79C8B` | `#222222` | alert-variant cards and chips |
| `--rs-color-alert-text-muted` | `#865A4C` | `#A97867` | time label / description on alert variant |
| `--rs-color-pill-neutral` | `#FFFFFF` | `#FFFFFF` | tag pill, reference pill |
| `--rs-color-more-bg` | `#000000` | `#FFFFFF` | "+more" chip |
| `--rs-color-more-text` | `#FFFFFF` | `#000000` | "+more" label |
| `--rs-color-tooltip-bg` | `#262626` | `#262626` | tooltip panel and arrow |
| `--rs-color-tooltip-text` | `#FFFFFF` | `#FFFFFF` | tooltip text |
| `--rs-color-accent` | `#141414` | `#000000` | scroll-to-top button, spinner, "+more" focus ring (**B-19** in dark) |
| `--rs-color-on-accent` | `#FFFFFF` | `#FFFFFF` | scroll-to-top icon |
| `--rs-color-backdrop` | `#000000/0.5` | `#000000/0.5` | dialog backdrop |
| `--rs-color-table-head-bg` | `#F5F5F5` | `#1E1E1E` | overflow table header |
| `--rs-color-table-head-text` | `#6F7173` | `#A0A4AB` | overflow table header text |
| `--rs-color-table-row` | `#FFFFFF` | `#161616` | overflow table, even rows |
| `--rs-color-table-row-alt` | `#F9F9F9` | `#1E1E1E` | overflow table, odd rows |
| `--rs-color-table-row-hover` | `#ECECEC` | `#2A2A2A` | overflow table row hover *(code)* |
| `--rs-color-icon` | `#000000/0.54` | `#FFFFFF` | table row action icon |
| `--rs-color-icon-muted` | `#6F7173` | `#8A8D92` | dialog close icon |
| `--rs-color-edge-fade-tint` | `#2477FF/0.06` | `#3F76D6/0.06` | pinned-strip edge fades (monitoring level colour) |

**Level colours** (`--rs-level-<key>`; the text colour on each pill follows `01` §2.2):

| Level | Light | Dark |
|---|---|---|
| critical | `#F26D43` | `#D36A4D` |
| watch | `#FFB443` | `#C08E32` |
| monitoring | `#2477FF` | `#3F76D6` |
| capacityWatch | `#FFB443` | `#C08E32` |
| ready | `#4FCF8E` | `#3FA36F` |
| normal | `#4FCF8E` | `#3FA36F` |
| onTarget | `#4FCF8E` | `#3FA36F` |
| routine | `#4FCF8E` | `#3FA36F` |
| resolved | `#999DA6` | `#6F747C` |

### 1.2 Shadow

| Token | Classic light | Classic dark |
|---|---|---|
| `--rs-shadow-card` | `0 1px 1px 0 #000000/0.15` | same |
| `--rs-shadow-card-hover` | `0 2px 4px 0 #000000/0.30` | `0 2px 4px 0 #000000` |
| `--rs-shadow-sticky` | `0 1px 0 0 #F1F1F1, 0 5px 10px 0 #000000/0.2` | `0 1px 0 0 #222222, 0 5px 10px 0 #000000/0.2` |
| `--rs-shadow-pill` | `inset 0 12px 12px 0 #FFFFFF/0.2` | same |
| `--rs-shadow-pill-hover` | `inset 0 12px 12px 0 #FFFFFF/0.2, 0 2px 4px 0 #000000/0.30` *(code)* | `inset 0 12px 12px 0 #000000/0.2, 0 2px 4px 0 #000000/0.30` *(code)* |
| `--rs-shadow-tooltip` | `0 4px 16px 0 #000000/0.25` | same |
| `--rs-shadow-dialog` | `0 2px 6px 0 #000000/0.16` | `0 2px 6px 0 #000000/0.44` |
| `--rs-shadow-floating` | `0 3px 5px -1px #000000/0.2, 0 6px 10px 0 #000000/0.14, 0 1px 18px 0 #000000/0.12` | same |

### 1.3 Radius

| Token | Value | Used by |
|---|---|---|
| `--rs-radius-card` | 12 | cards, pinned chips, level rails |
| `--rs-radius-pill` | 9999 (fully rounded) | level/tag/reference pills, "+more" chip |
| `--rs-radius-button` | 8 | navigation buttons, "Close" text button, now label |
| `--rs-radius-tooltip` | 12 | tooltip |
| `--rs-radius-dialog` | 16 | dialogs |
| `--rs-radius-table` | 10 | overflow table container |
| `--rs-radius-grid` | 12 (inner clip 11) | time grid box |

### 1.4 Typography

| Token | Value |
|---|---|
| `--rs-font-family` | `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `--rs-font-family-display` | `InterTight, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |

- The classic preset names these families but **MUST NOT** bundle font files. Screenshots were taken with both variable fonts installed (both OFL-licensed and publicly available).
- Without them the system fallbacks apply, and pixel parity is not expected.

| Text style | Family | Size / line-height / weight | Letter-spacing | Colour token |
|---|---|---|---|---|
| card title | display | 16 / 20 / 600 | — | text (muted variant: text-muted) |
| card description | display | 14 / 20 / 400 | — | text-muted (alert: alert-text-muted) |
| card time label | display | 14 / 20 / 400 | — | text-muted (alert: alert-text-muted) |
| timeline suggestion | base | 14 / 20 / 500 | — | text (muted variant: text-muted) |
| pill label | base | 12 / 12 / 400, no wrap | — | on-pill-dark / on-pill-light |
| navigation label | base | 14 / 16 / 400 | 0.4 | text |
| carried-over count | base | 14 / 14 / 700 | 0.4 | level critical |
| disabled-nav title | base | 15.2 / 20 / 700 | 0.4 | text |
| disabled-nav range | base | 12.48 / 20 / 500 | 0.4 | text-muted |
| shift-header title | base | 15.2 / 20 / 700 | — | text-body |
| shift-header range | base | 12.48 / 20 / 500 | — | text-secondary |
| empty text | base | 12 / 14 / 500 | — | text-secondary |
| hour label | base | 12 / 14 / 500 | — | text-muted (boundary: text) |
| now label | base | 12 / 14 / 500, no wrap | — | text-inverse |
| "+more" label | base | 13.6 / 20.4 / 600, ellipsis | — | more-text |
| tooltip | base | 12 / 16.8 / 400 | — | tooltip-text |
| dialog title | base | 16 / 24 / 600 | — | text-body |
| table header | base | 14 / 21 / 600, no wrap | — | table-head-text (active sort: text-body) |
| table cell | base | 14 / 20 / 400 (title 600) | — | text-secondary (title: text-body) |
| "Close" text button | base | 14 / 24.5 / 500 | 0.4 *(lib default)* | text |

- **Line clamping:**
  - list card: title 2 lines, description 1, time 2;
  - timeline card: title 1, description 1, time 1, suggestion 1;
  - pinned chip: title 1, time 1.

### 1.5 Dimensions and spacing

| Token | Value | Meaning |
|---|---|---|
| `--rs-hour-height` | 172 | timeline px per hour |
| `--rs-gutter-width` | 88 | hour-label gutter |
| `--rs-lane-padding` | 64 | left pad and right ("+more") pad of the card lane |
| `--rs-card-gap` | 4 | horizontal column gap; subtracted from card height |
| `--rs-card-min-height` | 80 | minimum timeline card height |
| `--rs-pill-height` | 24 | level/tag/reference pill |
| `--rs-more-height` | 28 | "+more" chip |
| `--rs-rail-width` | 4 | level rail |
| `--rs-edge-fade-width` | 25 | pinned-strip fades |
| `--rs-sticky-bottom-list` | 16 | list sticky-bottom height |
| `--rs-sticky-bottom-timeline` | 32 | timeline sticky-bottom height |
| `--rs-grid-pad-top` / `-bottom` | 8 / 12 | time grid |
| `--rs-now-line` | 2 | now line thickness; starts 9 px left of the grid |
| `--rs-focus-ring` | 2 solid, offset 2 | focus-visible outline |

---

## 2. Motion

| What | Value |
|---|---|
| card / chip shadow and border | `box-shadow 150ms ease, border-color 150ms ease` |
| pinned chip entrance | keyframes over 180 ms, `cubic-bezier(0.2, 0.9, 0.3, 1.2)`, fill `both`: 0 % `opacity 0; translateY(−8px) scale(0.96)` → 60 % `opacity 1; translateY(1px) scale(1.005)` → 100 % identity; `transform-origin: top center`. Removed under reduced motion. |
| navigation button colours | `background-color, box-shadow, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1)` |
| "+more" chip | `background-color, box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)` |
| dialog backdrop | `opacity 225ms cubic-bezier(0.4, 0, 0.2, 1)` |
| programmatic scrolling | native smooth scroll; instant under reduced motion |
| consumer header (outside the feature) | 250 ms height transition |

---

## 3. Stacking order

| Layer | z-index |
|---|---|
| sticky top, sticky bottom | 10 (navigation buttons 1 inside) |
| grid: bands, hour lines | 0 |
| grid: left pad, card lane | 1 |
| grid: right pad ("+more") | 2 |
| grid: now line, now label | 3 |
| pinned-strip edge fades | 1 inside the strip |
| scroll-to-top button | 1050 |
| dialogs | 1300 *(lib default)* |
| tooltip | 1500 *(lib default)* |

---

## 4. Parts

### 4.1 Sticky sections

- **List sticky top:**
  - `position: sticky; top: −1px`;
  - background `bg`, shadow `sticky`;
  - padding-bottom 24 (compact 28).
- **Timeline sticky top:** the same, but outside the scroller; padding-bottom 28.
- **Sticky bottom:** top border 1 px `divider`; height 16 (list) or 32 (timeline).
- **Navigation buttons:**
  - absolutely centred on the section edge: `left: 50%`, `translate(−50%, 50%)` for top and `translate(−50%, −50%)` for bottom;
  - border 1 px `nav-border`, radius 8, padding 6 / 12;
  - background `nav-bg` (hover `nav-bg-hover`).
- **Disabled navigation buttons** keep the enabled colours.
- **Compact top button:** column direction, gap 8.

### 4.2 Pinned strip and chips

- **Strip:**
  - padding 16 top, 8 bottom, 32 horizontal (16 below 600 px);
  - track gap 10, padding-bottom 4, horizontal scrolling, thin scrollbar (8 px, thumb radius 4).
- **Chip:**
  - `<button>`, fixed width 436 (≥ 900), 360 (600–899), 90 % (< 600); height follows content (100 with the fixtures);
  - padding 12, border 1 px `alert-border`, radius 12, background `alert-surface`, shadow `card`;
  - rail 4 px critical colour, radius 12, margin-right 12;
  - text column gap 4;
  - pills row margin-top 2, gap 6.
- **Edge fades:**
  - 25 px wide, full height, pointer-events none, z-index 1;
  - `linear-gradient(to right|left, bg, bg/0.55 35%, edge-fade-tint 55%, transparent)`.

### 4.3 List card (variants)

- **Root:** border 1 px, radius 12, shadow `card`, overflow hidden.
- **Activator row:** padding 12, bottom border 1 px.
- **Rail:** 4 px left border in the level colour, radius 12, margin-right 20.
- **Regular layout:** content row gap 24.
- **Compact layout:** `column-reverse`, gap 8.
- **Pills row:** margin-top 8, gap 6.
- **Text column:** gap 4; the description has margin-top 6 (0 in compact).

| Variant | Surface | Border / inner divider | Title | Description & time |
|---|---|---|---|---|
| default | `surface` | `divider` | `text` | `text-muted` |
| alert | `alert-surface` | `alert-border` | `text` | `alert-text-muted` |
| muted | `surface-muted` | `divider` | `text-muted` | `text-muted` |

### 4.4 Timeline card

- **Root:** as the list card (`<button>`, radius 12, border 1, shadow `card`, no padding).
- **Top block:**
  - padding 20 / 12 / 16 / 12, bottom border 1 px;
  - rail 4 px (margin-right 20);
  - text block gap 4, with the time label pinned to the bottom (space-between).
- **Bottom block:** padding 12, gap 12, pills gap 6.

| Variant | Top surface | Bottom surface | Border | Title | Description & time | Suggestion |
|---|---|---|---|---|---|---|
| default | `surface` | `surface-muted` | `divider` | `text` | `text-muted` | `text` |
| alert | `alert-surface` | transparent | `alert-border` | `text` | `alert-text-muted` | `text` |
| muted | `surface-muted` | `surface-muted` | `divider` | `text-muted` | `text-muted` | `text-muted` |

### 4.5 Pills

- **All pills:**
  - height 24, horizontal padding 8, radius fully rounded, shadow `pill`, gap 6;
  - a 6 × 6 **diamond** marker, then the label.
- **Level pill:** background = level colour; text/marker `on-pill-light`, or `on-pill-dark` for watch-type levels.
- **Tag pill:** background `pill-neutral`; text/marker `on-pill-dark`.
- **Reference pill:** as the tag pill, plus a 1 px `divider` border; label `"{referenceLabel} {value}"`.
- **Diamond marker:** a 4 × 4 square rotated −45° about `(0, 2.828)` inside a 6 × 6 box, filled with the current text colour.

### 4.6 Time grid

- **Gutter:**
  - 88 wide;
  - labels absolutely placed at `hour × 172 − 6`, right-aligned, padding-right 24, `user-select: none`.
- **Grid box:** border 1 `grid-line`, radius 12.
- **Bands:** `off-shift`; inner layer inset 1 px, radius 11; the first and last bands are rounded.
- **Hour line:** 1 px `grid-line`.
- **Boundary line:** 2 px `grid-boundary`. The first and last lines are transparent.
- **Now line:** 2 px `now`, from −9 px to the right edge.
- **Now label:**
  - right 8, vertically centred on the line;
  - padding 8, radius 8;
  - background `now`, text `text-inverse`.
- **Lane:** left pad 64, lane flexible, right pad 64.
- **Content padding** around the grid: 24 top and bottom, 32 right.

### 4.7 "+more" chip

- **Placement:** in the right pad; left 4; `max-width: fit-content`.
- **Box:** height 28, horizontal padding 8 (label padding 4), radius fully rounded.
- **Colours:** background `more-bg`, border 1 `more-bg`; shadow `pill` (hover `pill-hover`).
- **Label:** 13.6 / 600 `more-text`, ellipsis.
- **Focus ring:** 2 px `accent`, offset 2.

### 4.8 Overflow dialog and table

- **Paper:**
  - max width 1200, margin 32, radius 16;
  - background `surface-overlay`, shadow `dialog`;
  - backdrop `backdrop`.
- **Title bar:** padding 16 / 24; title text; close icon button 32 × 32 (18 px glyph, `icon-muted`).
- **Content:** padding 16 / 24, top and bottom dividers.
- **Table container:** border 1 `grid-line`, radius 10 (bottom corners square when paginated), height 500, background `table-row`.
- **Header cells:**
  - padding 12 / 24;
  - background `table-head-bg`, text `table-head-text`, sticky;
  - active sort label `text-body` with an arrow.
- **Body cells:**
  - padding 12 / 24, bottom border 1 `grid-line`, top-aligned;
  - odd rows `table-row-alt`, hover `table-row-hover`.
- **Row action:** 30 × 30 round icon button (eye glyph, 18 px).
- **Actions bar:** padding 16 / 24; "Close" text button (padding 6 / 8, radius 8).
- **Column minimum widths:** time 200, level 140, title 200, description 280 (max 360), actions 92.
- **Pagination bar** (regular) *(code)*:
  - padding 16, border 1 px without a top border, bottom corners radius 8;
  - Previous and Next outlined buttons at the ends (padding 12 / 24, 14 px);
  - page buttons 40 × 40, radius 4, 14 px; the current page shows a light-grey background and border;
  - ellipsis gap 4.

### 4.9 Other parts

- **Tooltip:**
  - placement top with an arrow;
  - panel `tooltip-bg`, radius 12, padding 16, max width 360, shadow `tooltip`;
  - 14 px gap from the anchor *(measured)*.
- **Scroll-to-top button:**
  - 48 × 48 circle, background `accent`, icon `on-accent` (24 px chevron up), shadow `floating`;
  - fixed position 16 px from the right and bottom (respecting safe-area insets).
- **Spinner:** 40 px circular indeterminate indicator in `accent` *(lib default size)*, centred with padding 32.
- **Empty texts:** centred, vertical padding 32, empty-text style.
- **Section header:** padding 24 / 16 / 16, centred; range margin-top 2.
- **List body:** padding 24 / 16.
- **Card list:** column, gap 6, padding 8 top, 12 bottom.

---

## 5. Reference screenshots

The screenshots are in `characterization/screenshots/`. They were rendered with the sanitized fixtures at
1× in Chromium with the time zone UTC and the locale en-US. Two domain labels were replaced before
capture: the reference label reads "Ref:" and a dropped overflow column is titled "Age".

| File | Content |
|---|---|
| `list-desktop-light-landing.png` / `-dark-` | list view after landing (baseline fixture) |
| `list-desktop-light-scrolled-collapsed.png` | list scrolled into the current shift (header signal collapsed) |
| `list-desktop-light-top-of-previous.png` | list at the very top (no top button) |
| `list-desktop-light-pinned-many.png` | six pinned chips with edge fade |
| `list-desktop-light-empty.png` | no items |
| `list-desktop-light-sparse-no-nav.png` | under the navigation threshold |
| `list-compact-light-landing.png` / `-dark-` | 390 × 844 compact list |
| `list-compact-dark-scroll-top-button.png` | compact list scrolled, scroll-to-top button (shows B-19) |
| `timeline-desktop-light-landing.png` / `-dark-` | timeline after landing |
| `timeline-desktop-light-top-disabled.png` | top of the previous shift (disabled top button) |
| `timeline-desktop-light-bottom-disabled.png` | end of the grid (disabled bottom button; shows B-05) |
| `timeline-desktop-light-tooltip.png` | tooltip on the bottom button |
| `timeline-desktop-light-overflow-dialog.png` | overflow dialog |
| `timeline-desktop-light-crowded.png` | crowded fixture (3 columns + "+more") |
| `timeline-medium-light-crowded-compact-columns.png` | 768 × 1024 compact columns |
| `timeline-desktop-light-loading.png` | loading spinner |
| `timeline-desktop-light-past-date.png` | past date (no now indicator) |
