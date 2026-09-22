# 10 — Deployment: Vercel (site) and npm (package)

---

## 1. Build outputs

| Artifact | Command | Output |
|---|---|---|
| Package | `pnpm --filter {{NPM_PACKAGE}} build` | `packages/{{PACKAGE_DIR}}/dist/` |
| API data | `pnpm --filter docs api` | `apps/docs/src/content/api/` |
| Site | `pnpm --filter docs build` | `apps/docs/build/client/` (static HTML for every route × locale, assets, machine surface) |

The site depends on the package through the workspace (`"{{NPM_PACKAGE}}": "workspace:*"`), so the package MUST be built before the site. The root `build` script does both in order.

## 2. Routing on a static host

- Route paths are generated **with** the `/{{PLUGIN_ID}}/` prefix (no router `basename`), and Vite `base` is `/`. Prerendered files land at `build/client/{{PLUGIN_ID}}/…/index.html`; assets at `/assets/*`. This avoids base-path edge cases on Vercel and keeps `/_vercel/*` untouched.
- `/` redirects to `/{{PLUGIN_ID}}/`.
- Unknown paths serve `/{{PLUGIN_ID}}/404/index.html` with status 404.

`apps/docs/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": false,
  "trailingSlash": true,
  "redirects": [
    { "source": "/", "destination": "/{{PLUGIN_ID}}/", "permanent": true }
  ],
  "headers": [
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/{{PLUGIN_ID}}/(.*)\\.(md|txt)", "headers": [{ "key": "Content-Type", "value": "text/markdown; charset=utf-8" }] }
  ]
}
```

Rules: no catch-all rewrite (every page is prerendered); no rule may match `/_vercel/` (C15). Slug renames add entries to `redirects`.

## 3. Vercel project setup

### 3.1 First deployment

1. Push the repository to GitHub.
2. Vercel → **Add New… → Project** → import the repository.
3. **Root Directory**: `apps/docs`. Enable "Include files outside the root directory in the Build Step".
4. **Framework Preset**: Vite (or Other).
5. **Install Command**: `pnpm install --frozen-lockfile` (runs at the workspace root automatically).
6. **Build Command**: `cd ../.. && pnpm build` (package → API data → site).
7. **Output Directory**: `build/client`.
8. **Node.js Version**: 24.x (Project Settings → General).
9. **Environment variables**: none required. `VITE_SITE_URL=https://{{SITE_DOMAIN}}` for canonical URLs (Production) and `VITE_SITE_URL=$VERCEL_URL`-derived in Preview (set in `vite.config.ts`, not hard-coded).
10. Deploy.

### 3.2 Branches, previews, domain

- Production branch: `main`. Every PR gets a Preview deployment; Lighthouse CI runs against it.
- Deployment Protection MAY stay on for previews, but the **production** domain MUST be public (O18).
- Custom domain (optional): Project → Settings → Domains → add `{{SITE_DOMAIN}}`; set the DNS record Vercel shows (A record for apex, CNAME for subdomain).

### 3.3 Analytics (O15)

1. In code, `apps/docs/src/root.tsx`:

   ```tsx
   import { Analytics } from '@vercel/analytics/react';
   import { SpeedInsights } from '@vercel/speed-insights/react';
   // inside <body>, after the app:
   <Analytics />
   <SpeedInsights />
   ```

   Use the **`/react`** entry points. Never the `/next` ones.
2. In the dashboard: Project → **Analytics** → Enable Web Analytics; Project → **Speed Insights** → Enable. Until enabled, the scripts return 404 and nothing is recorded.
3. Redeploy after enabling.
4. Verify on the production URL with devtools open: `GET /_vercel/insights/script.js` → 200, `GET /_vercel/speed-insights/script.js` → 200, and a request to `/_vercel/insights/view` on each client-side navigation. Test in a browser without content blockers.
5. If nothing arrives: check the dashboard toggles, that no rewrite matches `/_vercel/`, that the build includes the components (search the built JS for `insights`), and that the domain you visit is the one the project owns.

### 3.4 Versioned documentation

- `apps/docs/src/content/versions.json`:

  ```json
  [
    { "label": "v2.0", "href": "/{{PLUGIN_ID}}/", "current": true, "supported": true },
    { "label": "v1.4", "href": "https://{{PLUGIN_ID}}-v1.vercel.app/{{PLUGIN_ID}}/", "supported": true }
  ]
  ```

- When a new major is released: create branch `v{n}.x` from the last commit of the old major; create a second Vercel project `{{PLUGIN_ID}}-v{n}` importing the same repo with Production Branch `v{n}.x` (same settings as §3.1); add the entry to `versions.json` on `main`. Archived majors receive only security and broken-link fixes.
- The navbar version select lists `versions.json`; selecting an entry navigates to its `href`.

## 4. npm publishing

### 4.1 One-time setup

1. Create an npm account and enable **2FA** (auth-and-writes).
2. Check the name: `npm view {{NPM_PACKAGE}}` (a 404 means it is free). If taken, use the scope: `@{{NPM_SCOPE}}/{{PLUGIN_ID}}`. For a scope, create the org on npmjs.com or use your username as the scope.
3. `npm login` locally.

### 4.2 First publish (manual)

```bash
pnpm install
pnpm --filter {{NPM_PACKAGE}} build
cd packages/{{PACKAGE_DIR}}
npm pack --dry-run                    # inspect the file list: only dist, README, LICENSE
npm pack                              # creates {{PLUGIN_ID}}-0.1.0.tgz
# sandbox test in a fresh Vite app:
#   npm i ../path/to/{{PLUGIN_ID}}-0.1.0.tgz react react-dom
#   import the component + stylesheet, run dev and build
npx publint && npx @arethetypeswrong/cli --pack .
npm publish --access public           # --access public is required for the first publish of a scoped package
```

### 4.3 Automated releases (recommended)

- After the first publish, configure **Trusted Publishing** on npmjs.com → package → Settings → Trusted publishers → GitHub Actions (owner, repository, workflow file `release.yml`). Publishing then uses OIDC: no long-lived token in GitHub, and provenance is attached automatically. Requires npm CLI ≥ 11.5.1 in the workflow.
- Fallback if Trusted Publishing is not available: a **granular** access token with publish rights to this package only, stored as the `NPM_TOKEN` secret, and `--provenance` on publish.
- Flow: PRs add changesets → the Changesets action opens a "Version packages" PR → merging it publishes and tags.

### 4.4 Dist-tags, deprecation, unpublishing

- Pre-release: `pnpm changeset pre enter next` → releases publish under `next`. Install with `npm i {{NPM_PACKAGE}}@next`. Exit with `pnpm changeset pre exit`.
- Deprecate a version: `npm deprecate {{NPM_PACKAGE}}@"<1.2.0" "Security fix in 1.2.0, please upgrade"`.
- Unpublish is possible within 72 hours of publishing if no other package depends on it; after that only under npm's stricter conditions. Prefer `deprecate` and a patch release. A version number can never be reused.

### 4.5 Post-publish checklist

- [ ] `npm view {{NPM_PACKAGE}}` shows the new version, licence MIT, and provenance.
- [ ] Fresh sandbox install from the registry works (ESM app and a CJS require test).
- [ ] Types resolve in the sandbox (`tsc --noEmit`).
- [ ] The docs site shows the new version in the navbar, footer and Changelog.
- [ ] GitHub release and tag exist.

## 5. GitHub Actions

### 5.1 `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        react: ['18.3', '19']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter {{NPM_PACKAGE}} add -D react@${{ matrix.react }} react-dom@${{ matrix.react }}
        if: matrix.react != '19'
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm check:licenses
      - run: pnpm check:zero-reference
      - run: pnpm --filter {{NPM_PACKAGE}} build
      - run: pnpm --filter {{NPM_PACKAGE}} size
      - run: pnpm --filter {{NPM_PACKAGE}} lint:pkg
      - run: pnpm --filter docs api
      - run: pnpm --filter docs i18n:check
      - run: pnpm --filter docs build
      - run: pnpm --filter docs conformance
      - run: pnpm exec playwright install --with-deps
        if: matrix.react == '19'
      - run: pnpm e2e:smoke
        if: matrix.react == '19'
```

### 5.2 `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    branches: [main]
concurrency: release
permissions:
  contents: write
  pull-requests: write
  id-token: write        # OIDC for npm Trusted Publishing and provenance
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm, registry-url: 'https://registry.npmjs.org' }
      - run: npm install -g npm@latest       # Trusted Publishing needs npm >= 11.5.1
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter {{NPM_PACKAGE}} build
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          version: pnpm changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # NPM_TOKEN: ${{ secrets.NPM_TOKEN }}   # only for the granular-token fallback
```

Pin third-party actions to commit SHAs once the workflows are stable (`TODO(user):` optional hardening).

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Vercel build: `Cannot find module '{{NPM_PACKAGE}}'` | Package not built before the site | Build Command must be the root `pnpm build` (§3.1) |
| Vercel build: lockfile error | Lockfile out of date or pnpm version mismatch | Run `pnpm install` locally, commit the lockfile; pin `packageManager` |
| 404 on every page | Wrong Root Directory or Output Directory | `apps/docs` and `build/client` |
| 404 on `/` only | Redirect missing | `vercel.json` redirect (§2) |
| Assets 404 on nested pages | Relative asset URLs | Vite `base: '/'`; never relative `./assets` |
| Analytics empty | See §3.3 step 5 | |
| `npm publish` 403 | Name taken, missing 2FA, or no access to scope | Check name, 2FA, scope membership; `--access public` for scoped |
| `npm publish` E422 provenance | Workflow lacks `id-token: write` or package `repository` does not match the GitHub repo | Fix permissions and `repository.url` |
