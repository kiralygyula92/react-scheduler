# React Scheduler

React-scheduler used to showcase a schedule in different domains, such as office or factory work.

This repository holds the `@react-schedulerkit/react-scheduler` package — an MIT-licensed React component library with no runtime dependencies beyond its `react` and `react-dom` peers — and its documentation website.

> **Status:** pre-release. The workspace, toolchain and quality gates are in place (milestone M0); the package has no public API yet. Nothing is published to npm.

## Repository layout

| Path                        | Content                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `packages/react-scheduler/` | The npm package                                                                          |
| `apps/docs/`                | The documentation website (React + Vite + React Router, prerendered)                     |
| `spec/`                     | The specification: `docs-pack/` (how to build) and `feature-dossier/` (what to build)    |
| `scripts/`                  | Repository gates: zero-reference scan, licence check, unresolved keys, scenario coverage |
| `docs/adr/`                 | Architecture decision records                                                            |

`AGENTS.md` is the instruction file for coding agents and holds the project dictionary. Deviations from the specification are recorded in `EXCEPTIONS.md` and `docs/adr/`; unknowns in `GAPS.md`.

## Development

Requirements: Node.js 24 (see `.nvmrc`; 22.18 or later works) and pnpm 10 (pinned in `package.json`, available through Corepack).

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm check:zero-reference
pnpm check:licenses
pnpm --filter @react-schedulerkit/react-scheduler build
```

| Task                                | Command                                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| Build everything                    | `pnpm build`                                                 |
| Lint / typecheck / test             | `pnpm lint` · `pnpm typecheck` · `pnpm test`                 |
| Zero-reference scan / licences      | `pnpm check:zero-reference` · `pnpm check:licenses`          |
| Unresolved keys / scenario coverage | `pnpm check:keys` · `pnpm check:scenarios`                   |
| Package checks                      | `pnpm --filter @react-schedulerkit/react-scheduler lint:pkg` |
| Add a changeset                     | `pnpm changeset`                                             |

## License

[MIT](LICENSE) © 2026 kiralygyula92
