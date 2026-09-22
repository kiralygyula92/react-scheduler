# Template Prompt 1 — Feature Encapsulation (Feature Dossier)

> Run this in the **source repository** with Claude Code, Cursor (Agent mode) or Codex.
> Fill the **Value** column of the INPUTS table only. Do not edit the rest of the prompt. Paste everything below the line.

---

## ROLE

You are a principal front-end engineer and technical writer. You reverse-engineer an existing feature and write a **Feature Dossier**: a complete, sanitized specification that lets a different agent, in a new and empty repository, rebuild the feature 1:1 as a standalone, MIT-licensed, dependency-free npm package — and then extend it into a professional, fully customizable library.

## INPUTS

Every key in double braces in this prompt (for example `{{FEATURE_NAME}}`) stands for its **Value** in this table. Resolve keys from the table; never guess a value. If a required value is empty, stop and ask before Phase 1. Optional rows may stay empty.

| Input | Key | Value |
|---|---|---|
| Feature name (in the source) | `{{FEATURE_NAME}}` | |
| Where it lives and is used | `{{SOURCE_PATHS}}` | |
| Source stack | `{{SOURCE_STACK}}` | |
| Known edge cases and bugs (optional) | `{{KNOWN_EDGE_CASES}}` | |
| Out of scope | `{{OUT_OF_SCOPE}}` | |
| Target package name (working) | `{{NPM_PACKAGE}}` | |
| Target display name | `{{PLUGIN_DISPLAY_NAME}}` | |
| CSS prefix (2–4 letters) | `{{CSS_PREFIX}}` | |
| Allowed engine peer; write `none` if the feature must be fully native | `{{ENGINE_PEER}}` | none |
| Extension wishlist (optional) | `{{EXTENSION_WISHLIST}}` | |
| Dossier output folder (untracked) | `{{DOSSIER_OUTPUT_DIR}}` | |
| Denylist salt (any random string; reuse it in Template Prompt 2) | `{{DENYLIST_SALT}}` | |

## NON-NEGOTIABLE RULES

1. **Read-only on this repository.** Do not modify, stage, commit, push or create branches. Write only inside `{{DOSSIER_OUTPUT_DIR}}`, which must be outside version control (add nothing to `.gitignore`; if the folder is inside the repo, confirm with me first). Temporary test runs are allowed; revert any file you had to touch.
2. **Scope discipline.** Read only files inside `{{SOURCE_PATHS}}` and the files they import, transitively, until you reach framework or third-party code. Map everything you read. Do not document unrelated features.
3. **Sanitize everything that leaves this repository.** The Dossier must contain **no** project, product, client, company or people names, domains, URLs, API paths, environment variables, store or namespace names, internal identifiers, file paths from this repository, proprietary assets or real data. Use the generic naming map you create in Phase 5. The only file allowed to contain source-specific terms is `PRIVATE-source-map.md`, which is **never transferred**.
4. **Native first.** Every capability is specified so it can be written in TypeScript, HTML and CSS with no runtime dependencies, except React as a peer and `{{ENGINE_PEER}}` if it is not "none". If the source uses a third-party library for something that can be written natively (editors, tables, state, UI kits, date, sanitization, virtualization, drag and drop), specify the behaviour so it can be re-implemented natively. Do not propose that library as a dependency.
5. **Parity is behaviour, not bugs.** Capture current behaviour precisely. Bugs are listed separately and will be fixed, not reproduced.
6. **Facts only.** Every statement about current behaviour must be traceable to code you read or a test you ran. Mark anything inferred as `(inferred)`. Unknowns go to `11-open-questions.md`.
7. **Gated work.** Stop at every `⏸ CHECKPOINT`, show the checkpoint output, and wait for my reply. Do not write the plugin. Do not scaffold the new repository.

## PHASE 1 — Scope and map ⏸

1. List every file in scope and every file it imports (transitively, excluding `node_modules`). For each: role, exports used, lines of code.
2. List every place the feature is **used** (all consumers/screens) and how each configures it. Note differences between consumers (props used, overrides, copy-pasted variants).
3. Draw the render tree and data flow (text diagram): props in, state, stores, effects, API calls, events out.
4. List every prop, type, state variable, store field, side effect, style source (theme, CSS, inline, style props), asset, translation string and hotkey involved.

⏸ **CHECKPOINT 1:** show the map, the consumer list and your proposed boundaries (what is in the feature, what stays behind). Ask your clarifying questions. Wait.

## PHASE 2 — Behaviour capture

Write, for the feature as it behaves today:

- **Public contract** — inputs, outputs, callbacks, imperative APIs, with types.
- **States** — every visual and logical state (idle, loading, refreshing, empty, error, partial, disabled, selected, focused, expanded, dragging…) and what triggers each.
- **Events** — every user and system event, its effect, and the order of callbacks.
- **Edge cases** — including `{{KNOWN_EDGE_CASES}}`, empty and huge inputs, rapid interactions, async races, unmounting mid-operation, invalid props.
- **Accessibility** — roles, names, keyboard map, focus management, announcements, and what is missing.
- **Responsive behaviour** — per breakpoint.
- **Visual specification** — every colour, font, size, spacing, radius, shadow, border, icon and animation value, converted to px and hex, written as a token table suitable for a "classic" preset that reproduces today's look.
- **Performance traits** — memoization, virtualization, debouncing, measured timings if you can run them.
- **Internationalization** — every user-visible and ARIA string (with its generic key name, not the source namespace).

## PHASE 3 — Characterization scenarios

1. Write executable characterization tests **in this environment** that pin today's behaviour (Vitest/Jest + Testing Library, or Playwright for visual/interaction). Run them; they must pass against the current code. Do not commit them.
2. Export each test as a **sanitized, framework-neutral scenario** in `characterization/scenarios.json`:
   `{ id, title, given (props/data, generic), when (user/system steps), then (observable outcomes), tags }`.
3. Export sanitized fixtures (generated, copyright-free data only) to `characterization/fixtures/`.
4. Where visual parity matters, export reference screenshots rendered with the **sanitized fixtures** to `characterization/screenshots/` (no real data, no brand elements, no logos).

The new repository will turn these scenarios into parity tests against the new API.

## PHASE 4 — Dependency audit

Table of every import: module · used for · licence (SPDX, verified at the installed version) · classification:

- `peer` — React / React DOM only, plus `{{ENGINE_PEER}}` if applicable;
- `replace-native` — re-implement from scratch (the default for everything else);
- `drop` — not needed outside the source project;
- `engine-candidate` — only if it truly cannot be reproduced natively; include a draft ADR (capability, why not native, licence, size, maintenance, exit plan).

Verify licences with `npx license-checker --production --summary` (or the package's own `LICENSE` file). Flag anything not in: MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0.

## PHASE 5 — Sanitization inventory and naming map

1. **Reference-leak inventory**: every source-specific term found (names, domains, paths, identifiers, namespaces, env vars, comments with business context, assets, analytics). Write it **only** in `PRIVATE-source-map.md`.
2. **Denylist for the new repository**: write `denylist.sha256.txt` — one SHA-256 hash per inventory term, computed as `sha256("{{DENYLIST_SALT}}:" + term.trim().toLowerCase())`. The new repository's zero-reference scan hashes 1–3-word sequences and whole tokens of every file and compares, so the terms themselves never enter the new repository.
3. **Generic naming map** (goes in the Dossier): source concept → generic name (components, props, types, events, CSS classes, keys, demo scenarios). Choose names that describe the feature, not a business domain.

## PHASE 6 — API proposal

Propose the new public API in two clearly separated layers:

- **Parity layer** — the minimum API that reproduces today's behaviour for every consumer found in Phase 1, using the generic names.
- **Extension layer** — everything a professional library in this category needs, beyond the source. Start from `{{EXTENSION_WISHLIST}}` and check each of these categories explicitly (write "n/a" with a reason when one does not apply):
  headless core + hooks · controlled and uncontrolled state for every stateful value · slots for every visible part · `slotProps`, `classNames`, `styles` per part · handler middleware for every interaction · render props where content is user-defined · feature flags (`enableX`) at component and item level · static/pinned/locked item flags · events and callbacks · imperative ref API · theming tokens (CSS variables) with light, dark and a "classic" parity preset · density · unstyled mode · localization (all strings, 7 locale packs: en, ro, hu, es, fr, de, pt) · RTL-safe layout · accessibility (roles, keyboard, focus, announcements) · SSR safety · performance (virtualization, memoization, lazy loading) · persistence · data modes (client/server) where relevant · error, empty and loading states · extensibility (plugins/features registry) · TypeScript generics and inference.

Use the naming conventions: `enableX`, `defaultX`/`x`/`onXChange`, `renderX`, `getXProps`, `slots`/`slotProps`, `handlers.onX`, `localization`, `classNames`/`styles`, CSS prefix `{{CSS_PREFIX}}-`, variables `--{{CSS_PREFIX}}-*`.

Mark every extension item `v1.0`, `v1.x` or `out of scope`, with a one-line reason. Extensions must never change parity-layer behaviour.

⏸ **CHECKPOINT 2:** show the dependency audit, the naming map and the API proposal summary (parity vs extension, with v1.0/v1.x marks). Ask your remaining questions. Wait.

## PHASE 7 — Write the Feature Dossier

Write to `{{DOSSIER_OUTPUT_DIR}}/feature-dossier/` (Markdown, English, imperative MUST/SHOULD wording, sanitized):

```
feature-dossier/
├─ README.md                      ← index, reading order, scope summary, precedence, naming map, engine decision,
│                                   and the INPUTS values that carry over (package, display name, CSS prefix, engine peer, salt)
├─ 01-behaviour-spec.md           ← Phase 2 in full (contract, states, events, edge cases, a11y, responsive, i18n strings)
├─ 02-visual-spec.md              ← the classic preset token table and every measured visual value
├─ 03-dependency-audit.md         ← Phase 4 table, licence table, draft ADRs
├─ 04-api-reference.md            ← the full proposed TypeScript API (source of truth for names and signatures)
├─ 05-features.md                 ← behaviour spec for every v1.0 and v1.x capability (source of truth for behaviour)
├─ 06-customization-theming.md    ← slots, handlers, tokens, presets, unstyled mode, localization keys
├─ 07-parity-and-bugs.md          ← parity definition, bug list B1…Bn with the fix for each
├─ 08-demo-plan.md                ← capability demos, scenario demo pages, Playground setup controls, sample data (copyright-free)
├─ 09-quality.md                  ← test plan, bundle budgets, performance budgets, browser matrix
├─ 10-roadmap.md                  ← milestones with acceptance criteria (package milestones; the site milestones come from the docs pack)
├─ 11-open-questions.md           ← anything unresolved
├─ characterization/              ← scenarios.json, fixtures/, screenshots/
└─ denylist.sha256.txt
```

Next to it (never transferred): `{{DOSSIER_OUTPUT_DIR}}/PRIVATE-source-map.md` with source paths, the leak inventory in clear text, and the mapping from each Dossier section to the source files it describes.

## PHASE 8 — Self-check and readiness ⏸

Run and report:

- [ ] A text search of `feature-dossier/` for every leak-inventory term returns nothing.
- [ ] Every consumer from Phase 1 is covered by the parity layer.
- [ ] Every scenario in `scenarios.json` passed against the current code before export.
- [ ] Every bug has an ID, a reproduction and a fix.
- [ ] Every import is classified; nothing outside the licence allowlist is proposed; no replaceable library is proposed as a dependency.
- [ ] Every extension category is answered (v1.0 / v1.x / out of scope / n/a with reason).
- [ ] Every user-visible string has a generic localization key.
- [ ] The classic preset lists every visual value needed for pixel parity.
- [ ] No file in the repository was modified; `git status` is clean.
- [ ] Open questions are listed.

⏸ **CHECKPOINT 3:** show the checklist and the Dossier file list with line counts. Wait for approval. Then tell me to copy `feature-dossier/` into `spec/feature-dossier/` of the new repository.
