# Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets) and the
`Release` workflow (`.github/workflows/release.yml`), which publishes with npm trusted publishing
and provenance. The first publish, step by step and with the state of every prerequisite, is in
[docs/release/npm.md](docs/release/npm.md); hosting the documentation site is in
[docs/release/vercel.md](docs/release/vercel.md).

## One-time setup

1. **npm account:** the package is published under the `@react-schedulerkit` scope, which needs an
   npm organization of that name. Check with `npm login` and `npm whoami`.
2. **Publishing:** on npmjs.com, make this repository's `release.yml` the package's trusted
   publisher (the first publish needs a token instead; see docs/release/npm.md). The workflow runs
   only when the repository variable `RELEASE_ENABLED` is `true`.
3. **GitHub:** in _Settings → Actions → General → Workflow permissions_, tick **Allow GitHub
   Actions to create and approve pull requests**. Without it the workflow cannot open the
   "Version Packages" pull request.
4. **Private vulnerability reporting:** turn it on (_Settings → Advanced Security_);
   [SECURITY.md](SECURITY.md) sends reporters there.

## Every release

1. Pull requests add changesets (`pnpm changeset`).
2. On `main`, the Release workflow opens or updates a **Version Packages** pull request that bumps
   the version and writes `CHANGELOG.md`.
3. Review the pull request and merge it. The workflow builds the package, runs the zero-reference
   scan on the tarball and `pnpm release:sandbox` (the tarball in fresh React 19 and 18.2
   applications), then publishes to npm and pushes the
   `@react-schedulerkit/react-scheduler@x.y.z` tag.

## Before a release, check

- CI is green on `main`.
- `pnpm check:pack` and `pnpm release:sandbox` pass.
- `pnpm --filter @react-schedulerkit/react-scheduler pack --dry-run` lists only `dist/`,
  `README.md`, `LICENSE` and `package.json`.
