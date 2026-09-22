# Characterization evidence

Everything in this folder was produced by running tests against the **current** implementation before
export. The data is generated and copyright-free.

| Path | Content | How to use it |
|---|---|---|
| `scenarios.json` | 67 framework-neutral scenarios `{ id, title, given, when, then, tags, layer }`. `layer` is `unit`, `dom` or `browser` (where layout is needed). | Turn each into a parity test titled `[ID] …` (see `09` §1.1). `bug`-tagged scenarios expect the fixed behaviour (`07`). |
| `fixtures/*.json` | 8 fixtures in the generic item shape; `fixtures/README.md` documents the fields | Input for scenarios, demos and visual tests |
| `golden/layout-*.json` | Exact output of the layout engine (placed cards and overflow groups) for the fixtures, in regular and compact modes | Must equal the output of `computeTimelineLayout` (`large` with `overflowMergeWindow: Infinity`) |
| `golden/order-baseline.json` | Placement order of the baseline fixture | Must equal the output of `compareByPlacement` |
| `golden/format-samples.json` | Formatted samples (en/es) | Must equal the output of `createFormatters` for `en-US` |
| `measured-styles.{light,dark}.json` | Computed styles of every visible part, keyed by generic part name (colours as hex; `#RRGGBB/a` = alpha) | Source values for the `classic` preset (`02`) |
| `screenshots/*.png` | Reference renders (listed in `02` §5) | Classic visual parity (`07` §5, `09` §4) |

## Recording conditions

- **Unit/DOM:**
  - Vitest with jsdom.
  - Time zone UTC; the DST scenario ran in a spring-forward zone.
  - Layout values were injected where jsdom has none.
- **Browser:**
  - Playwright + Chromium on a production build of the source.
  - Viewport 1440 × 900 (compact: 390 × 844, medium: 768 × 1024), device pixel ratio 1, time zone UTC, locale en-US.
  - Both OFL fonts installed.
- **Sanitisation:**
  - Two domain labels were replaced before export: the reference label shows "Ref:" and a dropped overflow column shows "Age".
  - Source identifiers in selectors and keyframes were replaced by generic part names.
