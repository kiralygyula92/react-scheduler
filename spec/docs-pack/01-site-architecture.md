# 01 — Site Architecture

The documentation website is a docs-only site. There is no marketing surface, no landing page and no pricing. The site root redirects to the plugin's docs root.

---

## 1. URL taxonomy

```
https://{{SITE_DOMAIN}}/                                   → 308 redirect to /{{PLUGIN_ID}}/
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/                     → Overview (English)
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/{section}/{page}/    → section page (English)
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/{capability}/        → capability page (English)
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/{lng}/...            → same page, other locale
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/.../index.md         → Markdown twin of any page
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/llms.txt             → index for agents (English)
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/llms-full.md         → every page + example source (English)
https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/{lng}/llms-full.md   → same, per locale
```

Rules:

- **R1** All paths are lowercase kebab-case and end with a trailing slash.
- **R2** English is the default locale and has **no** prefix. The six other locales use a prefix placed directly after the plugin id: `/react-pdf-viewer/ro/getting-started/installation/`.
- **R3** Slugs are English in every locale. Only the content is translated, never the URL. This keeps links, anchors and the Markdown twins stable.
- **R4** Capability pages sit directly under the plugin id (`/{{PLUGIN_ID}}/zoom/`), never under a category path. The category lives in `nav.json`, not in the URL.
- **R5** Section pages use the section slug: `getting-started/`, `demos/`, `api/`, `customization/`, `guides/`, `integrations/`, `migration/`, `discover-more/`.
- **R6** A slug never changes once published. A renamed or removed page gets a permanent redirect in `vercel.json`.
- **R7** Heading anchors are the English slug of the heading key (see `06` §5.4), identical in every locale.

## 2. Locales

| Code | Native name (menu label) | `<html lang>` | `hreflang` |
|---|---|---|---|
| `en` | English | `en` | `en` + `x-default` |
| `ro` | Română | `ro` | `ro` |
| `hu` | Magyar | `hu` | `hu` |
| `es` | Español | `es` | `es` |
| `fr` | Français | `fr` | `fr` |
| `de` | Deutsch | `de` | `de` |
| `pt` | Português | `pt` | `pt` |

- Every page exists in all seven locales. **Full content translation is required** (see `06` §5). A missing key fails the build.
- The language menu sits in the navbar **after the theme toggle** (see `02` §6.1). Switching language keeps the current page and the current hash.
- The chosen locale is stored in `localStorage` under `ds:locale`. The site never redirects automatically based on `Accept-Language`; search engines and shared links must land on the URL they asked for.
- Every page emits `<link rel="alternate" hreflang>` for all seven locales plus `x-default` (English).

## 3. The fixed section model

The sidebar always has exactly these nine sections, in this order, in every plugin site. A section may not be renamed, reordered or removed. A plugin that has nothing for a section still shows it, with an index page that says so honestly (for example, Migration for a v1 package explains there is nothing to migrate yet and links to the Versions policy).

| # | Section | Slug | Fixed children (in order) | Plugin-specific children |
|---|---|---|---|---|
| 1 | Getting started | `getting-started` | Overview (`/{{PLUGIN_ID}}/`), Installation, Usage, AI context, Requirements, FAQ, Support, Versions | none |
| 2 | Features | — (capabilities live at root) | All features (`all-features/`) | Capability pages, grouped under uppercase group labels (e.g. `CORE FEATURES`, `DISPLAY & LAYOUT`) |
| 3 | Demos | `demos` | Demos (index), … , Playground | Demo pages between the index and Playground; Theme editor MAY follow Playground |
| 4 | Reference | `api` | API index | One page per exported symbol (generated) |
| 5 | Customization | `customization` | Overview, Theming, CSS variables, Slots and overrides, Localization | Plugin-specific customization pages after the fixed ones |
| 6 | Guides | `guides` | Guides (index) | Task-oriented guides |
| 7 | Integrations | `integrations` | Integrations (index), Vite, Next.js, React Router, SSR | Plugin-specific integrations after the fixed ones |
| 8 | Migration | `migration` | Migration (index) | One page per major-version upgrade and one "from a custom implementation" guide |
| 9 | Discover more | `discover-more` | Changelog, Roadmap, Accessibility, License | none |

Sidebar node labels are translation keys (`nav.*` in `common.json`); the English labels above are the `en` values.

## 4. Navigation data model

The sidebar, breadcrumbs, prev/next links, sitemap, search index, `llms.txt` and prerender route list are all generated from **one** file: `apps/docs/src/content/nav.json`, validated against `11-docs-shell-reference/nav.schema.json`.

```jsonc
{
  "$schema": "./nav.schema.json",
  "pluginId": "{{PLUGIN_ID}}",
  "displayName": "{{PLUGIN_DISPLAY_NAME}}",
  "packageName": "{{NPM_PACKAGE}}",
  "repoUrl": "{{REPO_URL}}",
  "siteUrl": "https://{{SITE_DOMAIN}}",
  "playground": { "component": "{{COMPONENT}}", "variant": "standard" },
  "sections": [
    { "id": "getting-started", "labelKey": "nav.gettingStarted", "items": [
      { "id": "overview", "labelKey": "nav.overview", "path": "/", "page": "getting-started/overview", "template": "T1" }
    ]},
    { "id": "features", "labelKey": "nav.features", "items": [
      { "id": "all-features", "labelKey": "nav.allFeatures", "path": "/all-features/", "page": "features/all-features", "template": "T5" },
      { "type": "group", "labelKey": "nav.groups.coreFeatures", "items": [
        { "id": "zoom", "labelKey": "nav.capabilities.zoom", "path": "/zoom/", "page": "features/zoom",
          "template": "T6", "symbols": ["{{COMPONENT}}"], "badge": "new" }
      ]}
    ]}
    /* … the other seven sections, always present, always in this order … */
  ]
}
```

A complete, schema-valid example for a fictional plugin is in `11-docs-shell-reference/nav.example.json`.

- `path` is relative to `/{{PLUGIN_ID}}/` and to the locale prefix.
- `page` points at `apps/docs/src/content/pages/{page}.tsx` and at the locale namespace `pages/{page}.json`.
- `badge` is one of `new`, `preview`, `beta`, `deprecated`. No other badges exist. Badges are rendered from here only; content never hard-codes them.
- Groups (`type: "group"`) render as uppercase labels, not as collapsible nodes, and nest only one level deep.

## 5. Application structure (`apps/docs`)

```
apps/docs/
├─ react-router.config.ts        ← ssr:false, prerender: all routes × all locales
├─ vite.config.ts                ← base: '/' (routes carry the /{{PLUGIN_ID}}/ prefix; see 10 §2)
├─ vercel.json
├─ public/                       ← favicon, og.png, fonts (self-hosted, OFL-1.1)
├─ scripts/
│  ├─ extract-api.ts             ← see 05
│  ├─ build-search-index.ts      ← one index per locale
│  ├─ build-machine-surface.ts   ← llms.txt, llms-full.md/.txt, .md twins, sitemap.xml
│  ├─ check-i18n.ts              ← key parity, placeholder parity, no empty strings
│  └─ check-conformance.ts       ← see 07 §6
└─ src/
   ├─ root.tsx                   ← html shell, theme bootstrap script, analytics
   ├─ routes.ts                  ← generated from nav.json (one route per item, per locale prefix)
   ├─ shell/                     ← COPIED from 11-docs-shell-reference, not modified per plugin
   ├─ i18n/                      ← COPIED from 11-docs-shell-reference
   ├─ lib/                       ← highlighter, search, markdown-twin renderer
   ├─ content/
   │  ├─ nav.json
   │  ├─ pages/{section}/{slug}.tsx    ← page components built from doc primitives
   │  └─ api/                          ← generated JSON from extract-api (git-ignored)
   ├─ demos/{capability}/{Demo}.tsx    ← demo components; source shown verbatim in code blocks
   ├─ playground/                      ← controls generated from api/*.json
   └─ locales/{lng}/
      ├─ common.json                   ← shell strings (copied from 11, then plugin name filled)
      ├─ nav.json                      ← sidebar labels for plugin-specific items
      ├─ api.json                      ← translated API descriptions
      └─ pages/{section}/{slug}.json   ← page prose
```

`src/shell/` and `src/i18n/` are **identical across all plugin repos**. A diff between two plugin repos' `src/shell/` MUST be empty. `check-conformance.ts` compares a checksum of `src/shell/` against `11-docs-shell-reference/SHELL_CHECKSUM` once the shell is first built, and warns on drift.

## 6. Routing and prerendering

- React Router framework mode with `ssr: false` and `prerender` returning every `nav.json` path × every locale, plus `/404`.
- Route paths are generated from `nav.json` **with** the `/{{PLUGIN_ID}}/` prefix; there is no router `basename`, and Vite `base` is `/` (see `10` §2).
- Every prerendered page contains its full content, sidebar, ToC and meta tags in static HTML. JavaScript enhances search, theme, language menu, drawers, copy buttons, demos and the Playground.
- Client navigation between pages uses the router; the sidebar keeps its scroll position and its expanded sections across navigations.
- On navigation, focus moves to the page `<h1>` and the document title updates. Hash links scroll with `scroll-margin-top` equal to the navbar height plus 16px.
- Unknown paths render the shared 404 page (in the current locale) with a search box and a link to the Overview.

## 7. Machine-readable surface (AI context)

Generated at build time by `build-machine-surface.ts` from the same page components and locale files as the HTML, so it can never say anything the site does not:

| File | Content |
|---|---|
| `/{{PLUGIN_ID}}/llms.txt` | `# {Name}`, the one-line description, then one `## {Section}` block per section with `- [Title](url.md): description` |
| `/{{PLUGIN_ID}}/llms-full.md` | Every page in nav order, with the source of every demo inlined where the page shows it, and the full API reference |
| `/{{PLUGIN_ID}}/llms-full.txt` | Byte-identical copy of `llms-full.md` |
| `…/{page}/index.md` | That one page as Markdown, with its API symbols appended |
| `/{{PLUGIN_ID}}/{lng}/llms*.{txt,md}` | The same for each locale |
| `/sitemap.xml` | All pages × all locales with `xhtml:link` alternates |

The **AI context** page (`getting-started/ai-context/`) documents these files exactly as specified in `03` §3.4.

## 8. Global chrome, per page

```
┌──────────────────────────── navbar (full width, sticky) ────────────────────────────┐
├──────────────┬─────────────────────────────────────────────────────┬────────────────┤
│  sidebar     │  breadcrumbs                                        │  ON THIS PAGE  │
│  (sticky,    │  H1                                                 │  (sticky ToC)  │
│  own scroll) │  lead paragraph (the page description)              │                │
│              │  content …                                          │                │
│              │  prev / next                                        │                │
├──────────────┴─────────────────────────────────────────────────────┴────────────────┤
│  footer (full width)                                                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Exact dimensions, breakpoints and the mobile variant are in `02` §5–§7. The layout is **full width**: there is no centred container in the navbar, the page or the footer. The content column absorbs all remaining width.

Pages with `layout: "wide"` in `nav.json` (the Playground, and any demo that needs it) hide the right-rail ToC and give its width to the content column.

## 9. Page metadata

Each page's title and description are written **once**, in its locale file (`meta.title`, `meta.description`), and feed: the `<title>` (`{title} · {Plugin name}`), `meta description`, `og:*`, `twitter:*`, the H1, the lead paragraph, the search index, the sidebar tooltip and the `llms.txt` line. `og:image` is one static image per plugin (`/{{PLUGIN_ID}}/og.png`, 1200×630). Canonical URLs point at the locale's own URL.
