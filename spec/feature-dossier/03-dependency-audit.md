# 03 — Dependency audit

**Engine peer: `none`.** The new package **MUST** have zero runtime dependencies. React and React DOM
are its only peers. Nothing in this audit qualifies as an engine candidate, so there are no ADRs.

Licences were verified at the installed versions from each package's `package.json` `license` field and
its bundled `LICENSE` file. A production-tree scan with `license-checker --production --summary` was also
run (§3).

---

## 1. Imports reached by the feature

| Module (installed version) | Used for | Licence | Classification | Native replacement |
|---|---|---|---|---|
| `react` 19.2.4 | components, hooks, `lazy`/`Suspense`, `memo`, `useSyncExternalStore` | MIT | **peer** | — (peer range `>=18.2 <20`) |
| `react-dom` 19.2.4 | rendering (app root) | MIT | **peer** | — |
| `@mui/material` 7.3.8 | layout boxes, typography, buttons, floating action button, chip, tooltip, dialog, table, pagination, spinner, colour `alpha()` | MIT | replace-native | Native elements plus a static CSS file with CSS variables. `<button>` for every activator. Native `<dialog>` with `showModal()` for dialogs (focus containment, Escape, backdrop). Native `<table>`. A small positioned tooltip (§06). A CSS spinner. `color-mix()` or precomputed values in place of `alpha()`. |
| `@mui/material/styles` 7.3.8 (via `@mui/system` 7.3.8, `@mui/utils` 7.3.8) | theme access (palette, typography, breakpoints, z-index), `sx` styling | MIT | replace-native | Design tokens as `--rs-*` CSS variables (`02-visual-spec.md`), class names `rs-*`, `classNames`/`styles` props. |
| `@mui/material/useMediaQuery` 7.3.8 | desktop breakpoint in the detail dialogs | MIT | drop (behind boundary) | — |
| `@emotion/react` 11.13.5, `@emotion/styled` 11.14.1 | CSS-in-JS engine of the UI kit | MIT | drop | Static CSS; no runtime styling engine. |
| `@mui/icons-material` 7.3.8 | chevron-up, close, eye (view details), arrows (pagination); detail-dialog icons | MIT | replace-native | Inline SVG icons drawn from scratch, overridable through slots. |
| `@mui/x-charts` 9.0.2 | sparklines inside the detail dialogs | MIT | drop (behind boundary) | — |
| `i18next` 25.8.13 | translation runtime (types only in the feature) | MIT | replace-native | `localization` object with `{{name}}` interpolation and plural functions; locale packs. |
| `react-i18next` 16.5.4 | `useTranslation` hook, active language | MIT | replace-native | Context-free: localization and `locale` props; `Intl` for dates. |
| `react-redux` 9.2.0 | store access in the detail dialogs and AI chat | MIT | drop (behind boundary) | — |
| `@reduxjs/toolkit` 2.11.2 | store, slices and API client reached through the dialogs | MIT | drop | Local state plus controlled/uncontrolled props. |

## 2. Imports used only by the consumer or the tooling (not part of the feature)

| Module | Used for | Licence | Classification |
|---|---|---|---|
| `react-router-dom` 7.13.1 | routing, test wrappers | MIT | drop |
| `@mui/x-date-pickers` 9.0.2 | the consumer header's date picker | MIT | drop (behind boundary) |
| `dayjs` 1.11.19 | date adapter for the date picker | MIT | drop |
| `msw` 2.12.10 | development API mocking | MIT | drop |

**Internal modules** (the feature's own components, hooks, utilities, constants and types) are all
**replace-native**: they are re-implemented from this specification. The generic names are in `README.md`
§ Naming map.

## 3. Production-tree licence scan

`license-checker --production --summary`:

| Licence | Packages | Allowlist status |
|---|---:|---|
| MIT | 159 | allowed |
| ISC | 21 | allowed |
| BSD-3-Clause | 4 | allowed |
| (MIT OR CC0-1.0) | 2 | allowed (MIT option) |
| MIT AND ISC | 1 | allowed (both) |
| Apache-2.0 | 1 | allowed |
| UNLICENSED | 1 | the private source application itself — not a dependency |

Nothing outside the allowlist (MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0) is proposed.
**No library is proposed as a dependency.**

## 4. Rules for the new repository

1. `dependencies` **MUST** stay empty. `peerDependencies`: `react`, `react-dom` (`>=18.2.0 <20`).
2. Development dependencies (test runner, bundler, linters, Playwright, axe) are allowed. Each **MUST**
   pass the same licence allowlist, checked in CI.
3. Fonts, icons and images **MUST NOT** be copied from any package. Icons are drawn from scratch. The
   classic preset only *names* font families.
4. A new runtime dependency or an engine peer needs an ADR with these sections:
   - capability;
   - why it cannot be native;
   - licence;
   - size (min + gzip);
   - maintenance health;
   - exit plan.
