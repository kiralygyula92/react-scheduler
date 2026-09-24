# Vercel deploy readiness

How the documentation site in `apps/docs` gets onto Vercel, in the order it has to happen,
following docs pack `10` §3. Every step says whether it is **already done in the repository** or
**yours to do**.

**Nothing in this file has been run against Vercel.** No project, domain or deployment exists; the
repository is ready for one.

---

## Where things stand

| Item                   | Status                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build                  | `pnpm build` at the root builds the package, the API data and the site: 876 prerendered pages, Markdown twins, `llms*.txt`, `sitemap.xml`, `robots.txt` |
| Host configuration     | `apps/docs/vercel.json`: `/` → `/react-scheduler/` redirect, trailing slashes, immutable caching for `/assets/`, Markdown content types                 |
| Canonical origin       | `VITE_SITE_URL` in production; previews fall back to `VERCEL_URL` (`apps/docs/vite.config.ts`) — no URL is hard-coded                                   |
| Not-found page         | the build writes `build/client/404.html`, which a static host serves with status 404 for any path without a file                                        |
| Analytics              | `<Analytics />` and `<SpeedInsights />` from the `/react` entry points in `apps/docs/src/root.tsx`; they record nothing until enabled on the dashboard  |
| Local rehearsal        | `node apps/docs/scripts/serve.ts` serves the build the way the host does, compressed, with the host's cache headers; the e2e suite runs against it      |
| Package manager, Node  | `packageManager: pnpm@10.34.5` in the root manifest; Node 24                                                                                            |
| Vercel project, domain | **None yet** — yours, §1 and §5                                                                                                                         |

---

## 1. Create the project — yours

1. Push `main` to GitHub (it is).
2. <https://vercel.com> → **Add New… → Project** → import `kiralygyula92/react-scheduler`.
3. **Project name**: `react-schedulerkit` gives `react-schedulerkit.vercel.app`, the domain the site is
   built for today. Another name gives another domain; see §5.
4. **Root Directory**: `apps/docs`, with **"Include files outside the root directory in the Build
   Step"** enabled — the build needs the package and the workspace.
5. **Framework Preset**: _Other_. (The site is React Router's prerender, not Vite's default output.)
6. **Install Command**: `pnpm install --frozen-lockfile`
7. **Build Command**: `cd ../.. && pnpm build`
8. **Output Directory**: `build/client`
9. **Node.js Version**: 24.x — _Project Settings_ → _General_.

## 2. Environment variables — yours

_Project Settings_ → _Environment Variables_:

| Name            | Value                                                                   | Environments |
| --------------- | ----------------------------------------------------------------------- | ------------ |
| `VITE_SITE_URL` | `https://react-schedulerkit.vercel.app`, or the production domain of §5 | Production   |

Nothing else is required. Previews need no value: the build takes `VERCEL_URL`, so their canonical
links and sitemap point at the preview itself.

## 3. First deployment — yours

1. **Deploy.** The first build takes a few minutes: it builds the package, extracts the API, and
   prerenders every page in seven languages.
2. **Check the production URL** with the developer tools open:

   | Request                                     | Expected                                                                                                                         |
   | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
   | `/`                                         | `308` to `/react-scheduler/`                                                                                                     |
   | `/react-scheduler/`                         | the Overview, English                                                                                                            |
   | `/react-scheduler/de/pinning/`              | a German capability page with its demo                                                                                           |
   | `/react-scheduler/does-not-exist/`          | the site's 404 page, status `404` — in English: the build copies it to `404.html`, and a static host cannot choose one by locale |
   | `/react-scheduler/llms.txt`, `/sitemap.xml` | the index for agents, and every page × locale with alternates                                                                    |
   | `/react-scheduler/pinning/index.md`         | the Markdown twin, `text/markdown`                                                                                               |
   | any `/assets/*.js`                          | `cache-control: public, max-age=31536000, immutable`                                                                             |

3. The production domain must be **public** (O18). Deployment Protection may stay on for previews.

## 4. Analytics — yours (O15)

1. Dashboard → the project → **Analytics** → _Enable_; → **Speed Insights** → _Enable_.
2. **Redeploy** — the scripts are only served after the toggles are on.
3. Verify on the production URL, in a browser without content blockers:
   - `GET /_vercel/insights/script.js` → `200`
   - `GET /_vercel/speed-insights/script.js` → `200`
   - a request to `/_vercel/insights/view` on each client-side navigation.

   These are the two requests that return `404` in local measurements (`docs/audit/1.0.0.md` §3);
   once they answer `200`, Lighthouse's best-practices deduction has gone.

4. If nothing arrives: check both toggles, that no rewrite matches `/_vercel/` (conformance C15 keeps
   the repository free of one), and that the domain you are visiting is the one the project owns.

## 5. Domain (GAPS G1) — yours

- **Keeping `react-schedulerkit.vercel.app`**: nothing to do beyond §1.3 and §2.
- **A custom domain**: _Project Settings_ → _Domains_ → add it, and create the DNS record Vercel shows
  (an `A` record for an apex domain, a `CNAME` for a subdomain). Then, before the next deployment and
  **before the first npm publish**:
  - set `VITE_SITE_URL` to it (§2);
  - change `homepage` in `packages/react-scheduler/package.json` and the documentation link in
    `packages/react-scheduler/README.md`;
  - replace `react-schedulerkit.vercel.app` in `AGENTS.md`'s dictionary and in
    `apps/docs/vite.config.ts`'s fallback, and close G1 in `GAPS.md`.

## 6. After the site is live

1. **Lighthouse on previews** (`07` §5.8, EXCEPTIONS #1). Add a CI job that runs
   `scripts/audit/lighthouse.ts` against each pull request's preview URL — informational on pull
   requests, gating on `main`, per the pack. It measures the same four pages the audit measured
   locally.
2. **Speed Insights** (`07` §1) then reports field data: LCP under 2.0 s, INP under 150 ms, CLS under
   0.05 at the 75th percentile are the targets.

## 7. The next major: versioned documentation

Nothing to do for 1.0. When 2.0 ships (`10` §3.4):

1. Create the branch `v1.x` from the last commit of 1.x.
2. Create a second Vercel project, `react-scheduler-v1`, importing the same repository with
   **Production Branch** `v1.x` and the settings of §1–§2.
3. On `main`, add the old major to `apps/docs/src/content/versions.json`:

   ```json
   [
     { "label": "v2.0", "href": "/react-scheduler/", "current": true, "supported": true },
     { "label": "v1.0", "href": "https://react-scheduler-v1.vercel.app/react-scheduler/", "supported": true }
   ]
   ```

   The navbar's version menu lists the file; the current entry's label always comes from the
   package's own version.

4. The archived major then receives only security and broken-link fixes.
