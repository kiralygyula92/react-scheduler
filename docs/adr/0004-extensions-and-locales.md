# 0004 — Entries, locale packs, budgets and the v1.0 audit

Status: proposed (M3 checkpoint, 2026-09-22). D1, D2 and D4 follow the user's decisions in M3 planning.
Scope: the package's entry points and locale packs, how the bundle, memory and packaging gates measure, and the decisions and fixes that came out of the v1.0 acceptance audit (Feature Dossier `05`, `09`, `10`).

## Context

Template Prompt 2's M3 asks for every Dossier item marked v1.0, locale packs as subpath exports, bundle budgets, `publint`, `attw` and `knip`. M1 and M2 built F-01…F-32 for parity. M3 therefore adds the packs and the gates, and audits every v1.0 acceptance check against the tests, adding the missing ones and fixing what they expose.

## Decisions

### D1 — `createScheduler` has its own entry

`@react-schedulerkit/react-scheduler/headless` exports `createScheduler` and the controller types (docs pack `09` §4.3, level 6). `/core` again holds exactly the `04` §8 functions, which keeps it within its 6 kB budget (Dossier `09` §2): 5.11 kB. The controller alone is 10.9 kB and has no Dossier budget. This supersedes ADR 0003 D6's placement.

### D2 — Locale packs: both entry shapes, pt-PT, generated from the Dossier

- **Shapes:** `…/locales/<language>` (docs pack `09` §4.6 and §5) exports the Dossier's name (`roRO`), and the aggregate `…/locales` (Dossier `04` §1) re-exports all seven. Tree-shaking keeps unused packs out. The main entry keeps `enUS`.
- **Content:** the six packs are generated from the JSON of Dossier `06` §6.3–6.8, and `enUS` is verified equal to §6.2. `pt` is European Portuguese (`ptPT`). French puts U+202F before ":" as §6.6 asks.
- **Plural forms:** every pack has a form for every category that counts 0–1000 use (tested). The CLDR "many" category of Spanish, French and Portuguese applies only to exact millions and similar numbers; the Dossier gives no such form, and `interpolate` falls back to "other", which reads correctly there.
- **Review status:** ro, hu, fr, de and pt, and es's newer strings, are drafts that need native review (Dossier `06` §6.1). The README says so.
- **Size:** each pack is 0.90–1.08 kB (budget 1.5 kB).

### D3 — Budget measurement

size-limit with its esbuild plugin measures the built package the way a consumer's production build sees it: minified, gzip (the Dossier's unit), with tree-shaken named imports, the React peers left out and `NODE_ENV` set to production.

- **Eager part:** `import { Scheduler, ListView, TimelineView }` with the two lazy chunks left out.
- **Lazy chunks:** each counts only the files it loads on demand.
- **Chunk names:** built without hashes (`hash: false`), so the checks can name them.

| Check                                        | Size         | Budget                     |
| -------------------------------------------- | ------------ | -------------------------- |
| `/core`                                      | 5.11 kB      | 6 kB                       |
| `/dom`                                       | 1.70 kB      | 4 kB                       |
| overflow dialog, table and pagination (lazy) | 2.56 kB      | 5 kB                       |
| detail dialog (lazy)                         | 0.86 kB      | 3 kB                       |
| `styles.css`                                 | 6.62 kB      | 8 kB                       |
| each locale pack                             | 0.90–1.08 kB | 1.5 kB                     |
| main entry, eager part                       | 24.91 kB     | 26 kB (the Dossier: 24 kB) |

The eager part measured 25.3 kB. An attribution by source module showed no dead weight and no lazy-only code in it: the controller 11.7 kB, the layout engine 6.1 kB, the view runtime 6.6 kB and `enUS` 2.1 kB, minified. The user chose a bounded size pass with a 26 kB fallback (GAPS G12).

The pass guarded every development-only message at its call site (`typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, docs pack `09` §4.5), so production builds drop the messages as well as the logging: 25.3 → 24.91 kB. The rest of the eager code is required behavior, and shrinking it further would have meant restructuring the controller and the runtime. The budget is therefore 26 kB (EXCEPTIONS #4).

### D4 — The default preset's actions column is 96 px (G11)

Classic keeps the measured 92 px (ADR 0003 D10). In the default preset, the library's own actions column is 96 px, so every locale's header fits ("Műveletek" needs 94.7 px). Consumer columns are used as given.

### D5 — Fixes from the v1.0 audit

- **List navigation no longer flashes (F-07, B-21):** sticky compensation is suspended while the list navigates. The navigator corrects its own target; compensating first moved the content to the top for two frames when the strip collapsed on arrival.
- **The pinned strip's track is not a tab stop (F-19):** Firefox made the scrollable list focusable, but its chips are the stops.
- **The internal clock stops with `enableNowIndicator={false}` (F-24):** it fed only the indicator, but kept ticking.
- **Right-to-left (F-29):**
  - the navigation buttons use `:dir(rtl)`, so an inherited direction centers them too;
  - the alert tint's angle is a token, `--rs-alert-surface-angle` (45° in left-to-right, −45° in right-to-left);
  - the strip's edge fades run from their own inline edge inward.
- **Public types:** `ElementProps` and `PartExtraProps` are exported from the main entry, since public types use them.

### D6 — How the audit measures

- **RTL:** every part's box in `dir="rtl"` must mirror its LTR box (x′ = W − x − w, ±1 px) in all three engines. For the Dossier's flip check, the RTL screenshot is mirrored and compared with the LTR one in Chromium, with text made transparent (text is not mirrored), at the `09` §4 tolerance.
- **Memory (`09` §1):** 20 mount/unmount cycles of each view with 240 items, in Chromium on production React. The heap is measured after forced garbage collections through the DevTools protocol (`Runtime.getHeapUsage`), and DOM nodes and listeners through `Memory.getDOMCounters`. Results: +3.4 % (list) and +1.5 % (timeline) against +5 %; nodes and listeners return exactly to their baseline.
- **Screen reader (F-18):** a snapshot of the role, name, description and live text of each element, in Chromium. Names depend on CSS (a `display: block` part adds a word boundary), which jsdom does not apply.
- **Keyboard and tab order (F-13, F-19):** checked in real browsers. The tab order is checked as focus walks the view, because the list hides a navigation button when its shift is the first or last (F-08).

### D7 — Packaging and dead code

- **Pack check:** `scripts/check-pack.ts` fails when `npm pack --dry-run` would publish anything besides `dist/`, `README.md`, `LICENSE` and `package.json`, or when a file an export names is missing.
- **knip:** reports no unused files, exports or dependencies. It removed `@testing-library/user-event` and made helpers used only inside their module private.
- **React 18.2:** the floor of the peer range joins the CI matrix.

## Consequences

- Every Dossier v1.0 acceptance check has a test, and all of them pass: component checks in jsdom, browser checks in Chromium, Firefox and WebKit, and the flip, memory and screen-reader checks in Chromium.
- Every budget is met; the main entry's eager part against 26 kB instead of the Dossier's 24 kB (D3).
