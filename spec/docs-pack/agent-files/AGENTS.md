# AGENTS.md — {{PLUGIN_DISPLAY_NAME}}

Single source of instructions for every coding agent in this repository (Codex, Cursor, Claude Code and others). `CLAUDE.md` and `.cursor/rules/project.mdc` only point here.

## Project dictionary

Keys in double braces in `spec/` (for example `{{PLUGIN_ID}}` in the docs pack) resolve to the values below. Filled once at M0 from the INPUTS table of Template Prompt 2. Never substitute values inside `spec/`; read keys there as variables resolved from this table.

| Key | Value |
|---|---|
| `{{NPM_PACKAGE}}` | |
| `{{PLUGIN_DISPLAY_NAME}}` | |
| `{{PLUGIN_ID}}` | |
| `{{NPM_SCOPE}}` | |
| `{{COMPONENT}}` | |
| `{{CSS_PREFIX}}` | |
| `{{ENGINE_PEER}}` | |
| `{{ONE_LINE_DESCRIPTION}}` | |
| `{{KEYWORDS}}` | |
| `{{PACKAGE_DIR}}` | |
| `{{REPO_NAME}}` | |
| `{{REPO_URL}}` | |
| `{{SITE_DOMAIN}}` | |
| `{{COPYRIGHT_HOLDER}}` | |
| `{{YEAR}}` | |
| `{{DENYLIST_SALT}}` | |
| `{{FEATURE_DOSSIER_PATH}}` | |
| `{{DOCS_PACK_PATH}}` | |
| `{{PACKAGE_MANAGER}}` | |
| `{{NODE_VERSION}}` | |
| `{{SPELLING}}` | |

## Project

- Package: `{{NPM_PACKAGE}}` in `packages/{{PACKAGE_DIR}}/` — an MIT-licensed, native, dependency-free React component library for {{ONE_LINE_DESCRIPTION}}.
- Docs site: `apps/docs/` — React + Vite + React Router (prerendered), 7 locales, deployed to Vercel at https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/.
- Specification (read-only): `spec/docs-pack/` (how to build) and `spec/feature-dossier/` (what to build).

## Before writing code

1. Read `spec/docs-pack/00-READ-FIRST.md`, then files 01–11 in order.
2. Read `spec/feature-dossier/README.md` and every file it lists.
3. Re-read `spec/docs-pack/08-observed-issues-and-fixes.md` before each milestone review.

## Hard rules

- Precedence: user instruction > docs-pack 08 > docs-pack 11 (verbatim shell) > other docs-pack files > Feature Dossier (behaviour and API names) > your judgement (record it in `docs/adr/` or `EXCEPTIONS.md`).
- Copy the docs shell from `spec/docs-pack/11-docs-shell-reference/`. Never redesign it.
- Runtime dependencies of the package: only `react`/`react-dom` peers, plus the engine peer from the dictionary unless it is `none`. Anything else needs an ADR and the user's approval.
- No Redux, Zustand or other state libraries; no UI kits; no CSS-in-JS runtimes; no third-party search, highlighting or i18n libraries.
- No user-visible string in code: package strings go through `localization`; site strings through `src/locales/{lng}/*.json`, all 7 locales complete.
- No reference to the source project anywhere. Run `pnpm check:zero-reference` before finishing any task.
- No pricing, tiers, landing page, "Edit this page" or "Was this page helpful?".
- Do not modify files in `spec/`.

## Commands

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev (site + package watch) | `pnpm dev` |
| Build everything | `pnpm build` |
| Lint / typecheck / test | `pnpm lint` · `pnpm typecheck` · `pnpm test` |
| API data / i18n check / conformance | `pnpm --filter docs api` · `pnpm --filter docs i18n:check` · `pnpm --filter docs conformance` |
| E2E | `pnpm e2e` |
| Zero-reference / licences | `pnpm check:zero-reference` · `pnpm check:licenses` |
| Add a changeset | `pnpm changeset` |

## Working style

- Work milestone by milestone as defined in `spec/feature-dossier/roadmap.md`. Stop at each checkpoint, report the checklist, and wait for the user.
- Write tests with the code. A task is done only when lint, typecheck, tests, `i18n:check` and `conformance` pass.
- Commit per milestone step with a message that names the milestone and the rule IDs (`O*`, `P*`, `C*`) it satisfies.
- When unsure, ask. Unknowns go to `GAPS.md`; never invent facts, metrics or claims.
- Spelling for English content: {{SPELLING}}.
