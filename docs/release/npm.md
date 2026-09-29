# npm publish readiness

How `@react-schedulerkit/react-scheduler` gets from this repository to npm, in the order it has to
happen, following docs pack `10` §4. Every step says whether it is **already done in the
repository** or **yours to do**, and gives the exact command or the place in the npm or GitHub
interface.

**Nothing in this file has been run against npm.** No account, organization, token or package was
created, and nothing was published. The repository is ready; the registry is untouched.

---

## Where things stand

| Item                                               | Status                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Package name `@react-schedulerkit/react-scheduler` | **Free** on npm (`npm view` answered 404 on 2026-09-24). The unscoped `react-scheduler` is taken (0.1.0).                                      |
| Version                                            | **`1.0.0`** in the manifest; `packages/react-scheduler/CHANGELOG.md` written by `changeset version`; no pending changeset                      |
| Tarball                                            | 121 files: `dist`, `README.md`, `LICENSE`; zero-reference clean                                                                                |
| Consumer check                                     | `pnpm release:sandbox` passes on React 19 and React 18.2 (install, `tsc` 5.0.4 / 5.9.3 / 6.0.3 / 7.0.2, `vite build`, CommonJS, publint, attw) |
| Release workflow                                   | `.github/workflows/release.yml`: actions pinned to commit SHAs, OIDC permission, tarball scan, the sandbox; off until `RELEASE_ENABLED` is set |
| Provenance                                         | On (`publishConfig.provenance: true`) — which is why a laptop publish needs the flag in §4.2                                                   |
| npm account, organization, token                   | **None yet** — yours, §1                                                                                                                       |
| GitHub repository                                  | **Private** — npm refuses provenance from a private repository; yours to decide, §0.3 (GAPS G15)                                               |

---

## 0. Decide three things first

Both change what ships, so settle them before the first publish — a published version cannot be
edited, only superseded.

1. **The scope.** The package is named for the npm organization `react-schedulerkit` (GAPS G2). If
   you end up publishing under another scope, the name changes in `packages/react-scheduler/package.json`,
   in the changeset, in every import shown on the site and in `AGENTS.md`'s dictionary. Ask for that
   change as its own task; it is a search-and-replace plus a full gate run.
2. **The documentation domain** (GAPS G1). `homepage` in the manifest and the README's link point at
   `https://react-schedulerkit.vercel.app/react-scheduler/`. If the site lands elsewhere, update both
   before publishing, or the npm page links to nothing. See `vercel.md` §5.
3. **The repository's visibility** (GAPS G15). `kiralygyula92/react-scheduler` is private today. npm
   attaches provenance only to packages built from a public repository, so with
   `publishConfig.provenance: true` a publish from the private repository is refused. Making it
   public — _Settings_ → _General_ → _Danger Zone_ → _Change visibility_ — also makes the npm page's
   _Repository_ and _Issues_ links, the site's GitHub links and `SECURITY.md`'s reporting channel
   work. Then turn on _Settings_ → _Security_ → **Private vulnerability reporting**, which
   `SECURITY.md` sends reporters to. To publish from a private repository instead, remove
   `provenance` from `publishConfig` in `packages/react-scheduler/package.json` — ask for it as its
   own change, since the release documents and the audit say provenance is on.

## 1. One-time setup — yours

1. **Create the npm account** at <https://www.npmjs.com/signup>.
2. **Turn on two-factor authentication** for authorization and writes: npmjs.com → your avatar →
   _Account_ → _Two-Factor Authentication_. A security key is the strongest option npm offers.
3. **Create the organization** `react-schedulerkit`: npmjs.com → your avatar → _Add Organization_ →
   name `react-schedulerkit` → the free plan (unlimited public packages). This is what makes the
   `@react-schedulerkit/` scope yours.
4. **Log in locally** (only needed for the manual path in §4.2 and for the checks in §7):

   ```bash
   npm login
   npm whoami          # prints your username
   npm org ls react-schedulerkit   # lists you as owner
   ```

5. **Confirm the name is still free** right before publishing:

   ```bash
   npm view @react-schedulerkit/react-scheduler   # expected: 404 Not Found
   ```

## 2. Pre-flight on your machine

From the repository root, on an up-to-date `main`:

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test:coverage
pnpm build
pnpm --filter @react-schedulerkit/react-scheduler size
pnpm --filter @react-schedulerkit/react-scheduler lint:pkg
pnpm check:pack && pnpm check:zero-reference && pnpm check:licenses
pnpm release:sandbox          # the tarball in fresh React 19 and React 18.2 applications
node -p "require('./packages/react-scheduler/package.json').version"   # expected: 1.0.0
```

All of these pass on the branch this file was written on.

## 3. How 1.0.0 is produced

The version and the changelog were made by Changesets, not by hand, and are already committed:
`pnpm changeset version` consumed the `major` changeset, set the manifest to `1.0.0` and wrote
`packages/react-scheduler/CHANGELOG.md`, so the release was reviewed in git before anything
reaches the registry. What is left is the publish itself:

- **From CI (§4.1).** With no changeset pending, the release workflow skips the "Version packages"
  pull request and runs `changeset publish` straight away. It publishes every version the registry
  does not have yet — here `1.0.0` — then pushes the git tag
  `@react-schedulerkit/react-scheduler@1.0.0` (Changesets names tags after the package in a
  workspace) and creates the GitHub release with the changelog entry.
- **From your laptop (§4.2)**, if you prefer the first publish by hand.

The workflow only runs when the repository variable `RELEASE_ENABLED` is `true` (EXCEPTIONS #3).
Setting it is part of §4.

## 4. The first publish

npm attaches provenance only to a publish made in CI, and Trusted Publishing can only be configured
for a package that already exists. So the first version needs a token once.

### 4.1 Recommended: from CI, with a short-lived token

This gives `1.0.0` a provenance attestation like every later version.

1. **Create a granular access token** — npmjs.com → your avatar → _Access Tokens_ → _Generate New
   Token_ → _Granular Access Token_:
   - Expiration: 7 days — enough for one release, and it expires on its own if §5 is forgotten.
   - Packages and scopes: **Read and write**, limited to the `react-schedulerkit` organization.
   - Organizations: no access needed.
2. **Store it in GitHub** — the repository → _Settings_ → _Secrets and variables_ → _Actions_ →
   _New repository secret_ → name `NPM_TOKEN`, value the token.
3. **Let the workflow use it** — in `.github/workflows/release.yml`, give the `changesets/action`
   step this `env` (the `.npmrc` that setup-node writes reads it; `changesets/action` v2 no longer
   reads `NPM_TOKEN` itself):

   ```yaml
   env:
     NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} # first publish only (docs/release/npm.md §4.1)
   ```

   Commit this on its own branch and merge it; it is the only workflow change of the first release.

4. **Enable the workflow** — _Settings_ → _Secrets and variables_ → _Actions_ → _Variables_ →
   _New repository variable_ → `RELEASE_ENABLED` = `true`.
5. **Release** — `main` already carries `1.0.0`, and setting a variable is not a push, so start
   the workflow by hand: the repository → _Actions_ → _Release_ → _Run workflow_ on `main`. It
   builds, scans the tarball, runs the sandbox and publishes `1.0.0` with `--access public` and
   provenance. Watch the run; if a check fails, nothing is published.

### 4.2 Fallback: from your laptop

Docs pack `10` §4.2's manual path. `1.0.0` then carries no provenance attestation; `1.0.1` onwards
will.

```bash
git switch main && git pull            # the manifest already says 1.0.0
pnpm install --frozen-lockfile
pnpm release:sandbox                   # the same checks the workflow runs before publishing
pnpm --filter @react-schedulerkit/react-scheduler build
cd packages/react-scheduler
npm pack --dry-run                     # 121 files: dist/, README.md, LICENSE
npm publish --access public --provenance=false
cd ../..
git tag @react-schedulerkit/react-scheduler@1.0.0
git push origin @react-schedulerkit/react-scheduler@1.0.0
```

Use the tag name Changesets uses, so later releases from the workflow find it; then create the
GitHub release from that tag with the `1.0.0` section of `CHANGELOG.md` as its text.

`--provenance=false` overrides `publishConfig.provenance`, which would otherwise stop a publish
made outside CI.

## 5. Right after the first publish: Trusted Publishing

1. npmjs.com → the package → _Settings_ → _Trusted Publisher_ → **GitHub Actions**:
   - Organization or user: `kiralygyula92`
   - Repository: `react-scheduler`
   - Workflow filename: `release.yml`
   - Environment: leave empty
2. **Remove the token** from the workflow — delete the `env` added in §4.1 step 3 — and delete
   the `NPM_TOKEN` secret in GitHub.
3. **Revoke the token** on npmjs.com (_Access Tokens_ → delete).
4. Optionally, npmjs.com → the package → _Settings_ → _Publishing access_ → **Require two-factor
   authentication and disallow tokens**. Trusted Publishing keeps working; a leaked token no longer
   can.

From then on the workflow publishes through OIDC (npm ≥ 11.5.1, which it installs), with
provenance, and no secret exists to leak.

## 6. Every release after that

- A pull request that changes the package adds a changeset: `pnpm changeset`.
- Merged into `main`, the changesets gather in the "Version packages" pull request; merging it
  publishes.
- **Pre-releases** on the `next` dist-tag:

  ```bash
  pnpm changeset pre enter next   # releases publish as 1.1.0-next.0 … under "next"
  pnpm changeset pre exit         # back to "latest"
  ```

  Users try them with `npm i @react-schedulerkit/react-scheduler@next`.

- **Deprecating** a broken version: `npm deprecate @react-schedulerkit/react-scheduler@"<1.0.1" "Fixed in 1.0.1, please upgrade"`.
- **Unpublishing** is possible within 72 hours and only while nothing depends on the version; a
  version number can never be reused. Prefer a deprecation and a patch release.

## 7. Post-publish checks

Docs pack `10` §4.5, once `1.0.0` is on npm:

```bash
npm view @react-schedulerkit/react-scheduler            # version 1.0.0, license MIT
npm view @react-schedulerkit/react-scheduler dist-tags  # latest: 1.0.0
npm audit signatures                                     # in any project that installed it: verifies provenance
pnpm release:sandbox -- --from-registry 1.0.0            # the same two applications, from the registry
```

- [ ] The npm page shows the README, the MIT licence and the _Provenance_ badge (§4.1 path).
- [ ] `pnpm release:sandbox -- --from-registry 1.0.0` passes: install, types, Vite build, CommonJS.
- [ ] The GitHub release and the `@react-schedulerkit/react-scheduler@1.0.0` tag exist.
- [ ] The documentation site shows `v1.0` in the navbar and the footer, and the Changelog page lists
      1.0.0 (after its next deployment, `vercel.md` §3).
