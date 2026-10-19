# Releasing

A release is a version bump merged to `main` plus a `v*` tag on that commit. Pushing the tag runs
the `Release` workflow (`.github/workflows/release.yml`), which tests and builds the library, scans
the packed tarball with the zero-reference scan, runs `pnpm release:sandbox` (the tarball in fresh
React 19 and 18.2 applications) and stages it on npm through
[trusted publishing](https://docs.npmjs.com/trusted-publishers). No npm token exists anywhere, and
every version from `1.0.1` on carries
[provenance](https://docs.npmjs.com/generating-provenance-statements). A staged version goes live
only after a maintainer approves it on npmjs.com with a passkey. Hosting the documentation site is
in [docs/release/vercel.md](docs/release/vercel.md).

## First publish

npm only connects a trusted publisher to a package that already exists, so `1.0.0` was published
once by hand (`npm publish --provenance=false` from `packages/react-scheduler`, on 2026-10-19) and
tagged `v1.0.0`. [docs/release/npm.md](docs/release/npm.md) records how it was prepared. Every
later version is staged from a tag.

## How it is wired

- **npm:** `@kingtech/react-scheduler` trusts this repository's `release.yml`, run in the `npm`
  environment, for staged publishing only, and its publishing access requires two-factor
  authentication and disallows tokens. Check with `npm trust list @kingtech/react-scheduler`.
- **GitHub:** the `npm` environment accepts deployments from `v*` tags only, and a ruleset stops
  anyone but an admin from creating, moving or deleting those tags. Changes reach `main` only
  through pull requests that pass the CI `build` job. Only GitHub-made actions may run, and the
  default workflow token is read-only. The workflow also refuses a tag that isn't on `main` or
  doesn't match the version in `packages/react-scheduler/package.json`.
- **Private vulnerability reporting** is on; [SECURITY.md](SECURITY.md) sends reporters there.

## Every release

1. Pull requests add changesets (`pnpm changeset`). Check that CI is green on `main`.
2. Apply them on a release branch:

   ```sh
   git switch main && git pull --ff-only
   git switch -c release/vX.Y.Z
   pnpm changeset version
   ```

   `pnpm changeset version` bumps the version in `packages/react-scheduler/package.json` and writes
   `packages/react-scheduler/CHANGELOG.md`, which the site's Changelog page reads.

3. Review the changelog, commit as `release: vX.Y.Z`, open a pull request and merge it once CI
   passes. The merge also redeploys the documentation site.
4. Tag the merged commit on `main` and push the tag:

   ```sh
   git switch main && git pull --ff-only
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

5. When **Actions → Release** finishes, approve the staged version on npmjs.com (_Staged
   Packages_), then create the GitHub release from the changelog section:
   `gh release create vX.Y.Z --title vX.Y.Z --notes-file <section.md>`.

Tags can't be moved and npm never accepts a version number twice, so if a release run fails, fix
the cause and release the next patch version.

## Before a release, check

- CI is green on `main`.
- `pnpm check:pack` and `pnpm release:sandbox` pass.
- `pnpm --filter @kingtech/react-scheduler pack --dry-run` lists only `dist/`,
  `README.md`, `LICENSE` and `package.json`.
