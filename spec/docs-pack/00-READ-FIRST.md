# 00 — READ FIRST

> **Docs pack version:** 1.0.0 · **Frozen:** 2026-09-21
> **Audience:** an AI coding agent (Claude Code, Cursor, Codex) or a developer, working in a **fresh repository** that will contain one plugin package and its documentation website.
> **Purpose:** make every plugin documentation site in the portfolio **structurally, visually and behaviourally identical**. Only the page content and the plugin-specific sidebar entries may differ between plugins.

---

## 1. The one rule that matters most

A user who opens two plugin sites side by side MUST feel that **only the content changed**. The navbar, sidebar, table of contents, breadcrumbs, search, theme and language behaviour, spacing, colours, typography, page templates, playground layout, footer and mobile behaviour MUST be the same.

To guarantee this, the site shell is **not described, it is given**. See `11-docs-shell-reference/`. Copy it. Do not redesign it, "improve" it or re-derive it from MUI. If something in the shell looks wrong, record it in `EXCEPTIONS.md` and ask the user. Do not fix it silently in one plugin, because every other plugin would then drift.

## 2. Reading order

| # | File | Read it for |
|---|---|---|
| 00 | `00-READ-FIRST.md` | Rules of precedence, stack, definitions, how keys resolve |
| 01 | `01-site-architecture.md` | URLs, locales, the fixed section model, routing, prerendering, machine-readable surface |
| 02 | `02-design-system.md` | Every token, dimension and component visual, light and dark |
| 03 | `03-page-templates.md` | The required blocks of every page type |
| 04 | `04-demos-and-code-blocks.md` | Demo blocks, code blocks, highlighting, the Playground |
| 05 | `05-api-reference-spec.md` | How API reference data is extracted from types and rendered |
| 06 | `06-content-style-guide.md` | Tone, headings, naming, and **how content is written as translation keys** |
| 07 | `07-quality-and-a11y.md` | WCAG 2.2 AA, performance, SEO, tests, CI gates |
| 08 | `08-observed-issues-and-fixes.md` | Every defect seen in earlier generated sites, written as a rule |
| 09 | `09-plugin-package-standards.md` | MIT, native-first dependency policy, package architecture, exports, versioning |
| 10 | `10-deployment.md` | Vercel, analytics, versioned docs, npm publishing |
| 11 | `11-docs-shell-reference/` | **Verbatim** tokens, CSS, component contracts, nav schema, chrome translations |
| — | `agent-files/` | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/project.mdc` to copy to the repo root |
| — | `templates/` | The two reusable template prompts and the placeholder glossary |

Read 00–11 completely before writing code. Re-read `08` before every milestone review.

## 3. Rules of precedence

When two sources disagree, the higher one wins:

1. The user's explicit instruction in the current session.
2. `08-observed-issues-and-fixes.md` (these rules exist because an earlier agent got it wrong).
3. `11-docs-shell-reference/` (verbatim values and contracts).
4. `02-design-system.md` → `01-site-architecture.md` → `03-page-templates.md` → `04` → `05`.
5. `09-plugin-package-standards.md` for anything inside `packages/`.
6. The Feature Dossier (`spec/feature-dossier/`) for plugin behaviour and API names.
7. Your own judgement. Record every judgement call in `docs/adr/` (package) or `EXCEPTIONS.md` (site).

The Feature Dossier is the source of truth for **what the plugin does**. This pack is the source of truth for **how the site looks and behaves and how the package is built**.

## 4. Conformance language

**MUST / MUST NOT** are absolute. **SHOULD / SHOULD NOT** may be broken only with a written reason in `EXCEPTIONS.md` or an ADR. **MAY** is optional. `TODO(user):` marks a decision the user has not made yet. Never resolve a `TODO(user):` yourself; ask.

## 5. Fixed technology stack

| Concern | Choice | Notes |
|---|---|---|
| Package manager | **pnpm 10** workspaces | `packageManager` field pinned in root `package.json` |
| Node | **24 LTS** for development and CI | Consumers are not restricted beyond `engines.node >= 20` |
| Language | **TypeScript 7** (`tsc`, native) for type-checking and emit | TS 7.0 has no stable programmatic API yet; the API extractor uses TS 6 through an npm alias (see `05` §2) |
| Plugin build | **tsdown** | ESM + CJS + `.d.ts`; `isolatedDeclarations: true` |
| Plugin peers | `react` and `react-dom` `^18.2.0 \|\| ^19.0.0` | Plus the single engine peer if the Dossier justifies one (e.g. `pdfjs-dist`, `three`) |
| Docs site | **React + Vite + React Router (framework mode, `ssr: false`, full `prerender`)** | Every route and locale is prerendered to static HTML |
| Site state | React state and context only | No Redux, no Zustand in the site or the plugin (see `09` §3.4) |
| i18n | In-house, JSON locale files, 7 locales | `en`, `ro`, `hu`, `es`, `fr`, `de`, `pt`; full content translation |
| Search | In-house, build-time index per locale | No Algolia, no third-party search |
| Syntax highlighting | In-house tokenizer | No Shiki, Prism or highlight.js |
| Tests | Vitest, Testing Library, Playwright, axe | Dev dependencies only |
| Versioning | Changesets | Generates `CHANGELOG.md` and the site's Changelog page |
| Hosting | Vercel (site), npm (package) | Vercel Web Analytics + Speed Insights |

Anything not in this table needs an ADR before it is installed.

## 6. Repository layout (target)

```
{{REPO_NAME}}/
├─ AGENTS.md                      ← copied from agent-files/
├─ CLAUDE.md                      ← copied from agent-files/
├─ .cursor/rules/project.mdc      ← copied from agent-files/
├─ spec/
│  ├─ docs-pack/                  ← THIS PACK (read-only for the agent)
│  └─ feature-dossier/            ← output of Template Prompt 1 (read-only)
├─ packages/{{PACKAGE_DIR}}/      ← the npm package
├─ apps/docs/                     ← the documentation website
├─ .changeset/
├─ .github/workflows/{ci,release}.yml
├─ docs/adr/                      ← architecture decision records
├─ EXCEPTIONS.md  GAPS.md
├─ LICENSE  README.md  package.json  pnpm-workspace.yaml  tsconfig.base.json
```

The pack lives in `spec/`, not `docs/`, so it is never confused with the documentation website in `apps/docs/`.

## 7. Definitions

| Term | Meaning |
|---|---|
| **Plugin** | The npm package being built (a React component library for one feature) |
| **Plugin id** | Kebab-case identifier, equal to the unscoped package name, e.g. `react-pdf-viewer`. Used as the site's base path |
| **Shell** | Everything on a docs page that is not page content: navbar, sidebar, ToC, breadcrumbs, footer, search, drawers, menus |
| **Section** | A top-level sidebar group (the nine fixed sections in `01` §3) |
| **Capability page** | One page documenting one plugin feature |
| **Golden site** | The reference build whose look the shell reproduces (React PDF Viewer, September 2026) |
| **Parity** | Behaviour identical to the source feature, except for bugs listed in the Dossier as fixed |
| **Zero-reference** | No name, domain, path, identifier, asset or text from the source project anywhere in the repository |
| **Locale bundle** | The set of JSON files for one language under `apps/docs/src/locales/{lng}/` |

## 8. Keys (placeholders)

Keys use `{{UPPER_SNAKE_CASE}}` and are **never** substituted inside `spec/`. Read each key as a variable: its value is in the **Project dictionary** section of `AGENTS.md` at the repository root, which the agent fills at M0 from the INPUTS table of Template Prompt 2. If a key has no value there, stop and ask. The full list and meanings are in `templates/placeholder-glossary.md`.

## 9. What the agent must never do

- Never copy MUI's name, logo, colours marked as MUI brand, icons, fonts or text. Only the information architecture and interaction patterns are reused.
- Never add pricing, plans, tiers, "Pro" badges, a marketing landing page, testimonials, newsletter capture or sponsor slots.
- Never add "Edit this page" or "Was this page helpful?" (explicitly not wanted in v1).
- Never hard-code a user-visible string in site code. Every string comes from a locale file (see `06` §5).
- Never install a runtime dependency in `packages/` that is not approved in the Dossier and an ADR.
- Never leave a reference to the source project. The zero-reference scan (`09` §8) MUST pass.
- Never commit to the source project's repository. This pack is consumed in the new repository only.
