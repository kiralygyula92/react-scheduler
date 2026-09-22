# 09 — Quality: tests, budgets, browsers, scans

## 1. Test plan

| Layer | Tool (dev dependencies, licence-checked) | Scope | Gate |
|---|---|---|---|
| Unit | Vitest (Node) | `core`: shift model (incl. DST in 3 zones), bucketing, placement order, layout engine, overflow grouping, formatters, `pageList`, `interpolate`, plurals | 100 % lines and branches in `core` |
| Golden | Vitest | `computeTimelineLayout` against every `characterization/golden/layout-*.json`; formats against `format-samples.json` | exact equality |
| Component | Vitest + jsdom + Testing Library | structure, strings, controlled/uncontrolled contracts, middleware ordering, render props, slots, flags, empty/loading/error states, the `LV-*` / `TL-*` scenarios | ≥ 90 % lines in `react` |
| Browser | Playwright (Chromium, Firefox, WebKit) | `BR-*` scenarios; pinning, navigation, landing; header signal; compact; reduced motion; RTL; keyboard paths | all pass in all 3 engines |
| Visual | Playwright screenshots + pixel diff | classic parity against `characterization/screenshots/` (§4); default preset light/dark baselines; density; RTL | tolerance §4 |
| Accessibility | axe-core in the browser suite | every demo page and every fixture page, both views, both schemes | 0 violations (default preset); classic may only have the documented B-19 contrast items |
| Types | type tests (expect-type style) | inference of `TItem`, level keys, render props, slots, handlers | compile-time |
| SSR | `react-dom/server` with React 18.2, 18.3 and 19 | `renderToString` without DOM; hydrate in the browser with no warnings | no warnings |
| Performance | Playwright + DevTools protocol; Vitest bench | §3 | budgets |
| Memory | Playwright | 20 mount/unmount cycles of each view: heap within +5 %, no detached nodes retained | pass |
| Packaging | publint / type-export checks (dev) | exports map, types, ESM, `sideEffects` | pass |

### 1.1 Scenario coverage rule

Every scenario ID in `characterization/scenarios.json` **MUST** map to at least one test, whose title
starts with `[ID]`. A CI step parses `scenarios.json` and the test reports, and fails when:

- an ID has no passing test; or
- a `bug`-tagged scenario is asserted against the old behaviour. These tests carry a `fixed: B-nn` note in their title.

### 1.2 Test environment

- Time zone `UTC` and locale `en-US` by default.
- DST tests run under two DST zones (one northern-hemisphere spring-forward, one southern). Time is always injected with `now` and `date`; there is no wall-clock dependence.
- jsdom lacks layout, so geometry assertions belong to the browser layer, as in the characterization suite.

## 2. Bundle budgets (minified + gzip, measured on each pull request)

| Artifact | Budget |
|---|---|
| `react-scheduler/core` | ≤ 6 kB |
| `react-scheduler/dom` | ≤ 4 kB |
| `react-scheduler` main entry, eager part (`Scheduler`, both views, default parts, excluding lazy chunks) | ≤ 24 kB |
| lazy chunk: overflow dialog + table + pagination | ≤ 5 kB |
| lazy chunk: default detail dialog | ≤ 3 kB |
| `styles.css` (both presets, both schemes, densities) | ≤ 8 kB |
| each locale pack | ≤ 1.5 kB |
| runtime dependencies | 0 |

## 3. Performance budgets

Reference: a production build in Chromium on a mid-range laptop, measured twice — without throttling,
and with 4× CPU throttling (the budgets in parentheses). The source measurements are in `01` §11 for
comparison.

| Measure | Budget |
|---|---|
| `computeTimelineLayout`, 240 items | ≤ 8 ms (≤ 30 ms) — source ~290 ms in Node |
| `computeTimelineLayout`, 1 000 items | ≤ 40 ms (≤ 150 ms) |
| Mount to first frame, list, 240 items | ≤ 80 ms (≤ 300 ms) |
| Mount to first frame, timeline, 240 items | ≤ 80 ms (≤ 300 ms) |
| Scripted scroll of 120 frames, either view, 240 items | p95 frame ≤ 20 ms; **no long task > 50 ms** (source list: p95 62 ms, 13 long tasks) |
| Pin refresh per frame | ≤ 2 ms |
| Re-render after a single item change | only that item's card and dependent layout re-render (render-count test) |
| Idle CPU (clock tick) | ≤ 1 ms per tick; no timers while the document is hidden |

## 4. Visual comparison

- **Conditions:** device pixel ratio 1; fonts installed from the OFL sources; animations disabled; time zone UTC; locale en-US; the fixtures and viewports from `02` §5.
- **Pixel tolerance:** colour threshold 0.1; at most **0.1 %** of pixels may differ per screenshot, after the masks of `07` §5.
- **Reviewer approval:** a failing comparison is uploaded as a diff image and needs approval to update a baseline. The classic references are immutable.

## 5. Browser and runtime matrix

| Target | Versions |
|---|---|
| Chromium-based (Chrome, Edge) | latest 2 |
| Firefox | latest 2 + ESR |
| Safari / WebKit (macOS, iOS) | 16.4+ |
| Android Chrome | latest |
| React / React DOM | 18.2, 18.3, 19.x |

Required platform features:

| Feature | Fallback |
|---|---|
| `<dialog>` with `showModal()` | — |
| `ResizeObserver`, `IntersectionObserver` | — |
| `Intl.DateTimeFormat`, `Intl.PluralRules` | — |
| CSS logical properties, `:where()` | — |
| `scrollend` | 500 ms settle timer (see below) |
| `overflow-anchor` | explicit compensation (F-07) |

The settle timer: when `scrollend` is missing (WebKit), a timer of 500 ms after the last scroll event replaces it.

## 6. Accessibility checklist (manual, per release)

- NVDA + Firefox and VoiceOver + Safari:
  - navigate by headings (shift sections);
  - lists announce their counts;
  - a card announces title, level and time;
  - navigation buttons announce their visible label and hint;
  - pinned-strip announcements are throttled;
  - dialogs trap focus and return it.
- Keyboard only: complete every demo task without a pointer.
- 200 % zoom and 320 px width: no loss of content or function (the compact layout).
- Forced colours (Windows High Contrast): focus, borders and the now line remain visible (`forced-colors` rules).

## 7. Zero-reference scan (denylist)

The new repository **MUST** contain no reference to the source project. CI enforces this with
`denylist.sha256.txt` (one lowercase hex SHA-256 per line).

- **Hash:** `sha256("<salt>:" + term.trim().toLowerCase())` with salt **`k3v9-q1x7`**.
- **Scanner:** for every text file in the repository (excluding `node_modules`, build output and binary files), lowercase the content and collect candidates:
  1. **raw tokens**: split on whitespace and the characters `"'`()[]{}<>,;|=`, then trim leading and trailing characters outside `[a-z0-9_$@-]`;
  2. **identifier sub-tokens**: split on `[^a-z0-9_$-]+`;
  3. **word n-grams**: split on `[^a-z0-9]+` into words; add every sequence of 1, 2 and 3 consecutive words, joined with one space.
- **Check:** hash each candidate. Any hash in the denylist fails the build. The report prints the file and the hash prefix, never the term.
- **Scope:** also scan commit messages of the pull request and the package tarball contents before publishing.
- **Verification:** this dossier passed the same scan (0 hits) before transfer.

## 8. Licence checks

- CI runs a licence report over all installed packages (production **and** development) and fails on anything outside: MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0. Dual licences are allowed when one option is in the list.
- The published package has `license: "MIT"` and a `LICENSE` file. `dependencies` MUST be empty (enforced).
