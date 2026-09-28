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

The first section was "at its start" only within `segmentEpsilon` of the top of the list. When the first section sits lower in the content — no earlier shift rendered, so the current shift is first — a jump to it lands 16 px down and never counted as reached, so the top button offered it again. The first section now counts as at its start while the list is no further down than a jump to it lands, within the epsilon. With the source's three shifts that landing is the top of the list (the extra offset drives it below 0), so the rule is `scrollTop ≤ epsilon` exactly, as before.

Both rules give the old results with three shifts, so the classic preset's parity scenarios are unchanged. A first version counted the first section as reached once its top met the visible top, like the others; that also held 9–16 px down with three shifts, hid the top button there, and changed the Firefox tab order the F-19 test walks. The rule above has no such window. A browser test walks every shift down and back up with `before: 2` and `before: 0` in three engines; it fails on the old code at the second press.

### D2 — Default preset: short cards keep their title, and cards never overlap (DQ-12)

`minCardHeight` 80 (Dossier `01` §T.5, `06` §4) is less than a card needs: 20 px padding, a 20 px title line, 16 px below it, the divider, a 48 px pill row and the borders make 107 px in the standard density. On a short item the footer cut the title's descenders, the level rail collapsed, and the description and time lines were cut mid-glyph.

- **Minimum:** the default preset draws a card at least 108 px tall (128 `comfortable`, 88 `dense`): the title with the card's own padding above and below it, the divider and the pill row. The React layer fills this in when the consumer sets no `timeline.minCardHeight`; an explicit value wins. Classic and the headless controller keep 80 / 96 / 56.
- **Whole lines:** in the default preset, the title, description and time label are items of one wrapping column in the card body, which clips. A line that does not fit moves to a second, clipped column instead of being cut; the title always stays, and the time label keeps its place at the bottom while it fits.
- **No overlap:** a taller minimum draws more cards past their item's end, and the layout decides columns by the item's time, so a short card ran under the next card of its column. The new `timeline.keepCardsApart` option makes a card take its column until the end of what is drawn, and gives an overlapping group a column for every card. The second half also covers DQ-3: compact promotion can leave a card at or past its group's column count, which the renderer clamps into the last column (ADR 0003 D3) — over another card. The default preset turns the option on; classic and the headless controller keep the original placement, so the golden layouts and the SHOT and VIS parity tests are unchanged. `PlacedCard.end` and `height` are the item's own either way.

The option is an addition to the Dossier's `TimelineOptions` (`04` §4). A layout property test draws 40 dense random days, compact and not, and finds overlapping cards with the option off and none with it on. Browser tests in three engines and three densities check that the title keeps its padding on every short card, the rail is drawn, and no text line is cut.

### D3 — Default preset: room around the navigation buttons (DQ-13)

The buttons sit centered on a divider, half inside a sticky band: `01` §L.6 and `02` §4 give the list's bottom band 16 px and the top band 24–28 px, for a 30 px button and a 62 px two-line edge label. The root clips, so the focus ring and the top of the timeline's edge label were cut (the label started 3–7 px above the root). The default preset's bands are 32 px for the list and 44 px for the timeline and compact mode, top and bottom: half the tallest button, its 4 px focus ring and 4 px of air. A browser test checks every button in the list and the timeline, compact or not, landed and at both ends, in three engines; the same test fails for classic, which keeps the source's bands.

### D4 — The container height is documented, not detected

The root fills its parent (`01` §2), so a parent without a height lets the schedule grow with its content: it never scrolls, and the navigation buttons have nothing to move. That is what every example did, the README and the Installation page included. Both now render inside `<div style={{ height: 600 }}>` and say why, in all seven languages, and every demo on the site sets a height (D5).

A development warning was tried and left out. The package's development diagnostics run only where `process` exists at runtime (`src/core/env.ts`), which Vite and webpack 5 do not provide in the browser, so the warning would stay silent in most browser development builds — exactly where it is needed. Changing that guard changes every diagnostic and how production builds drop them; it is not part of this release.

### D5 — Every demo has a height, the site's controls and the site's scheme

- **Height:** every demo renders its schedule inside `<div style={{ height: 560 }}>`, in the source a reader sees under "Show code"; the Playground and the theme editor give their stage `min(70vh, 720px)`. The shell's `<Demo height>` is a minimum height and the shell is fixed (EXCEPTIONS #10), so the demos carry it.
- **Controls:** the radio groups, checkboxes and bare buttons above the schedules are `Choice` (toggle buttons with `aria-pressed`, the chosen one filled), `Check` and `Controls` from `src/demos/_shared/controls.tsx`, built on the shell's `.ds-button` and `.ds-check`. No new CSS. `theming.tsx` drops from 90 to 70 lines, inside `04` §1's 80.
- **Scheme:** `04` §1 says demos follow the site theme; none did. `useDemo` reads `data-theme` from `<html>` through `useSyncExternalStore` (light while prerendered, as the page is), and every demo passes `colorScheme={demo.scheme}`. The two demos with a scheme control follow the site until the reader picks one.

`e2e/demos.spec.ts` opens every page and checks that each schedule is at most a screen tall and scrolls when its content is taller, that no bare control sits in a demo, and that nothing throws; in three engines it walks the list's buttons down and back, the timeline's buttons there and back, opens a detail and the overflow table, and takes a narrow list back to the top.

A bounded Playground lands and pins right after hydration, and each change it reports re-renders the page's 95 controls. Audited in the middle of that burst, WebKit under the full suite's load reported `<body>` without its styles (a transparent background, the initial text color), although the page painted correctly, and axe took the dark page for white: the Playground failed `a11y.spec.ts` in three of four full runs. The axe helper now waits until the DOM has been quiet for 500 ms before auditing — an audit of a settled page is the one that means something — and five full runs since were clean.

### D6 — Default preset: the scroll-to-top button and the retry button

A site review found two parts that did not look like what they are. `01` §L.10 fixes the compact list's scroll-to-top button to the viewport, as the source had it for a schedule that filled the screen; placed in a page, the button floated over that page's corner — over the documentation site, on every page whose demo had scrolled. The default preset positions it inside the root, above the bottom band. The error state's retry was the source's flat text button, bold text under the message; the default preset draws it outlined, like the navigation buttons. Classic keeps both as they were, so the SHOT and VIS parity tests are unchanged; browser tests cover the default preset in three engines.

### D7 — The default empty-state text

`06` §6 gives the whole-day empty state as "No agenda data available." ("Nu există date în agendă.", "Keine Agendadaten verfügbar." …). "Agenda" is a word the product uses nowhere else, and "data available" describes the data rather than the day. At the site review the user chose to change the default in all seven packs to what a reader of the schedule needs to know: "Nothing is scheduled for this day." ("Für diesen Tag ist nichts geplant.", "Rien n'est prévu pour cette journée." …). The per-shift text ("No items in this shift.") already says that and stays. Consumers still replace either through `localization`. The parity and scenario tests that asserted the source's sentence now assert the new one and say why.
