# AGENTS.md

Instructions for AI coding agents working in this repository. Claude Code reads them through
`CLAUDE.md` and Cursor through `.cursor/rules/project.mdc`. Humans: see
[CONTRIBUTING.md](CONTRIBUTING.md).

## What this repo is

A pnpm monorepo:

- `packages/react-scheduler`: the published library `@react-schedulerkit/react-scheduler`, shift
  schedules for React: a working day as a list or a timeline, for offices, factories and anywhere
  people work in shifts.
- `apps/docs`: the documentation site (React + Vite + React Router, prerendered, seven locales).
- `docs`: architecture decision records (`docs/adr`), the 1.0.0 audit and the release guides.
- `spec`: the original specification. Read-only: never modify it.
- `GAPS.md` and `EXCEPTIONS.md`: open questions, and deliberate departures from the specification.

## Rules

1. **Backwards-compatible defaults.** New behavior is opt-in behind a prop; changing a default is a
   breaking change.
2. **Generic and app-agnostic.** No app-specific coupling in the package: integration points are
   props, callbacks or CSS variables.
3. **No runtime dependencies** beyond the `react` and `react-dom` peers. No state libraries (Redux,
   Zustand), UI kits, CSS-in-JS runtimes, or third-party search, highlighting or i18n libraries.
   Anything else needs an ADR in `docs/adr/` and the maintainer's approval.
4. **No user-visible string in code.** Package strings go through `localization`; site strings
   through `apps/docs/src/locales/{lng}/*.json`, complete in all seven locales.
5. **Strict TypeScript:** no `any` in public types; every public export has TSDoc.
6. **Every behavior has an automated test:** unit (Vitest), browser (`pnpm test:browser`) or e2e
   (Playwright against the site).
7. **Accessibility is required:** keyboard operable, labeled, with visible focus; axe must pass.
8. **The docs shell is fixed.** Header, sidebar and layout follow
   `spec/docs-pack/11-docs-shell-reference/`; never redesign them. No pricing, tiers, landing page,
   "Edit this page" or "Was this page helpful?".
9. **The zero-reference scan passes:** run `pnpm check:zero-reference` before finishing any task;
   CI runs it on the tree, the commit messages and the package tarball.
10. **No invented facts.** Never invent facts, metrics or claims; unknowns go to `GAPS.md`. When
    unsure, ask.
11. **American English** in all English content.
12. **Only original or permissively licensed material** (`pnpm check:licenses`). Third-party code
    or assets need a compatible license and an entry in `packages/react-scheduler/NOTICE`.

## Workflow

- A task is done when `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter docs i18n:check`
  and `pnpm --filter docs conformance` pass; CI also runs the rest of the commands below.
- Conventional Commits (`fix(docs): …`, `feat: …`), small and focused.
- User-facing changes need a changeset (`pnpm changeset`): `patch` for fixes, `minor` for
  features, `major` for breaking changes.
- Public API changes: TSDoc on the export, `pnpm --filter docs api`, and the docs pages in every
  locale (`pnpm --filter docs api:sources` updates the API translation hashes).
- Never publish to npm, push tags or bump versions yourself; releases go through the Release
  workflow (see [RELEASING.md](RELEASING.md)).

| Task                                | Command                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Install                             | `pnpm install`                                                                                |
| Dev (package built once, then site) | `pnpm dev`                                                                                    |
| Build everything                    | `pnpm build`                                                                                  |
| Lint / typecheck / test             | `pnpm lint` · `pnpm typecheck` · `pnpm test`                                                  |
| API data / i18n check / conformance | `pnpm --filter docs api` · `pnpm --filter docs i18n:check` · `pnpm --filter docs conformance` |
| Link check / API translation hashes | `pnpm --filter docs check:links` · `pnpm --filter docs api:sources`                           |
| E2E                                 | `pnpm e2e`                                                                                    |
| Browser tests / performance         | `pnpm test:browser` · `pnpm test:perf` · `pnpm test:budgets`                                  |
| Size / dead code / package files    | `pnpm --filter @react-schedulerkit/react-scheduler size` · `pnpm knip` · `pnpm check:pack`    |
| Zero-reference / licenses           | `pnpm check:zero-reference` · `pnpm check:licenses`                                           |
| Unresolved keys / scenario coverage | `pnpm check:keys` · `pnpm check:scenarios`                                                    |
| Tarball in fresh React 19/18.2 apps | `pnpm release:sandbox`                                                                        |
| Add a changeset                     | `pnpm changeset`                                                                              |
