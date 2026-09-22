# 0003 — React adapter, styles and visual parity

Status: proposed (M2 checkpoint, 2026-09-22). D3 was decided by kiralygyula92 during M2 planning (DQ-3).
Scope: `packages/react-scheduler/src/react/`, `src/dom/`, `src/styles/` and the browser test layer. Covers every place where M2 needed an interpretation of the Feature Dossier, extended it, or reproduced the source from evidence the Dossier does not state.

## Context

M2 turns the headless core (ADR 0002) into the React library: components, hooks, slots, styles, and the DOM engines deferred from M1. It is gated on the parity scenarios through the components, visual parity with `characterization/screenshots/` within Dossier `09` §4, and accessibility (`09` §1). Where the Dossier's prose, its measurements and its reference images disagree or are silent, the decision is recorded here; open items are in `GAPS.md`.

## Decisions

### D1 — Handler composition: consumer first, `preventDefault()` cancels the default

Dossier `06` §1.1 item 4 composes element handlers "library first, then consumer", and in the same sentence lets a consumer cancel the library default with `event.preventDefault()`. Both cannot hold: a library handler that has already run cannot be canceled. The consumer's handler runs first; the library default runs unless the consumer called `preventDefault()`. This is the only order in which the Dossier's cancel rule works (tested in `slots.test.tsx`).

### D2 — Middleware: asynchronous `next()` and `next(override)`

As F-22 requires, `next()` may be called asynchronously: the default runs at most once, and only while the component is mounted. The context passed to middleware is a frozen copy (F-22: read-only). `next(override)` merges a partial context over it before the default runs, which is the "can alter or veto" of F-09 and docs pack `09` §4.3. A middleware that calls `next()` without arguments has the Dossier's exact signature.

### D3 — DQ-3: a card whose column is at or beyond its count is clamped into the last column

Compact promotion can produce `column ≥ columns` (ADR 0002 D4). The engine output stays golden-exact, and the renderer clamps such a card into column `columns − 1`. With `columns = 1`, the only case in the goldens, that is full width, identical to the source's pixels. Decided by the user at M2 planning.

### D4 — Parts, slots and slot props

- **Parts:** the 55 parts of `06` §1, each with `data-rs-part`, a `rs-<part>` class and data-attribute modifiers.
- **Slots:** `slots[part]` receives the element's props plus `ownerState` and `Default`, the default element or component to wrap (docs pack `09` §4.3).
- **Merge order (06 §1.1):** library defaults, then `slotProps` (an object or a function of `ownerState`), then `classNames` / `styles`. Class names are appended and styles merged. Refs are composed through a stable callback, so a consumer ref never churns the library's.
- **Types:** `slotProps[part].ref` accepts any `Ref<HTMLElement>`; the prop getters of `useScheduler` return callback refs, so they spread onto any element.
- **Render props** take precedence over slots for the same content (F-23).

### D5 — Lazy chunks (F-30)

`OverflowDialog`, `OverflowTable` and `Pagination` (one chunk) and `DefaultItemDetail` (another) are `React.lazy` components. The main entry never pulls the dialogs in. They are also exported, so a consumer can compose them, for example inside `renderItemDetail` (tested).

### D6 — Entries: `/dom`, and `createScheduler` in `/core` (resolves G7)

- `@react-schedulerkit/react-scheduler/dom` is an entry of its own (`exports` and the tsdown entries). It holds the DOM engines: the pin engine, the navigator, compact observation and the reduced-motion query. None of them touches a global at import.
- `/core` additionally exports `createScheduler` and the controller types: the framework-agnostic controller of docs pack `09` §4.3 (level 6). This extends ADR 0002 D10, where `/core` exported exactly the `04` §8 functions.

### D7 — Tooltip

The library has its own small tooltip (no dependency):

- The tooltip element always exists and is visually hidden while closed, so the anchor's `aria-describedby` works with tooltips disabled too.
- It opens on hover and on keyboard focus (`:focus-visible`), and closes on leave, blur and Escape.
- It is placed 14 px above its anchor (`02` §4.9), centered from its own measured size and rounded to whole pixels, in a commit-phase ref callback, so the first painted frame is already in place.

### D8 — Pin engine mechanics

- Two `IntersectionObserver`s per view, one at the pin edge and one at the release edge. Their root margins sit 1 px below the rule's boundaries, so an entry is delivered exactly when a sentinel crosses one.
- The observed root extends 100 000 px below the viewport. Without that, a programmatic jump from above the edge to below the fold crosses no threshold and produces no entry; this was found in the browser and has a regression test.
- Sentinels with an empty rect (a hidden or unlaid-out view) are ignored, and so is a content width of 0 for compact detection, so a hidden container keeps its state.
- `refresh({ force })` re-reads every sentinel after a programmatic scroll (B-12).

### D9 — Visual parity: method and conditions

- **VIS (computed styles):** every part in `measured-styles.{light,dark}.json` is compared with the computed style of the classic preset. The equivalences are listed at the top of `test/browser/vis/compare.ts`: properties that do not paint, or that paint the same through another mechanism, and sizes within 0.5 px. For a part whose width follows its text, only the anchored one of `left` and `right` must match, because the other follows a text width the rasterizer decides. There are no known exceptions.
- **SHOT (screenshots):** the 20 references are compared with the `09` §4 tolerance (color threshold 0.1, at most 0.1 % differing pixels, the `07` §5 masks) by a native PNG decoder and a YIQ comparator in a Vitest browser command.
- **Reference platform:** the references match Windows Chromium's rasterization: 11 of 20 are pixel-identical and the worst differs by 0.073 %. Linux Chromium differs by 0.03–4.9 % (text rasterization). The gate is therefore enforced on Windows (and anywhere with `RS_SHOT=1`); elsewhere the captures and diff images are written to `test-results/shot/` for review. The references are never changed.
- **Capture conditions:** device pixel ratio 1, UTC, en-US; Inter and Inter Tight from the OFL sources at a pinned commit with SHA-256 hashes, fetched into `.cache/` (never committed). "Animations disabled" is Playwright's `animations: 'disabled'`: finite animations are fast-forwarded to their end and infinite ones reset. The overflow dialog is opened with a real pointer click, so its initial focus shows no ring.
- **Scene conditions inferred from the images** (recorded in `GAPS.md`): the collapsed list at `scrollTop` 900; the compact scroll-to-top scene 60 px above the landing; the bottom-disabled timeline 128 px above the end; the source's dropped "Age" column with a minimum width of 140 px.

### D10 — Rendering details reproduced from the measurements

- **Actions column fixed at 92 px.** `02` §4.8 lists 92 as a minimum, but only a fixed column gives the measured 214.5 / 328.72 px cells. A column whose `minWidth` equals its `maxWidth` is rendered with that `width`, and the default actions column sets both. Header cells clip their overflow, so a label wider than a fixed column cannot widen or scroll the table.
- **Sort label centered on the x-height** (`vertical-align: middle`). With Blink's rounded font metrics this gives the measured 47.67 px header row.
- **Own layers:** pinned chips and the tooltip have `will-change: transform`. Chips are rasterized at the entrance animation's peak scale and resampled, as the source's were; without the layer, the chips' right and bottom edges differ from the references.
- **Extra tokens** beyond `06` §3.1: `--rs-dialog-border-width` and `--rs-surface-overlay-image` (the classic dark dialog's border and table overlay), and `--rs-color-count` (D11).

### D11 — Accessibility in the browser

axe runs with every rule except `region` (a component is not a page) in Chromium, Firefox and WebKit: list, compact list, timeline, both dialogs, and the empty, loading and error states, for both presets and both schemes.

- **Default preset:** no violations. Two light text colors that `06` §3 kept from classic fail 4.5:1, so the default light preset uses existing default colors for them: the carried-over count (through `--rs-color-count`) and the overflow table header text (G9).
- **Classic:** only the B-19 items, plus the same two colors, kept for pixel parity (G10).

### D12 — Performance

The PERF scenario runs from `vitest.perf.config.ts` (`pnpm test:perf`) on React's production build (checked at run time) in Chromium without throttling, and writes its numbers to `test-results/perf.json`. It runs locally and is reported at checkpoints; it is not a CI gate, because shared runners are not the reference machine of `09` §3. Timeline cards compare their placement field by field: any item change recomputes the layout, and a single item change must re-render only that item's card (a jsdom test). A clock tick renders only what follows the clock: the time grid's hour labels, lines and bands and its lane are memoized layers, and each list section keeps its card elements while its items and the marker position are unchanged (jsdom tests assert both).

### D13 — React versions

The views are `forwardRef` components with an imperative handle, which works on React 18.3 and 19. The CI matrix runs the unit and component tests on both; the browser suite runs on 19.

## Consequences

- All 67 scenarios are covered through the public components: unit and DOM layers in jsdom, browser layers in real engines.
- The classic preset matches the references on Windows Chromium and the measurements everywhere. The default preset is the accessible one.
- Open for the user: G9 and G10 (contrast), the Hungarian actions header that a fixed 92 px column clips by about 3 px, and the axe-core license exception (ADR 0001 D5).
