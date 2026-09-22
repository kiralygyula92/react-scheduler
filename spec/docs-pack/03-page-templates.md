# 03 — Page Templates

Every page is built from the same **page frame** and one of the templates below. A template lists its H2 sections **in order**. "Required" sections MUST exist; if there is truly nothing to say, write one honest sentence ("None known." / "Nothing to migrate yet."). Optional sections are omitted, never left empty.

Headings here are English `en` values; each is a translation key in the page's locale file (see `06` §5).

---

## 1. The page frame (every page)

```
<Breadcrumbs/>
<h1>{meta.title}</h1>
<p class="ds-lead">{meta.description}</p>
[page badge, if nav.json declares one]
… sections …
<PrevNext/>
```

- One `<h1>` per page. H2 and H3 only below it for sections; H4 is allowed inside a section, never in the ToC.
- The lead paragraph is the `meta.description` string, unchanged.
- Page components compose doc primitives from `src/shell/doc/` (`Section`, `P`, `List`, `Table`, `Code`, `Demo`, `Callout`, `CardGrid`, `PropsTable`, `Kbd`). Pages never write raw styled markup.

## 2. Template list

| ID | Template | Used by |
|---|---|---|
| T1 | Overview | `/{{PLUGIN_ID}}/` |
| T2 | Getting-started page | Installation, Usage, Requirements, FAQ, Support |
| T3 | AI context | `getting-started/ai-context/` |
| T4 | Versions | `getting-started/versions/` |
| T5 | All features | `all-features/` |
| T6 | Capability page | every feature page |
| T7 | Demos index | `demos/` |
| T8 | Demo page | every scenario demo |
| T9 | Playground | `demos/playground/` (spec in `04` §4) |
| T10 | API index | `api/` |
| T11 | API symbol page | `api/{symbol}/` (generated; spec in `05`) |
| T12 | Customization page | Customization section |
| T13 | Guide | Guides, Integrations |
| T14 | Migration guide | Migration section |
| T15 | Changelog | `discover-more/changelog/` (generated from Changesets) |
| T16 | Simple prose page | Roadmap, Accessibility, License, section index pages |

## 3. Templates

### 3.1 T1 — Overview

Required, in order:

1. **Introduction** — 2–4 short paragraphs: what the plugin is, what it renders with (name the engine peer if there is one), how it is controlled (props, CSS variables, callbacks, slots), and one paragraph stating plainly what it does **not** do.
2. **Why {Plugin name}** — 4–6 bullets, each `**Benefit:** one-sentence explanation`. Always include: accessibility, theming without a UI kit, dependency stance ("zero runtime dependencies" or "only {engine} as a peer"), SSR safety.
3. **Start now** — a card grid of exactly six cards: Installation, Usage, All features, the plugin's defining capability, Customization, API reference.
4. **Licence** — "MIT, with no paid tier and no feature gating. Everything documented on this site is in the package you install."

Length 400–700 words. No demo on this page. It teaches nothing; it routes.

### 3.2 T2 — Getting-started pages

**Installation** (required sections): Install (tabs `npm` / `pnpm` / `yarn` / `bun`, one command each), Peer dependencies (table: package, range, why), Stylesheet (the one import line and where to put it), Engine setup (only if a peer needs a worker/asset, e.g. the PDF.js worker), Verify (a 5-line render that proves it works), Next steps.

**Usage**: Minimal example (complete, copy-pasteable, no ellipses, ≤ 20 lines, rendered as a demo), Controlled and uncontrolled (if the component has state), Common props (6–10 most used, linking to the API page), Next steps.

**Requirements**: Browsers (support matrix table), React versions, TypeScript versions, Frameworks and SSR, Bundle size (from `size-limit` output), Accessibility target.

**FAQ**: one H3 per question, answers 1–4 sentences with links. Must include "Is it free?" (MIT), "Does it work with Next.js?", "Can I use it without the default styles?", "Which languages are built in?".

**Support**: Where to ask (GitHub Discussions), How to report a bug (issue template link, the minimal reproduction expected), Security (how to report privately), Support policy (link to Versions).

### 3.3 T3 — AI context

Reproduces the golden structure exactly (see reference screenshots in the guide):

1. **Prerequisites** — an agentic coding tool (Claude Code, Cursor, Codex or similar) with the repository open.
2. **Installation** — download command: `curl -o docs/{{PLUGIN_ID}}.md https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/llms-full.md`; then the one line to add to `CLAUDE.md` (Claude Code) or `AGENTS.md` (Codex, Cursor and most others): `{Plugin name} documentation, with the source of every example: docs/{{PLUGIN_ID}}.md`. A tool that indexes documentation by URL can take the URL instead.
3. **What is in the file** — every page in reading order with the source of each live example inlined; generated in the same build as the site, so it cannot contradict it; re-download on upgrade.
4. **Which file to use** — table: File · What it holds · Use it when — rows for `llms-full.md`, `llms-full.txt`, `llms.txt`, and "a page's URL with `.md`". Follow with the sentence about context-window size and falling back to `llms.txt`.
5. **Minimal working example** — one realistic prompt that uses the file.
6. **Verify** — one question only the documentation answers (a real edge case of this plugin) so the user can tell whether the agent read the file.
7. **Next steps** — links to Installation, Usage, API reference.

Localized versions link to the locale's own `llms-full.md`.

### 3.4 T4 — Versions

1. **Supported versions** — table: Version · Status · Documentation. Current row links to "This site".
2. **Versioning policy** — Semantic Versioning; Changesets; bullets for Patch / Minor / Major with the 0.x caveat; new behaviour is opt-in; the engine peer range moves only in minor or major releases.
3. **Older versions** — how archived majors are reached (the version select and the URLs from `versions.json`).
4. **Related** — Changelog, Migration.

### 3.5 T5 — All features

Scope sentence, then one H2 per sidebar group (same order as `nav.json`), each a card grid of that group's capability pages (title + the page's `meta.description`). Generated from `nav.json`; the page writes only the scope sentence.

### 3.6 T6 — Capability page

The core template. One capability, one page.

1. **Basics** (required) — opens with a live demo of the simplest working use. Then 1–2 paragraphs.
2. **{Variation axis}** (0–n, H2 each) — one H2 per axis of variation (e.g. "Fit modes", "Step size"), each with a demo or code block. If you cannot name the axis in two words, it is a recipe, not an axis.
3. **Recipes** (optional) — H3 per real-world task, named after the goal ("Open at a specific page"), not the mechanism.
4. **Server and client** (required if the feature has data modes) — how it behaves in each.
5. **Accessibility** (required) — keyboard keys (table), ARIA roles and announcements for this feature.
6. **Customization** (required) — slots, CSS variables and handlers relevant to this feature, linking to the Customization section.
7. **Limitations** (required) — honest constraints and workarounds, or "None known."
8. **API** (required) — links to the API pages of every symbol used on this page (from the page's `symbols` list).

Maximum ~8 H2s. A capability that needs more becomes a group with several pages.

### 3.7 T7 — Demos index

Scope sentence and a card grid: one card per demo page, then the Playground card, then the Theme editor card (if present).

### 3.8 T8 — Demo page

A realistic scenario built from several capabilities (e.g. "Document review", "Account list"). Sections: **Scenario** (2–3 sentences), the demo itself (`layout: "wide"` allowed), **What it uses** (links to the capability pages), **Source** (the full demo source in a code block, collapsed by default).

### 3.9 T9 — Playground

Specified in `04` §4.

### 3.10 T10 — API index

Scope sentence, then tables grouped by kind: Components, Hooks, Functions, Types, CSS variables. Each row: name (link), one-line description. Generated from `content/api/*.json`.

### 3.11 T11 — API symbol page

Specified in `05` §4.

### 3.12 T12 — Customization page

**Overview** page: the override levels from lightest to heaviest (CSS variables → class names → slot props → slots → handlers → headless hooks), each with a two-line example and a link. **Theming**: token list rendered from the API data, dark mode, presets. **CSS variables**: generated table (name, default light, default dark, description). **Slots and overrides**: slot table (generated) and a worked example. **Localization**: the built-in locale packs, how to pass messages, how to add a language.

### 3.13 T13 — Guide

**Goal** (one paragraph), **Before you start** (prerequisites), **Steps** (numbered H3s, each ending in a working state), **Result** (demo or screenshot), **Troubleshooting** (optional), **Related**.

### 3.14 T14 — Migration guide

**Who this is for**, **Summary of changes** (table: Before · After · Action), **Step-by-step** (numbered H3s), **Codemods** (if any), **Removed and renamed** (tables), **Getting help**.

### 3.15 T15 — Changelog

Generated from `packages/{{PACKAGE_DIR}}/CHANGELOG.md` at build time. One H2 per released version (`1.2.0 — 2026-10-04`), H3s `Major changes` / `Minor changes` / `Patch changes`. Changelog entries are **not** translated (they come from Changesets in English); the page frame, headings and intro are. The page carries a one-line note, translated, that entries are in English.

### 3.16 T16 — Simple prose page

H2 sections only, no required structure beyond the page frame. **Accessibility** states the WCAG 2.2 AA target, what is tested, known gaps and how to report issues. **License** reproduces the MIT text in a code block (untranslated) and a translated one-paragraph summary. **Roadmap** lists planned items as `Planned` rows; no dates unless the user supplied them.
