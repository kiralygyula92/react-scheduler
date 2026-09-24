# npm publish readiness

How `@react-schedulerkit/react-scheduler` gets from this repository to npm, in the order it has to
happen, following docs pack `10` §4. Every step says whether it is **already done in the
repository** or **yours to do**, and gives the exact command or the place in the npm or GitHub
interface.

**Nothing in this file has been run against npm.** No account, organization, token or package was
created, and nothing was published. The repository is ready; the registry is untouched.

---

## Where things stand

| Item                                               | Status                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Package name `@react-schedulerkit/react-scheduler` | **Free** on npm (`npm view` answered 404 on 2026-09-24). The unscoped `react-scheduler` is taken (0.1.0).        |
| Version                                            | `0.0.0` in the manifest; one pending **major** changeset (`.changeset/first-release.md`) turns it into `1.0.0`   |
| Tarball                                            | 121 files: `dist`, `README.md`, `LICENSE`; zero-reference clean                                                  |
| Consumer check                                     | `pnpm release:sandbox` passes on React 19 and React 18.2 (install, `tsc`, `vite build`, CommonJS, publint, attw) |
| Release workflow                                   | `.github/workflows/release.yml`: Changesets, OIDC permission, tarball scan; off until `RELEASE_ENABLED` is set   |
| Provenance                                         | On (`publishConfig.provenance: true`) — which is why a laptop publish needs the flag in §4.2                     |
| npm account, organization, token                   | **None yet** — yours, §1                                                                                         |

---

## 0. Decide two things first

Both change what ships, so settle them before the first publish — a published version cannot be
edited, only superseded.

1. **The scope.** The package is named for the npm organization `react-schedulerkit` (GAPS G2). If
   you end up publishing under another scope, the name changes in `packages/react-scheduler/package.json`,
   in the changeset, in every import shown on the site and in `AGENTS.md`'s dictionary. Ask for that
   change as its own task; it is a search-and-replace plus a full gate run.
2. **The documentation domain** (GAPS G1). `homepage` in the manifest and the README's link point at
   `https://react-schedulerkit.vercel.app/react-scheduler/`. If the site lands elsewhere, update both
   before publishing, or the npm page links to nothing. See `vercel.md` §5.

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
pnpm changeset status         # expected: one "major" bump for @react-schedulerkit/react-scheduler
```

All of these pass on the branch this file was written on.

## 3. How 1.0.0 is produced

The version and the changelog are made by Changesets, not by hand:

1. Merging a branch that carries `.changeset/first-release.md` into `main` makes the release
   workflow open a pull request named **"Version packages"**. It sets the manifest to `1.0.0`,
   deletes the changeset and writes `packages/react-scheduler/CHANGELOG.md`.
2. Merging that pull request runs `changeset publish`, which publishes `1.0.0`, tags `v1.0.0`
   on GitHub and — through the site's build — puts the entry on the Changelog page.

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
3. **Let the workflow use it** — in `.github/workflows/release.yml`, the `env` of the
   `changesets/action` step becomes:

   ```yaml
   env:
     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     NPM_TOKEN: ${{ secrets.NPM_TOKEN }} # first publish only (docs/release/npm.md §4.1)
     NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} # read by the .npmrc that setup-node writes
   ```

   Commit this on its own branch and merge it; it is the only workflow change of the first release.

4. **Enable the workflow** — _Settings_ → _Secrets and variables_ → _Actions_ → _Variables_ →
   _New repository variable_ → `RELEASE_ENABLED` = `true`.
5. **Release** — `main` already carries the changeset once M8 is merged, and setting a variable is
   not a push, so start the workflow by hand: the repository → _Actions_ → _Release_ → _Run
   workflow_ on `main`. It opens the "Version packages" pull request; review its `CHANGELOG.md` and
   merge it. That merge runs the workflow again, which publishes `1.0.0` with `--access public` and
   provenance.

### 4.2 Fallback: from your laptop

Docs pack `10` §4.2's manual path. `1.0.0` then carries no provenance attestation; `1.0.1` onwards
will.

```bash
pnpm changeset version                 # manifest → 1.0.0, writes CHANGELOG.md
git commit -am "Version packages"      # on a branch, reviewed, merged into main
pnpm --filter @react-schedulerkit/react-scheduler build
cd packages/react-scheduler
npm pack --dry-run                     # only dist/, README.md, LICENSE
npm publish --access public --provenance=false
git tag v1.0.0 && git push origin v1.0.0
```

`--provenance=false` overrides `publishConfig.provenance`, which would otherwise stop a publish
made outside CI.

## 5. Right after the first publish: Trusted Publishing

1. npmjs.com → the package → _Settings_ → _Trusted Publisher_ → **GitHub Actions**:
   - Organization or user: `kiralygyula92`
   - Repository: `react-scheduler`
   - Workflow filename: `release.yml`
   - Environment: leave empty
2. **Remove the token** from the workflow — delete the two lines added in §4.1 step 3 — and delete
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
- [ ] The GitHub release and the `v1.0.0` tag exist.
- [ ] The documentation site shows `v1.0` in the navbar and the footer, and the Changelog page lists
      1.0.0 (after its next deployment, `vercel.md` §3).
