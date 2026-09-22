# 02 — Design System (docs site)

Every value here is **normative** and is implemented verbatim in `11-docs-shell-reference/tokens.css` and `shell.css`. If this file and those CSS files ever disagree, the CSS files win and this file gets corrected.

The look is modelled on the golden site (React PDF Viewer, September 2026) with the later corrections from `08` applied. Values were calibrated from reference screenshots. `TODO(user):` if a value looks off against your golden build, change it **in the pack** once, then regenerate every site — never per site.

All shell classes use the `ds-` prefix (docs shell). All tokens use `--ds-`. The plugin's own CSS uses its own prefix and never collides.

---

## 1. Principles

1. **Full width.** No centred container anywhere. The navbar spans the viewport; the sidebar is flush left; the content column takes all remaining width.
2. **Condensed.** Documentation is read at length; spacing is compact and type is modest. Do not scale anything up "for breathing room".
3. **Two themes, same geometry.** Light and dark change colours only; no dimension changes between themes.
4. **Tokens only.** Every colour, font, radius and duration in the shell is a `var(--ds-*)`. Fixed component metrics from this file may appear as raw pixels in `shell.css`. A lint rule (see `07` §6, C9) fails on raw colours and durations anywhere outside `tokens.css`.

## 2. Colour tokens

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--ds-bg` | `#FFFFFF` | `#0B1120` | Page, navbar, sidebar, drawer |
| `--ds-bg-subtle` | `#F8FAFC` | `#0F172A` | Code blocks, table headers, search button, cards |
| `--ds-bg-muted` | `#F1F5F9` | `#1E293B` | Hover backgrounds, inline code |
| `--ds-bg-elevated` | `#FFFFFF` | `#111A2E` | Dialogs, menus, popovers |
| `--ds-bg-input` | `#FFFFFF` | `#0B1120` | Text inputs, selects (always themed; see O13) |
| `--ds-border` | `#E2E8F0` | `#1E293B` | Dividers, outlines |
| `--ds-border-strong` | `#CBD5E1` | `#334155` | Input borders, hovered cards |
| `--ds-text` | `#0F172A` | `#E2E8F0` | Headings, body |
| `--ds-text-secondary` | `#475569` | `#94A3B8` | Lead text, sidebar items, breadcrumbs, ToC |
| `--ds-text-tertiary` | `#5B6B82` | `#8494AA` | Group labels, captions, footer fine print |
| `--ds-accent` | `#1D4ED8` | `#7DA2FF` | Links, active sidebar item text, active ToC item |
| `--ds-accent-hover` | `#1E40AF` | `#A5BFFF` | Link hover |
| `--ds-accent-soft` | `#EEF4FF` | `#16213D` | Active sidebar item background, active search result |
| `--ds-focus` | `#2563EB` | `#7DA2FF` | Focus rings (2px, offset 2px) |
| `--ds-backdrop` | `rgba(15,23,42,0.45)` | `rgba(2,6,23,0.65)` | Dialog and drawer backdrop |
| `--ds-info` / `--ds-info-soft` | `#1D4ED8` / `#EFF6FF` | `#7DA2FF` / `#131D35` | Info callout |
| `--ds-success` / `--ds-success-soft` | `#15803D` / `#F0FDF4` | `#4ADE80` / `#0F2A1C` | Success callout |
| `--ds-warning` / `--ds-warning-soft` | `#B45309` / `#FFFBEB` | `#FBBF24` / `#2A2110` | Warning callout |
| `--ds-danger` / `--ds-danger-soft` | `#B91C1C` / `#FEF2F2` | `#F87171` / `#2A1414` | Error callout, "don't" code |

Syntax highlighting tokens (`--ds-code-*`) are listed in `tokens.css`.

Contrast: every text/background pair above meets WCAG 2.2 AA (4.5:1 for body, 3:1 for large text and UI). `07` §2 tests this automatically.

## 3. Typography

| Token | Value |
|---|---|
| `--ds-font-sans` | `"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (Inter self-hosted, OFL-1.1) |
| `--ds-font-mono` | `ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace` |

| Role | Size / line-height / weight | Extra |
|---|---|---|
| H1 | 36px / 1.15 / 700 | letter-spacing −0.02em; margin 8px 0 12px |
| Lead (page description) | 18px / 1.55 / 400 | `--ds-text-secondary`; margin-bottom 32px |
| H2 | 26px / 1.25 / 700 | letter-spacing −0.01em; margin 48px 0 12px |
| H3 | 19px / 1.35 / 600 | margin 32px 0 8px |
| H4 | 16px / 1.4 / 600 | margin 24px 0 8px |
| Body | 15px / 1.65 / 400 | paragraph margin 0 0 14px |
| Small | 13px / 1.5 / 400 | captions, table fine print |
| Code (block and inline) | 13px / 1.6 | inline code is 0.875em of its context |
| Navbar wordmark | 17px / 1 / 700 | `--ds-text` |
| Sidebar section header | 15px / 1.3 / 700 | `--ds-text` |
| Sidebar item | 14px / 1.35 / 400 (active 600) | `--ds-text-secondary` (active `--ds-accent`) |
| Group label (sidebar) and ToC title | 11px (ToC 12px) / 1.2 / 700 | uppercase, letter-spacing 0.08em |
| ToC item | 13px / 1.4 / 400 (active 500) | |
| Breadcrumb | 13px / 1.4 / 400 | never underlined |
| Table header | 12px / 1.3 / 700 | uppercase, letter-spacing 0.06em, `--ds-text-secondary` |

Mobile (< 600px): H1 28px, H2 22px, H3 18px, lead 16px. Nothing else changes.

## 4. Space, radius, shadow, motion

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--ds-space-1` | 4px | | `--ds-radius-sm` | 4px (kbd, inline code) |
| `--ds-space-2` | 8px | | `--ds-radius-md` | 6px (sidebar items, buttons, inputs) |
| `--ds-space-3` | 12px | | `--ds-radius-lg` | 8px (code blocks, search button, tables) |
| `--ds-space-4` | 16px | | `--ds-radius-xl` | 12px (dialogs, cards, demo frames) |
| `--ds-space-5` | 24px | | `--ds-radius-pill` | 999px (version select) |
| `--ds-space-6` | 32px | | `--ds-shadow-popover` | `0 8px 24px rgba(15,23,42,.12)` light / `0 8px 24px rgba(0,0,0,.5)` dark |
| `--ds-space-7` | 40px | | `--ds-duration` | 150ms, `ease` |
| `--ds-space-8` | 48px | | Reduced motion | all durations 0ms under `prefers-reduced-motion: reduce` |

## 5. Layout metrics

| Token | Value |
|---|---|
| `--ds-navbar-h` | 64px (≥ 900px), 56px (< 900px) |
| `--ds-sidebar-w` | 280px |
| `--ds-toc-w` | 240px |
| `--ds-content-px` | 40px (≥ 1280px), 32px (900–1279px), 16px (< 900px) |
| `--ds-content-pt` | 32px |
| `--ds-scroll-offset` | `calc(var(--ds-navbar-h) + 16px)` (anchor `scroll-margin-top`) |

Grid (desktop ≥ 1280px): `grid-template-columns: var(--ds-sidebar-w) minmax(0, 1fr) var(--ds-toc-w)`. The content column has **no max-width** (see O1). Prose remains readable because the sidebar and ToC take 520px and the base size is 15px; demos, tables and the Playground benefit from the width.

## 6. Shell components (visual spec)

### 6.1 Navbar (≥ 900px)

- Sticky, top 0, height `--ds-navbar-h`, background `--ds-bg`, `border-bottom: 1px solid var(--ds-border)`, padding `0 24px`, `z-index: 40`. Full width; no inner container.
- **Left:** wordmark (plugin display name as text, links to the Overview; no logo square, no icon), then 16px gap, then the **version select**: height 32px, padding `0 32px 0 14px`, `--ds-radius-pill`, `1px solid var(--ds-border)`, 13px, chevron icon on the right, label `v{major}.{minor}`.
- **Right, in this order, 8px gaps:**
  1. **Search button**: width 240px, height 36px, `--ds-radius-lg`, `1px solid var(--ds-border)`, background `--ds-bg-subtle`; search icon 16px, label "Search" in `--ds-text-secondary` 14px, and a `kbd` showing `/` on the right (12px, 1px border, radius 4px, padding 0 6px).
  2. **GitHub** icon button: 36×36px, icon 20px, **no border**, radius `--ds-radius-md`, hover background `--ds-bg-muted`.
  3. **Theme toggle**: identical icon button, **no border** (see O8). Shows a moon in light theme and a sun in dark theme.
  4. **Language menu**: icon button with a globe icon and the uppercase locale code (e.g. `EN`, 12px 600), **no border**. Opens a menu listing the seven native names; the current one is marked with a check and `aria-current="true"`.

### 6.2 Navbar (< 900px, mobile)

- Height 56px, padding `0 12px`.
- **Left:** hamburger button (40×40, three-line icon, no border, `aria-label` from `common.json`, `aria-expanded`, `aria-controls="ds-drawer"`), wordmark (16px), version select (height 30px).
- **Right:** search as an **icon button** 36×36 with `1px solid var(--ds-border)` and background `--ds-bg-subtle`; GitHub; theme; language (icon only, code hidden below 400px).
- No "Browse documentation" bar in the page (see O10).

### 6.3 Sidebar

- Sticky under the navbar, height `calc(100dvh - var(--ds-navbar-h))`, its own vertical scroll (thin scrollbar), `border-right: 1px solid var(--ds-border)`, padding `24px 16px 32px 24px`.
- **Section header**: a `<button>` spanning the full width, 15px 700, padding `8px 12px`, radius `--ds-radius-md`, `aria-expanded`. Clicking toggles the section (see O4). Hover background `--ds-bg-muted`. No chevron. Headers are 4px apart when collapsed; an expanded section has 8px below its last item.
- The section containing the current page is expanded on load. Other sections keep whatever state the user gave them for the session (`sessionStorage` key `ds:sidebar`).
- **Items**: links, 14px, padding `7px 12px`, **indented 16px** relative to the section header text (see O5), radius `--ds-radius-md`, colour `--ds-text-secondary`. Hover: background `--ds-bg-muted`, colour `--ds-text`. **Active**: background `--ds-accent-soft`, colour `--ds-accent`, weight 600, `aria-current="page"`.
- **Group labels** (e.g. `CORE FEATURES`): 11px 700 uppercase, letter-spacing 0.08em, `--ds-text-tertiary`, aligned with item text, margin `16px 0 4px`. Not interactive.
- **Badges**: 10px 700 uppercase pill after the item label, `--ds-accent-soft` background and `--ds-accent` text for `new`; `--ds-bg-muted` for `preview` and `beta`; `--ds-danger-soft` for `deprecated`.

### 6.4 Mobile drawer

- Opens below the mobile navbar (`top: var(--ds-navbar-h)`), `id="ds-drawer"`, full width under 600px and 320px wide from 600px to 899px, height the rest of the viewport, own scroll, background `--ds-bg`.
- Contains exactly the sidebar component (same markup, same behaviour).
- Backdrop `--ds-backdrop` covers the page (not the navbar) from 600px up.
- Closes on: route change, Esc, backdrop click, hamburger click. Focus is trapped inside while open and returns to the hamburger when closed. Body scroll is locked while open.

### 6.5 Breadcrumbs

`{Plugin name} › {Section}` (capability pages: `{Plugin name} › Features › {Group}`). 13px, `--ds-text-secondary`, separator `›` with 8px either side. Every crumb except the last is a link. **No underline in any state** (see O7); hover changes colour to `--ds-text`. Margin-bottom 12px.

### 6.6 Table of contents ("On this page")

- Sticky, top `calc(var(--ds-navbar-h) + 32px)`, max-height the viewport minus that, own scroll, padding-right 24px.
- Title from `common.json` (`toc.title`), 12px 700 uppercase, letter-spacing 0.08em, `--ds-text-secondary`, margin-bottom 12px.
- The list has `border-left: 1px solid var(--ds-border)`.
- Item: 13px, `--ds-text-secondary`, padding `6px 0 6px 16px`. H3 entries have padding-left 28px.
- **Active item** (scroll-spy): colour `--ds-accent`, weight 500, and a 2px `--ds-accent` bar that overlays the list border (`box-shadow: inset 2px 0 0 var(--ds-accent)`). **No background and no border-radius** (see O6).
- Includes H2 and H3 only. Hidden when a page has fewer than two headings and on `layout: "wide"` pages.

### 6.7 Search dialog

- Opens from the search button, `/`, `Ctrl+K` and `⌘K`. Modal dialog (`role="dialog"`, `aria-modal`, labelled by its title).
- Backdrop `--ds-backdrop`. Panel: width `min(640px, calc(100vw - 32px))`, top 12vh, background `--ds-bg-elevated`, `1px solid var(--ds-border)`, `--ds-radius-xl`, padding 16px, `--ds-shadow-popover`.
- Header: title "Search" 16px 600 and a close icon button.
- Input: height 48px, background **`--ds-bg-input`** (never hard-coded white; see O13), `2px solid var(--ds-focus)` when focused, radius `--ds-radius-lg`, 16px text, search icon 18px, placeholder in `--ds-text-tertiary`.
- Results: max-height 60vh, grouped by section; each result shows the page title (14px 600), the breadcrumb (12px tertiary) and a snippet (13px secondary) with matches in `<mark>` (background `--ds-accent-soft`, colour inherit). The active result has background `--ds-accent-soft`. ↑/↓ moves, Enter opens, Esc closes. Results link to headings where the match is in a section.
- Empty and no-result states come from `common.json`.

### 6.8 Content elements

| Element | Spec |
|---|---|
| Link | `--ds-accent`, underline, `text-underline-offset: 3px`, thickness 1px; hover `--ds-accent-hover` |
| Inline code | mono 0.875em, background `--ds-bg-muted`, padding `2px 6px`, `--ds-radius-sm` |
| Code block | background `--ds-bg-subtle`, `1px solid var(--ds-border)`, `--ds-radius-lg`, padding `16px 20px`, 13px/1.6, horizontal scroll inside; copy button top-right (appears on hover and on focus-within, always visible on touch) |
| Table | Wrapped in an `overflow-x: auto` container. Full width, header row background `--ds-bg-subtle`, header text per §3, cell padding `12px 16px`, `border-bottom: 1px solid var(--ds-border)` per row, no vertical borders |
| Lists | 20px left padding, 6px between items; nested lists use a different marker (`disc` → `circle` → `square`) and show **one** marker per item |
| Callout | 3px left border in the tone colour, tone-soft background, radius `--ds-radius-md`, padding `12px 16px`, icon 16px, title 14px 600 |
| Card grid ("Start now") | `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`, gap 12px; card `1px solid var(--ds-border)`, `--ds-radius-xl`, padding 16px, title 15px 600, text 13px secondary; hover border `--ds-border-strong` |
| Prev / next | Two link cards at the end of every page, same card style, label (12px tertiary, "Previous"/"Next") above the page title (15px 600 accent) |
| `kbd` | 12px mono, `1px solid var(--ds-border-strong)`, radius `--ds-radius-sm`, padding `0 6px` |
| Horizontal rule | `1px solid var(--ds-border)`, margin 32px 0 |

### 6.9 Form controls (Playground, theme editor, demo toolbars)

Condensed by default (see O9): height 32px, font 13px, padding `0 10px`, radius `--ds-radius-md`, background `--ds-bg-input`, `1px solid var(--ds-border-strong)`, focus ring `--ds-focus`. Labels 13px 500. Checkbox and radio 16px, vertically centred with their label (`align-items: center`). Buttons: height 32px, padding `0 12px`, 13px 500; secondary variant uses border and `--ds-bg`; primary variant uses `--ds-accent` background with white text.

### 6.10 Footer

Full width, `border-top: 1px solid var(--ds-border)`, padding `40px var(--ds-content-px) 24px`. Four columns (`Product`, `Resources`, `Explore`, `Project`) in a grid `repeat(auto-fit, minmax(160px, 1fr))`, heading 13px 700, links 13px `--ds-text-secondary` with 8px spacing. Bottom row: `MIT licensed. {Plugin name} v{version}.` (12px tertiary) on the left; `GitHub` and `llms.txt` links on the right. Footer contents are generated from `nav.json` and `common.json`, identical structure in every plugin.

## 7. Breakpoints

| Name | Range | Layout |
|---|---|---|
| `mobile` | < 900px | Navbar mobile variant, sidebar in drawer, no ToC, single column |
| `tablet` | 900–1279px | Sidebar + content; ToC hidden |
| `desktop` | ≥ 1280px | Sidebar + content + ToC |

Media queries use exactly these three ranges. No other breakpoints are introduced in the shell.

## 8. Theming behaviour

- Initial theme: `localStorage['ds:theme']` if set, otherwise `prefers-color-scheme`.
- A blocking inline script in `<head>` sets `data-theme` on `<html>` before first paint, so there is no flash.
- The toggle switches between light and dark and persists the choice. The theme applies to the shell **and** to every demo (demos read the same `data-theme` and map it to the plugin's theme props or CSS variables).
- `meta[name="theme-color"]` is updated to `--ds-bg` of the active theme.

## 9. Icons

Inline SVG components in `src/shell/icons.tsx`, 24×24 viewBox, `stroke="currentColor"`, 1.75 stroke width, `aria-hidden="true"`: search, github (single-path mark), sun, moon, globe, chevron-down, menu, close, copy, check, external-link, info, warning, success, error. No icon library.
