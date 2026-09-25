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
