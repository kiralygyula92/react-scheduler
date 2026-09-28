# React Scheduler

Shift schedules for React: a working day as a list or a timeline, for offices, factories and anywhere people work in shifts.

This repository holds the `@react-schedulerkit/react-scheduler` package — an MIT-licensed React component library with no runtime dependencies beyond its `react` and `react-dom` peers — and its documentation website.

> **Status:** `1.0.0` is versioned and ready to publish, and not on npm yet. The steps that are left need an npm account and a Vercel project: [`docs/release/npm.md`](docs/release/npm.md) and [`docs/release/vercel.md`](docs/release/vercel.md).

## Repository layout

| Path                        | Content                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/react-scheduler/` | The npm package; its `README.md` is the npm page and `CHANGELOG.md` is written by Changesets        |
| `apps/docs/`                | The documentation website (React + Vite + React Router, prerendered, seven languages)               |
| `spec/`                     | The specification: `docs-pack/` (how to build) and `feature-dossier/` (what to build)               |
| `scripts/`                  | Repository gates (zero-reference scan, licenses, unresolved keys, scenario coverage, pack contents) |
| `scripts/release/`          | `sandbox.ts`: the packed tarball in fresh React 19 and React 18.2 applications                      |
| `scripts/audit/`            | The measurements behind the pre-publish audit                                                       |
| `docs/adr/`                 | Architecture decision records                                                                       |
| `docs/audit/`               | The pre-publish audit of `1.0.0`                                                                    |
| `docs/release/`             | The npm and Vercel checklists: what is done, what is left, and the commands                         |

`AGENTS.md` is the instruction file for coding agents and holds the project dictionary. Deviations from the specification are recorded in `EXCEPTIONS.md` and `docs/adr/`; unknowns in `GAPS.md`.

## Running it locally

Requirements: Node.js 24 (see `.nvmrc`; 22.18 or later works) and pnpm 10 (pinned in `package.json`, available through Corepack).

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` builds the package once, generates the site's API data and starts the site's development server; open the address it prints, followed by `/react-scheduler/`. The site uses the built package, so after changing the package, stop the server and run `pnpm dev` again.

To see the site as it is deployed — prerendered, compressed, with the host's cache headers:

```bash
pnpm build
pnpm --filter docs exec node scripts/serve.ts   # http://localhost:4173/react-scheduler/
```

## Commands

| Task                                | Command                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Build everything                    | `pnpm build`                                                                                  |
| Lint / typecheck / test             | `pnpm lint` · `pnpm typecheck` · `pnpm test` (`pnpm test:coverage` enforces the thresholds)   |
| Browser tests / performance         | `pnpm test:browser` · `pnpm test:perf`                                                        |
| E2E (site, three engines)           | `pnpm e2e`                                                                                    |
| API data / i18n / conformance       | `pnpm --filter docs api` · `pnpm --filter docs i18n:check` · `pnpm --filter docs conformance` |
| Links                               | `pnpm --filter docs check:links`                                                              |
| Package checks                      | `pnpm --filter @react-schedulerkit/react-scheduler lint:pkg` · `… size` · `pnpm check:pack`   |
| Dead code                           | `pnpm knip`                                                                                   |
| Zero-reference scan / licenses      | `pnpm check:zero-reference` · `pnpm check:licenses`                                           |
| Unresolved keys / scenario coverage | `pnpm check:keys` · `pnpm check:scenarios`                                                    |
| The tarball in fresh applications   | `pnpm release:sandbox`                                                                        |
| Add a changeset                     | `pnpm changeset`                                                                              |

The browser tests, the performance tests and the E2E suite need Playwright's browsers once: `pnpm exec playwright install`.

## License

[MIT](LICENSE) © 2026 kiralygyula92
