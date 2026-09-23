# 0001 — Toolchain

Status: accepted (by kiralygyula92, 2026-09-22, M0 checkpoint), including the development license exceptions in D5.
Scope: every development tool in the workspace, the license policy that governs them, and the places where the toolchain deviates from docs pack `00` §5 and `09` §6.

## Context

Docs pack `00` §5 fixes the stack: pnpm 10, Node 24, TypeScript 7 for type-checking and emit, tsdown, Vitest, Testing Library, Playwright, axe and Changesets. `09` §3.5 lists the allowed dev tools. Anything else needs an ADR. The versions below are the registry's current releases on 2026-09-22.

## Tools

| Tool                                   | Version                                      | License (SPDX)  | Purpose                                                                          |
| -------------------------------------- | -------------------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| pnpm                                   | 10.34.5 (`packageManager`)                   | MIT             | Workspaces, lockfile, license listing                                            |
| Node.js                                | 24 (`.nvmrc`; local and CI); `>=22.18` works | MIT             | Runtime; runs `scripts/*.ts` via built-in type stripping                         |
| typescript                             | 7.0.2                                        | Apache-2.0      | `tsc` type-checking (root and package)                                           |
| typescript (API)                       | 6.0.3, for typescript-eslint only (see D1)   | Apache-2.0      | TypeScript compiler API for type-aware linting                                   |
| tsdown                                 | 0.23.0                                       | MIT             | Package build: ESM + CJS + `.d.ts` via `isolatedDeclarations`                    |
| vitest, @vitest/coverage-v8            | 5.0.1                                        | MIT             | Unit and component tests, coverage                                               |
| @playwright/test                       | 1.63.0                                       | Apache-2.0      | Browser tests (M2) and site E2E (M4)                                             |
| eslint, @eslint/js                     | 10.11.0, 10.0.1                              | MIT             | Linting                                                                          |
| typescript-eslint                      | 8.70.1                                       | MIT             | TypeScript rules (type-aware)                                                    |
| eslint-plugin-react                    | 7.37.5                                       | MIT             | `react/jsx-no-literals` and React rules                                          |
| eslint-plugin-react-hooks              | 7.1.1                                        | MIT             | Hooks rules                                                                      |
| globals                                | 17.12.0                                      | MIT             | ESLint environment globals                                                       |
| stylelint, stylelint-config-standard   | 17.15.0, 40.0.0                              | MIT             | CSS lint and the C9 token rule                                                   |
| prettier                               | 3.9.8                                        | MIT             | Formatting                                                                       |
| @changesets/cli                        | 3.0.3                                        | MIT             | Versioning and changelog                                                         |
| publint                                | 0.3.24                                       | MIT             | Package metadata lint                                                            |
| @arethetypeswrong/cli                  | 0.18.5                                       | MIT             | Type-resolution check of the packed package                                      |
| @types/node                            | 24.13.6                                      | MIT             | Node types for `scripts/` and package tests                                      |
| fast-check                             | 4.10.2                                       | MIT             | Property-based differential tests of the layout engine (M1)                      |
| react, react-dom (dev)                 | 19.3.0                                       | MIT             | Development and test copies of the peers; CI also runs with 18.3                 |
| @testing-library/react, /dom           | 16.3.3, 10.4.2                               | MIT             | Component tests (M2)                                                             |
| jsdom                                  | 30.1.1                                       | MIT             | DOM environment of the component tests (M2)                                      |
| @types/react, @types/react-dom         | 19.3.0                                       | MIT             | Types of the peers (M2)                                                          |
| playwright, @vitest/browser-playwright | 1.63.0, 5.0.1                                | Apache-2.0, MIT | Vitest browser mode in Chromium, Firefox and WebKit (M2)                         |
| axe-core                               | 4.13.0                                       | MPL-2.0         | Accessibility tests in jsdom and in the browser (M2); development exception (D5) |
| dom-accessibility-api                  | 0.7.1                                        | MIT             | Screen-reader names and descriptions snapshot (M3)                               |
| size-limit, @size-limit/esbuild, /file | 14.0.0                                       | MIT             | Bundle budgets, Dossier 09 §2 (M3)                                               |
| knip                                   | 6.37.0                                       | ISC             | Unused files, exports and dependencies, P4 (M3)                                  |
| subset-font                            | 2.9.0                                        | BSD-3-Clause    | Builds the site's Latin + Latin Extended web font, 07 §1 (M4); see D7            |
| vite                                   | 8.3.0                                        | MIT             | Docs site bundler and dev server (M4)                                            |
| react-router, @react-router/dev        | 8.4.0                                        | MIT             | Docs site router in framework mode, `ssr: false` with full prerendering (M4)     |
| @vercel/analytics                      | 2.0.1                                        | MIT             | Page views on the deployed site, `/react` entry (M4)                             |
| @vercel/speed-insights                 | 2.0.0                                        | Apache-2.0      | Core Web Vitals of the deployed site, `/react` entry (M4)                        |

M2 uses axe-core directly in both test layers, so neither `@axe-core/playwright` nor `vitest-axe` is installed. The browser tests use Vitest's own `userEvent`, so `@testing-library/user-event` was removed at M3. `react-router` and the two Vercel packages are dependencies of the private `docs` workspace only; the published package's dependency rule is unchanged (`dependencies: {}`).

## Decisions

### D1 — TypeScript 7 for `tsc`, TypeScript 6 for the linter's compiler API

typescript-eslint 8.70 declares `typescript >=4.8.4 <6.1.0`, and TypeScript 7.0 has no stable JavaScript API. pnpm resolves peers from the workspace root (TypeScript 7), and it ignores both `overrides` and `packageExtensions` for peers. That was tried first.

`.pnpmfile.cjs` therefore rewrites the manifests of `typescript-eslint`, `@typescript-eslint/*` and `ts-api-utils`: the `typescript` peer is replaced by a direct dependency on `npm:typescript@6.0.3`. `pnpm why typescript` shows 6.0.3 under typescript-eslint only; `tsc` everywhere else is 7.0.2.

Exit: remove the hook when typescript-eslint supports TypeScript 7. The API extractor (docs pack `05` §2, M5) adds the `typescript-api` alias as specified.

### D2 — ESLint 10, with eslint-plugin-react outside its declared peer range

ESLint 9.39.5 is marked deprecated on npm ("no longer supported"). eslint-plugin-react 7.37.5 declares `eslint ^9.7` but works on ESLint 10: every call to a context API that ESLint 10 removed goes through a `sourceCode` fallback. The one exception is `jsx-filename-extension`, which is not enabled.

This was verified on ESLint 10.11 with `react/jsx-no-literals`, the recommended React rules and the hooks rules. `pnpm-workspace.yaml` declares the peer range as allowed (`peerDependencyRules.allowedVersions`).

Exit: drop the rule when the plugin declares ESLint 10.

### D3 — Gate scripts run as TypeScript on Node without a loader

`scripts/*.ts` use only erasable syntax (`erasableSyntaxOnly`) and run with `node scripts/x.ts`. Node ≥ 22.18 strips types by default, so no tsx or ts-node dependency is needed.

### D4 — tsdown option names verified against 0.23 (docs pack `09` §6 `TODO(user)`)

| `09` §6 template                   | tsdown 0.23                                    | Change                                                                   |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `external: [...]`                  | deprecated in favor of `deps.neverBundle`      | Uses `deps.neverBundle`                                                  |
| (none)                             | `target` inferred from `engines.node` (node20) | Explicit `target: 'es2022'` (browser floor Safari 16.4, Dossier `09` §5) |
| `copy`, `src/locales/*.ts` entries | unchanged                                      | Added when those sources exist (M2, M3)                                  |

- `attw --pack .` runs with `--profile node16`. The `node10` resolution mode cannot see subpath exports, and it is removed in TypeScript 7 (deprecated in 6).
- `THIRD_PARTY_NOTICES.md` is left out of `files` because no third-party code is copied (`09` §2).

### D5 — License policy: strict production, named development exceptions

The two specs disagree. Dossier `09` §8 applies MIT/ISC/BSD-2/BSD-3/0BSD/Apache-2.0 to every installed package. Docs pack `09` §3.2 also allows CC0-1.0 and Unlicense, and forbids MPL only at runtime. axe-core, which both require, is MPL-2.0. The user chose a split policy at M0. `scripts/check-licenses.ts` with `scripts/licenses.config.json` enforces it:

- **Production trees** (`pnpm licenses list --prod --recursive`) must be fully covered by MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0, CC0-1.0 or Unlicense. SPDX expressions are evaluated (`OR` = any, `AND` = all). Publishable packages must also have no `dependencies`, only `react`/`react-dom` as peers, `license: "MIT"` and a `LICENSE` file.
- **Development trees** may also contain the packages below. Each one is named with its exact license; anything else fails.

| Package                                   | License       | Pulled in by                                           | Nature                                                                                                      |
| ----------------------------------------- | ------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `@csstools/*` (3 packages)                | MIT-0         | stylelint                                              | MIT without the attribution clause                                                                          |
| `argparse`                                | Python-2.0    | stylelint → cosmiconfig → js-yaml                      | Permissive (PSF)                                                                                            |
| `caniuse-lite`                            | CC-BY-4.0     | eslint-plugin-react-hooks → @babel/core → browserslist | Browser-support data, attribution license                                                                   |
| `lightningcss`, `lightningcss-<platform>` | MPL-2.0       | vitest → vite                                          | File-level copyleft; used unmodified, never shipped                                                         |
| `lru-cache`, `minimatch` (current majors) | BlueOak-1.0.0 | tsdown, @arethetypeswrong/core; eslint                 | Permissive                                                                                                  |
| `axe-core`                                | MPL-2.0       | the package's test suites                              | File-level copyleft; used unmodified in tests, never shipped. Approved with the M3 plan (2026-09-22)        |
| `pako`                                    | MIT AND Zlib  | subset-font → fontverter                               | Two permissive licenses; the checker compares whole expressions, so the pair is listed here. Proposed at M4 |

None of these reaches the published tarball: the package has no dependencies, and CI scans the packed tarball before publishing. The user approved this exception list at the M0 checkpoint (2026-09-22), and `axe-core`, proposed at M2, with the M3 plan (2026-09-22). A new exception needs the same approval.

### D6 — Zero-reference scan implementation

`scripts/check-zero-reference.ts` implements both descriptions of the scan: docs pack `09` §8 and Dossier `09` §7.

- **Denylist candidates:** raw tokens, identifier sub-tokens, and word 1/2/3-grams, plus 2- and 3-token sequences of raw tokens. File names are scanned too, and so are the printable strings of binary files.
- **Generic patterns:** e-mails, URLs, IPv4, `localhost` ports, JWT-like and key-like strings, and absolute user paths.
- **URL hosts:** the allowlist in `scripts/zero-reference.config.json` covers the project's domains, `*.vercel.app` (the docs pack's examples), and well-known registry, specification and documentation hosts. Extending it needs a reason here. `sil.org` was added at M4: the OFL text committed with the site's font (`apps/docs/public/fonts/Inter-OFL.txt`) links to `scripts.sil.org/OFL`, and the license may not be altered. `localhost` and `allowedLocalPorts: [4173]` were added with it, for the address the E2E suite serves the built site on (`apps/docs/scripts/serve.ts`); any other port is still a finding, and a host written as a template (`localhost:${port}`) is not read as an address. `sitemaps.org` was added for the sitemap protocol namespace the generated `sitemap.xml` declares.
- **E-mail allowlist:** `@example.com`/`.org`/`.net`, GitHub's no-reply domain, and the commit co-author trailer address.
- **Modes:** repository (default), `--stdin` (commit messages in CI), and `--dir` (the unpacked tarball in the release workflow, including `dist/`).

### D7 — The site's web font is subset in the repository, not downloaded ready-made

Docs pack `07` §1 asks for "Inter variable, Latin + Latin Extended subsets"; the verbatim shell (`11-docs-shell-reference/tokens.css`) declares **one** face at `/fonts/InterVariable.woff2` with no `unicode-range`, so a single file has to cover all seven locales. No upstream distribution offers that file: Inter's own release is the full 352 kB font, and Google Fonts splits Latin and Latin Extended into two files that only a `unicode-range` pair can combine.

`scripts/build-site-font.ts` therefore builds it from the OFL release already pinned by SHA-256 in `scripts/lib/fonts.ts` (google/fonts commit `e44c4b0`, the same source as the visual references), using `subset-font` (harfbuzz compiled to WebAssembly, so it runs the same on every platform). It keeps the Latin and Latin Extended code points of the published Inter v20 subsets and pins the `opsz` axis to its default, which is what Google Fonts serves for a `wght@100..900` request: **132.8 kB**, against 352 kB for the full face.

The result and the licence (`apps/docs/public/fonts/`) are committed, with their provenance in `apps/docs/SOURCES.md`, so neither the site build nor CI needs network access; `subset-font` is only needed to regenerate them. Inter carries no Reserved Font Name, so the subset keeps the family name (OFL 1.1 §3).

## Consequences

- The toolchain matches `00` §5, except for the ESLint major and the TypeScript 6 API copy for linting (both reversible).
- Development and CI run on Node 24; the gate scripts also run on Node 22.18+.
- Adding a dev tool means adding a row here and re-running `pnpm check:licenses`. A new non-allowlisted license fails until it is added to D5 with approval.
