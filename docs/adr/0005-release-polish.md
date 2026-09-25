# 0005 — 1.0.0 polish: navigation over any number of shifts, card and button room, demos that scroll

Status: accepted (1.0.0 release preparation, 2026-09-25). D2 and D3 follow the user's decision that the visual fixes apply to the default preset only.
Scope: the list's navigation targets, the default preset's timeline card minimum and navigation-button room, and how the documentation site gives every scheduler a height (Feature Dossier `01` §L.5–§L.7, `02` §4, `06` §4).

## Context

A review of the site before the first publish found that the navigation buttons did not move the view, that short timeline cards cut their titles, and that the navigation buttons had almost no room above and below them. Measured against the built site with Playwright:

- Nothing on the site could scroll. The root fills its parent (`01` §2), and no demo, the Playground, the README or the Installation page gave that parent a height, so every scheduler grew to its content.
- With a height, two list navigation paths looped: the button kept offering the jump it had just made. Both come from rules written for the source's three shifts (previous, current, next) and generalized to any number of shifts.
- The timeline's `minCardHeight` of 80 cannot hold a card: top padding, the title, the divider and the pill footer need about 107 px in the standard density.
- The buttons sit centered on a divider with half their height inside a sticky band that left them 1–5 px, so the focus ring and any taller label were cut by the root's `overflow: hidden`.

## Decisions

### D1 — The list's previous-jump offset applies to the first shift only (DQ-10, DQ-11)

`previousJumpExtraOffset` (104 px) exists so that the jump to the previous shift reaches the top of the list (`01` §L.7, BR-L04: it "usually drives the target below 0"). In the source the previous shift is always the first. Applied to a middle earlier shift, it lands 104 px inside the shift before it; that shift stays active and the bottom button offers the same jump again. The offset now applies only when the target is the first rendered shift and earlier than the current one.

The first section was "at its start" only within `segmentEpsilon` of the top of the list. When the first section sits lower in the content — no earlier shift rendered, so the current shift is first — a jump to it lands 16 px down and never counted as reached, so the top button offered it again. The first section now also counts as at its start once its top reaches the visible top, the rule every other section uses.

With three shifts both rules give exactly the old results, so the classic preset's parity scenarios are unchanged. A browser test walks every shift down and back up with `before: 2` and `before: 0` in three engines; it fails on the old code at the second press.

### D2 — Default preset: short cards keep their title, and cards never overlap (DQ-12)

`minCardHeight` 80 (Dossier `01` §T.5, `06` §4) is less than a card needs: 20 px padding, a 20 px title line, 16 px below it, the divider, a 48 px pill row and the borders make 107 px in the standard density. On a short item the footer cut the title's descenders, the level rail collapsed, and the description and time lines were cut mid-glyph.

- **Minimum:** the default preset draws a card at least 108 px tall (128 `comfortable`, 88 `dense`): the title with the card's own padding above and below it, the divider and the pill row. The React layer fills this in when the consumer sets no `timeline.minCardHeight`; an explicit value wins. Classic and the headless controller keep 80 / 96 / 56.
- **Whole lines:** in the default preset, the title, description and time label are items of one wrapping column in the card body, which clips. A line that does not fit moves to a second, clipped column instead of being cut; the title always stays, and the time label keeps its place at the bottom while it fits.
- **No overlap:** a taller minimum draws more cards past their item's end, and the layout decides columns by the item's time, so a short card ran under the next card of its column. The new `timeline.keepCardsApart` option makes a card take its column until the end of what is drawn, and gives an overlapping group a column for every card. The second half also covers DQ-3: compact promotion can leave a card at or past its group's column count, which the renderer clamps into the last column (ADR 0003 D3) — over another card. The default preset turns the option on; classic and the headless controller keep the original placement, so the golden layouts and the SHOT and VIS parity tests are unchanged. `PlacedCard.end` and `height` are the item's own either way.

The option is an addition to the Dossier's `TimelineOptions` (`04` §4). A layout property test draws 40 dense random days, compact and not, and finds overlapping cards with the option off and none with it on. Browser tests in three engines and three densities check that the title keeps its padding on every short card, the rail is drawn, and no text line is cut.

### D3 — Default preset: room around the navigation buttons (DQ-13)

The buttons sit centered on a divider, half inside a sticky band: `01` §L.6 and `02` §4 give the list's bottom band 16 px and the top band 24–28 px, for a 30 px button and a 62 px two-line edge label. The root clips, so the focus ring and the top of the timeline's edge label were cut (the label started 3–7 px above the root). The default preset's bands are 32 px for the list and 44 px for the timeline and compact mode, top and bottom: half the tallest button, its 4 px focus ring and 4 px of air. A browser test checks every button in the list and the timeline, compact or not, landed and at both ends, in three engines; the same test fails for classic, which keeps the source's bands.
