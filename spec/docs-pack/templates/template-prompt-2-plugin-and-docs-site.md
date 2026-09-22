# Template Prompt 2 — Plugin Package + Documentation Website

> Run this in the **new, empty repository** with Claude Code, Cursor (Agent mode) or Codex, after placing the docs pack and the Feature Dossier (see the guide, "Docs pack placement").
> Fill the **Value** column of the INPUTS table only. Pre-filled values are defaults; change them if needed. Do not edit the rest of the prompt. Paste everything below the line.

---

## ROLE

You are a principal front-end architect building **`{{NPM_PACKAGE}}`** ({{PLUGIN_DISPLAY_NAME}}): an MIT-licensed, native, dependency-free React library, plus its documentation website. You build it to publication quality and stop at every checkpoint for review.

## INPUTS (project dictionary)

Every key in double braces in this prompt, in `{{DOCS_PACK_PATH}}` and in `{{DOCS_PACK_PATH}}/agent-files/` (for example `{{PLUGIN_ID}}`) stands for its **Value** in this table. Resolve keys from the table; never guess a value. If a required value is empty and the Dossier's README does not provide it, stop and ask before M0. Values marked "derived" may be left empty; derive them as described.

| Input | Key | Value |
|---|---|---|
| Published package name (scoped or not) | `{{NPM_PACKAGE}}` | |
| Display name | `{{PLUGIN_DISPLAY_NAME}}` | |
| Plugin id — derived: unscoped package name | `{{PLUGIN_ID}}` | |
| npm scope used if the plain name is taken | `{{NPM_SCOPE}}` | |
| Main component | `{{COMPONENT}}` | |
| CSS prefix (2–4 letters; same as in the Dossier) | `{{CSS_PREFIX}}` | |
| Engine peer with range, or `none` (same as in the Dossier) | `{{ENGINE_PEER}}` | none |
| One-line description | `{{ONE_LINE_DESCRIPTION}}` | |
| npm keywords | `{{KEYWORDS}}` | |
| Package folder — derived: `{{PLUGIN_ID}}` | `{{PACKAGE_DIR}}` | |
| Repository name — derived: `{{PLUGIN_ID}}` | `{{REPO_NAME}}` | |
| Repository URL | `{{REPO_URL}}` | |
| Site domain | `{{SITE_DOMAIN}}` | |
| Copyright holder (MIT licence) | `{{COPYRIGHT_HOLDER}}` | |
| Copyright year | `{{YEAR}}` | 2026 |
| Denylist salt (same as in Template Prompt 1) | `{{DENYLIST_SALT}}` | |
| Feature Dossier path | `{{FEATURE_DOSSIER_PATH}}` | spec/feature-dossier |
| Docs pack path | `{{DOCS_PACK_PATH}}` | spec/docs-pack |
| Package manager | `{{PACKAGE_MANAGER}}` | pnpm 10 |
| Node version | `{{NODE_VERSION}}` | 24 LTS |
| English spelling for content | `{{SPELLING}}` | American English |

At M0, copy this table with its resolved values into the **Project dictionary** section of `AGENTS.md`. From then on, `AGENTS.md` is where every later session resolves keys. Never edit files in `spec/` to substitute values.

## READ FIRST

1. `{{DOCS_PACK_PATH}}/00-READ-FIRST.md`, then 01–11 in order, then `templates/placeholder-glossary.md`.
2. `{{FEATURE_DOSSIER_PATH}}/README.md` and every file it lists.
3. Copy `{{DOCS_PACK_PATH}}/agent-files/*` to the repository root (including `.cursor/`), resolve their keys from the INPUTS table, and fill the Project dictionary in `AGENTS.md`.

The docs pack is the source of truth for **how** (site structure, look, behaviour, package standards, deployment). The Dossier is the source of truth for **what** (behaviour, API names, parity, bugs). Precedence is defined in `00` §3. `08-observed-issues-and-fixes.md` overrides everything except my own instructions.

## HARD REQUIREMENTS

- **Runtime dependencies**: `react` and `react-dom` as peers (`^18.2.0 || ^19.0.0`), plus `{{ENGINE_PEER}}` as a peer unless it is `none` (ADR 0002). `"dependencies": {}`. Everything else is written natively in TypeScript. Dev tooling only from the licence allowlist in `09` §3.2, listed in `docs/adr/0001-toolchain.md`.
- **Stack**: exactly `00` §5. TypeScript 7 for type-checking and build; the API extractor uses TypeScript 6 through the `typescript-api` alias (`05` §2). tsdown for the package. React + Vite + React Router (framework mode, `ssr: false`, full prerender) for the site. No other site framework, ever (O12).
- **Shell**: copy `{{DOCS_PACK_PATH}}/11-docs-shell-reference/` verbatim. Do not redesign, restyle or reorder anything in it.
- **Sections**: the nine sections of `01` §3 in order, with the fixed children.
- **i18n**: full content translation into `en`, `ro`, `hu`, `es`, `fr`, `de`, `pt`. No user-visible literal in code. `i18n:check` must pass.
- **Parity before extension**: implement the Dossier's parity layer and make every characterization scenario pass **before** adding extensions. Extensions never break parity tests. Listed bugs are fixed, each with a named regression test.
- **Zero reference**: the scan in `09` §8 passes over the whole repository at every checkpoint.
- **Forbidden**: pricing, tiers, landing page, testimonials, "Edit this page", "Was this page helpful?", live-editable doc demos, state libraries, UI kits, CSS-in-JS runtimes, third-party search/highlighting/i18n.

## MILESTONES

Build in this order. At each ⏸ checkpoint: run the gate commands, show the checklist with ✅/❌, list deviations (with `EXCEPTIONS.md`/ADR references) and wait for my reply.

### M0 — Scaffold ⏸
pnpm workspace (`packages/{{PACKAGE_DIR}}`, `apps/docs`), root scripts from `AGENTS.md`, `tsconfig.base.json`, ESLint/Stylelint/Prettier, Vitest, Playwright, Changesets, `LICENSE` (MIT, {{COPYRIGHT_HOLDER}}, {{YEAR}}), `README.md`, `AGENTS.md` with the Project dictionary, `EXCEPTIONS.md`, `GAPS.md`, `docs/adr/0001-toolchain.md`, CI and release workflows from `10` §5, `check:zero-reference` and `check:licenses` scripts. Package name availability checked (`npm view`), result reported.
Gate: install, lint, typecheck, test (empty), zero-reference and licences pass in CI; no unresolved key remains outside `spec/`.

### M1 — Headless core + parity ⏸
`src/core/` from the Dossier: internal store (`09` §3.4), engine, feature modules. Convert `characterization/scenarios.json` into parity tests (`test/parity/`) through a thin adapter over the new API. Fix listed bugs with regression tests.
Gate: all parity scenarios green; core coverage ≥ 90/85; no DOM or window access at import time.

### M2 — React adapter, styles, accessibility ⏸
Components, hooks, providers, slots, `slotProps`/`classNames`/`styles`, handler middleware, ref API, `tokens.css`/`base.css`/`theme.css` in `@layer {{CSS_PREFIX}}`, the `classic` parity preset plus default light/dark, unstyled mode, `en` localization. React 18 and 19 test matrix, SSR `renderToString` tests, axe tests.
Gate: parity scenarios green through the React components; visual parity against `characterization/screenshots/` within the Dossier's tolerance; a11y clean.

### M3 — Extensions and locale packs ⏸
Every Dossier item marked `v1.0`, in the Dossier's order. Locale packs `ro`, `hu`, `es`, `fr`, `de`, `pt` as subpath exports. Bundle budgets, `publint`, `attw`, `knip`.
Gate: all tests green; budgets met; `npm pack --dry-run` shows only intended files.

### M4 — Docs shell ⏸
`apps/docs`: routes generated from `nav.json`, prerender for all routes × locales, the shell from `11` verbatim, theme bootstrap, language menu, version menu (`versions.json`), in-house search index and dialog, in-house highlighter, footer, 404. Every page exists as a stub with its template's required section headings and translated `meta` in all locales. Vercel Analytics and Speed Insights (`/react` entries). `vercel.json` from `10` §2.
Gate: every route × locale returns 200 with one `h1`; conformance C1–C4, C8–C11, C15 pass; visual baselines of the shell at 390/1024/1440 in light and dark. **Pause here for my visual approval of the shell**; after approval, produce `SHELL_CHECKSUM` (`11/README.md`).

### M5 — Reference and content ⏸
`extract-api` and the API pages; `api.json` strings in 7 locales. Getting-started pages, AI context page (T3), All features, every capability page (T6) with demos (static source, `04` §1), Customization, Integrations, Guides, Migration, Discover more — English first, then all six translations in the same change.
Gate: conformance C1–C7, C11–C14 pass; `i18n:check` and pseudo-locale test pass; links check passes.

### M6 — Playground, theme editor, machine surface ⏸
Playground per `04` §4 (controls above, component below, full width; every public prop covered; URL state; event log), theme editor if the plugin has CSS variables, `llms.txt`, `llms-full.md/.txt`, `.md` twins, sitemap, Changelog page from Changesets.
Gate: C7 and C11 pass; manual walkthrough of the Playground recorded in the checkpoint report.

### M7 — Audit and hardening ⏸
The pre-publish audit (`09` §10) written to `docs/audit/0.1.0.md`: dependencies, rendering in three browsers × two themes × three widths, performance and memory, gaps, bugs, API review. Lighthouse and axe targets from `07` §1. Zero-reference and licence scans.
Gate: every gate in `09` §9 and `07` §5 green; audit has no open blocker.

### M8 — Release readiness ⏸
Do **not** publish or deploy. Produce two checklists with commands, based on `10` §3–§4:
- **npm publish readiness** (name/scope, 2FA, first manual publish steps, Trusted Publishing setup, dist-tags, post-publish checks);
- **Vercel deploy readiness** (project settings, root/output directories, Node version, analytics toggles, domain, versioned-docs plan).
Wait for my go-ahead.

## REPORTING FORMAT (every checkpoint)

```
## M{n} — {name}: {READY FOR REVIEW | BLOCKED}
Gate results: lint ✅ · typecheck ✅ · test ✅ (n/n) · i18n ✅ · conformance ✅ (C1…) · zero-ref ✅ · licences ✅ · size ✅
Done: …
Rules satisfied: O…, P…, C…
Deviations: … (EXCEPTIONS.md #, ADR #)
Open questions: …
Next: M{n+1} — {name}
```

## WHEN IN DOUBT

Ask. Never invent behaviour, metrics, compatibility claims or content. Unknowns go to `GAPS.md`. Never modify `spec/`.
