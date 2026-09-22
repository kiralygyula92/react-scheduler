# 08 — Observed Issues and Fixes

Every rule here exists because an earlier AI-generated plugin site or package got it wrong and needed a follow-up prompt. These rules have the **highest precedence** after the user's own instructions (see `00` §3). Each has an ID; cite the ID in commits, reviews and `EXCEPTIONS.md`.

Re-read this file before each milestone review. A milestone is not done while any applicable rule is violated.

---

## 1. Site structure and framework

| ID | Observed | Rule |
|---|---|---|
| O12 | The site was generated in Astro and later had to be rewritten to React with the exact same output. | The site MUST be React + Vite + React Router as in `00` §5 from the first commit. No Astro, Next.js, Docusaurus, VitePress, Nextra or MDX runtime. No file, dependency, config or comment may mention another site framework. |
| O3 | Sidebar structure differed between plugins. | The nine sections of `01` §3 in the fixed order, with the fixed Getting-started children, in every plugin. |
| O17 | Getting-started children varied ("Quickstart" vs "Usage", "Requirements and compatibility" vs "Requirements"). | Exactly: Overview, Installation, Usage, AI context, Requirements, FAQ, Support, Versions. |
| O16 | The AI-context page was missing and then added in different places. | `getting-started/ai-context/` is always present, directly after Usage, with the T3 template. |
| O19 | The first site pack was written for a commercial portfolio; agents added marketing, pricing, tier badges and feedback widgets. | Docs-only site. No landing page, pricing, plans, tier badges, testimonials, newsletter, sponsor slots, "Edit this page", "Was this page helpful?" (C10). |
| O20 | Each site re-implemented the shell and fixes on one site never reached the others. | Copy `11-docs-shell-reference/` verbatim into `src/shell/` and `src/i18n/`. Shell changes are made in the pack and re-applied to all plugins. |

## 2. Layout and visual

| ID | Observed | Rule |
|---|---|---|
| O1 | Navbar and page were inside a centred container, leaving empty bands on wide screens. | Full width everywhere. No `max-width` container in navbar, page or footer. The content column absorbs all free width. |
| O2 | Colours differed per site and did not match the reference scheme. | Use `tokens.css` exactly. Both light and dark themes ship on day one. |
| O9 | Forms, controls and spacing were too large. | Condensed sizes from `02` §3, §4 and §6.9. Controls are 32px tall; body text 15px. |
| O14 | Navbars differed: logo square vs text, "GitHub" text vs icon, `Ctrl K` vs `/`, version labels `v1` / `v0.1` / `v1.0`. | Text wordmark only; GitHub icon; `/` hint (with `/`, `Ctrl+K` and `⌘K` all working); version label `v{major}.{minor}` from `package.json`. |
| O8 | The theme-switch button had a border. | Navbar icon buttons (GitHub, theme, language) have no border. Only the search control is outlined. |
| O13 | The search dialog input was white in dark mode. | Inputs use `--ds-bg-input`; never hard-coded colours. Tested in dark-mode visual tests. |
| O21 | Language selection did not exist. | Language menu in the navbar right after the theme toggle, listing seven native names (`01` §2). |

## 3. Sidebar and table of contents

| ID | Observed | Rule |
|---|---|---|
| O4 | Sidebar section headers were not clickable; sections could not be collapsed. | Section headers are buttons that toggle their section (`aria-expanded`). The current page's section opens automatically; other sections remember their state for the session. |
| O5 | Sidebar sub-items were not indented. | Items are indented 16px relative to the section header text; group labels align with item text. |
| O6 | The active item in the right-hand "On this page" list had rounded corners and a background. | The active ToC item has no background and no radius: accent colour plus a straight 2px accent bar over the list's left border. (The **left** sidebar's active item keeps its 6px radius and soft background.) |
| O7 | The plugin name in the breadcrumbs was underlined. | Breadcrumb links are never underlined in any state. |
| O22 | Sidebar and main content scrolled together; long sidebars were unreachable. | The sidebar is sticky with its own scroll and keeps its scroll position across client navigations. |

## 4. Mobile

| ID | Observed | Rule |
|---|---|---|
| O10 | Mobile showed a "Browse documentation" bar inside the page instead of a menu. | Below 900px: hamburger button at the far left of the navbar opens the drawer defined in `02` §6.4. No in-page navigation bar. |
| O23 | Mobile navbar lacked search. | Mobile navbar right side: outlined search icon button, GitHub, theme, language. |

## 5. Demos and Playground

| ID | Observed | Rule |
|---|---|---|
| O11 | Playground controls sat beside the component, squeezing it. | Controls panel above, component below, both full content width; the Playground page hides the ToC (`04` §4.1). |
| O24 | Playgrounds varied in completeness. | Controls are generated from the props type; every public prop is either a control or listed under "Code only" (C7). Follow the React Tablekit playground structure. |
| O25 | Some doc demos had editable code. | Doc demos show static source only (`04` §1). |

## 6. Analytics and deployment

| ID | Observed | Rule |
|---|---|---|
| O15 | Vercel Analytics showed no data after deployment. Causes seen or likely: the dashboard toggles were off (scripts return 404 until enabled), the Next.js import was used in a non-Next app, and base-path rewrites can swallow `/_vercel/*`. | Use `@vercel/analytics/react` and `@vercel/speed-insights/react` in `root.tsx`. Enable **Web Analytics** and **Speed Insights** in the Vercel project. No rewrite may match `/_vercel/` (C15). Verify after deploy: the Network tab shows `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js` with status 200 and a `view` event on navigation (see `10` §3.3). |
| O18 | The golden preview deployment was behind Vercel login, so agents could not inspect it. | Production aliases are public. Reference values an agent needs live in this pack, never only on a protected URL. |

## 7. Package (plugin)

| ID | Observed | Rule |
|---|---|---|
| P1 | Source-project names, data structures and examples leaked into the package and site. | Zero-reference scan (`09` §8) passes before every milestone. Replace every project-specific concept with a generic one from the Dossier's naming map. |
| P2 | A third-party editor engine (Lexical) was used although the feature could be written natively. | Native TypeScript first. A runtime dependency is allowed only when the feature cannot reasonably be reproduced natively, it has an allowlisted licence, and an ADR approves it (`09` §3). |
| P3 | Engine libraries were bundled or version-locked. | An approved engine (e.g. `pdfjs-dist`, `three`) is a **peer dependency** with a documented range, never bundled, never a direct dependency. |
| P4 | Repositories kept dead code, experiments and leftover files. | Only `packages/`, `apps/docs/`, `spec/`, `docs/adr/`, config and root docs remain. `knip` (dev tool) reports zero unused files, exports and dependencies. |
| P5 | Packages lacked licence, configs or publish metadata. | `09` §5–§7 checklist complete: MIT `LICENSE`, full `package.json`, `exports`, `files`, `sideEffects`, provenance-ready release workflow. |
| P6 | Rich-text lists: a nested bullet showed two markers (outer and inner). | Nested list items render one marker only (the item's own). Regression test for every list type. |
| P7 | Rich-text checklist: the checkbox was not vertically centred with its text. | Checklist rows use `display: flex; align-items: center` (first line alignment for multi-line items: `align-items: flex-start` with the box offset by `(line-height − box) / 2`). Visual test. |
| P8 | Packages were declared publish-ready without a full audit. | Before 1.0 and before every major: the audit in `09` §10 (rendering, performance, gaps, bugs, blockers) with a written report. |
| P9 | Hard-coded English strings in ARIA labels and messages (e.g. a hard-coded "select all" label). | Every user-visible or assistive-technology string in the package comes from its `localization` prop; locale packs ship for the seven site languages (`09` §4.6). |
| P10 | Known source bugs were sometimes reproduced "for parity". | Parity means same behaviour **minus** the bugs listed in the Dossier; each listed bug has a named regression test. |
