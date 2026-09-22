# 04 — Demos, Code Blocks and the Playground

Demos inside documentation pages are **rendered components with static source**. There is no live code editor anywhere on the site. The Playground is the only place where users change props interactively, and it does so through generated controls, not through editable code.

---

## 1. Demo block (`<Demo>`)

```tsx
<Demo id="zoom-basic" component={ZoomBasic} source={ZoomBasicSource} height={420} />
```

- `component` is imported from `src/demos/{capability}/{Name}.tsx`.
- `source` is the **same file** imported as raw text (`import ZoomBasicSource from '../../demos/zoom/ZoomBasic.tsx?raw'`). What the user sees is exactly what runs. Never maintain a second copy of demo code.
- Layout: a frame (`1px solid var(--ds-border)`, `--ds-radius-xl`, padding 24px, background `--ds-bg`) containing the rendered demo, followed by a toolbar row and the collapsible source.
- **Toolbar** (right-aligned, 32px buttons, labels from `common.json`): `Show code` / `Hide code` (toggles the source, `aria-expanded`, `aria-controls`), `Copy` (copies the full source; shows "Copied" for 2s with an `aria-live="polite"` announcement), `Reset` (remounts the demo with a new `key`).
- Source is collapsed by default. When expanded it renders with the Code block below, max-height 480px with an "Expand" button that removes the limit.
- Source shown is TypeScript only. No TS/JS toggle, no "open in sandbox".
- Demos are wrapped in an error boundary that shows a themed error message instead of breaking the page.
- Demos follow the site theme (`data-theme`) and the site locale: a demo passes the plugin's locale pack for the current language, so a Romanian page shows the plugin's Romanian UI strings.
- Demo text content (sample data labels, placeholder text) comes from `locales/{lng}/demos.json`, so demos are translated too. Sample data values that are data (names, numbers, dates) stay the same across locales but are formatted with the locale.
- A demo file is ≤ 80 lines and self-contained: imports only from the plugin package, React, `src/demos/_shared/` (sample data, sample assets), and the demo i18n hook.
- Demo assets (sample PDFs, images, datasets) are generated or authored in-repo and are **copyright-free**: generated data, public-domain documents, or files created for the repo. Their origin is recorded in `apps/docs/public/samples/SOURCES.md`.

## 2. Code block (`<Code>`)

```tsx
<Code lang="tsx" title="App.tsx" highlight="3-5">{source}</Code>
```

- Languages: `tsx`, `ts`, `jsx`, `js`, `json`, `bash`, `css`, `html`, `md`, `text`.
- Highlighting is done by the in-house tokenizer in `src/lib/highlight/` **at build time** (prerender), so highlighted HTML ships in the static page and no highlighter runs in the browser for page content. The Playground's generated code is highlighted at runtime by the same tokenizer (it is small).
- Token classes: `ds-t-keyword`, `ds-t-string`, `ds-t-number`, `ds-t-comment`, `ds-t-function`, `ds-t-type`, `ds-t-tag`, `ds-t-attr`, `ds-t-punct`, `ds-t-operator`, `ds-t-property`, coloured through `--ds-code-*` tokens.
- Optional `title` bar (13px, mono, `--ds-text-secondary`, bottom border) and optional line highlight (`highlight="3-5,9"`, background `--ds-accent-soft`).
- Copy button top-right (same behaviour as the demo toolbar).
- Shell commands use `bash` and never include the `$` prompt, so copying works.
- Package-manager commands are shown as a tab group: `npm` · `pnpm` · `yarn` · `bun`. The chosen tab persists in `localStorage['ds:pm']` and syncs across every tab group on the site.
- Code is never translated. Comments in code samples are English in every locale.

## 3. Callouts and anti-patterns

`<Callout tone="info|success|warning|danger" titleKey="...">`. Anti-patterns are shown as code inside a `danger` callout headed "Don't", followed by the correct code in a `success` callout headed "Do". Never describe an anti-pattern only in prose.

## 4. Playground (`demos/playground/`)

The Playground exposes **every public prop** of the plugin's main component so a user can try each option without writing code. The structure follows the React Tablekit playground (golden for this page). Plugins whose main output is highly visual (3D, canvas) use the same structure with the "stage" variant in §4.6.

### 4.1 Page layout

`layout: "wide"` (no ToC). Top to bottom:

```
Breadcrumbs · H1 "Playground" · lead
Intro paragraph (controls are generated from {Component}Props, so they cannot drift)
┌─ Controls panel (full content width) ──────────────────────────────────────┐
│ [Reset all]                                                                 │
│ ▼ Setup           (site-level scenario controls, grid of labelled controls)  │
│ Props {N} · {M} changed   [ filter props……………………… ]   [☐ Changed only]   │
│ ▼ {Category A} ({count}, {changed} changed)   → grid of prop controls        │
│ ▶ {Category B} ({count})                                                      │
│ ▶ Code only ({count})   (props that cannot be edited with a control)         │
└─────────────────────────────────────────────────────────────────────────────┘
┌─ Component (full content width) ────────────────────────────────────────────┐
│   the live component, re-rendered on every change                           │
└─────────────────────────────────────────────────────────────────────────────┘
┌─ Code (full content width) ─────────────────────────────────────────────────┐
│   generated JSX for exactly the props that differ from defaults  [Copy]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

The controls are **above** the component and the component is **below**, each spanning the full content width (see O11). Never put controls in a side column next to the component.

### 4.2 Controls panel

- Frame: `1px solid var(--ds-border)`, `--ds-radius-xl`, background `--ds-bg-subtle`. Rows separated by `1px solid var(--ds-border)`; row padding 16px 20px.
- **Setup** group: site-level controls that are not props but set up the scenario: dataset / sample document, data size, data source (memory / mock server), mock latency and failure rate (if the plugin fetches), theme preset, language (defaults to the site locale), and any required initial state. Grid `repeat(auto-fill, minmax(260px, 1fr))`, each cell `label` + control on one line.
- **Props header row**: `Props {N}` (600) and `· {M} changed` in `--ds-accent`; a filter input that matches prop names and descriptions; a `Changed only` checkbox.
- **Category groups**: props grouped by the `@category` TSDoc tag from the API data (e.g. Appearance, Data, Behaviour, Accessibility, Events). Each group is a disclosure (`<details>` semantics, custom styled) with the count and changed count. Groups with changed props start expanded.
- **Prop control card** (grid `repeat(auto-fill, minmax(300px, 1fr))`, gap 12px): prop name in mono 13px 600 with a subtle background, a `Reset` link on the right when changed, the control, and the type in a small mono pill (`boolean`, `'fit' | 'width'`, `number`). Changed cards get a `2px solid var(--ds-focus)` outline on the control.
- **Control mapping** from the prop's type in the API JSON:

| Prop type | Control |
|---|---|
| `boolean` | select: `default ({value})` / `true` / `false` |
| string literal union | select with each literal plus `default` |
| `number` | number input; `@min`/`@max`/`@step` tags respected; range slider added when both bounds exist |
| `string` | text input |
| string or number arrays of literals | multi-select checkbox list |
| CSS colour (`@format color`) | colour input + text input |
| object with only primitive fields | nested fieldset of the above |
| function, `ReactNode`, component, ref, complex object | not editable; listed in **Code only** with its type and description |
| event callbacks (`on*`) | not editable; the Playground wires each one to an **event log** (see §4.4) |

- Values persist in the URL (`?p=` base64url JSON of changed props only), so a configuration can be shared. `Reset all` clears the URL state.

### 4.3 Component area

- Frame: `1px solid var(--ds-border)`, `--ds-radius-xl`, padding 16px, min-height 320px, full content width.
- Wrapped in the demo error boundary. Invalid combinations show the plugin's own error state or a themed message; they never crash the page.
- Re-renders on every control change; heavy props (datasets, documents) are memoized so unrelated changes do not reload them.

### 4.4 Code panel and event log

- **Code**: generated JSX for the component with only the changed props, plus the imports and the stylesheet import. Highlighted, with `Copy`. Updates live.
- **Event log** (collapsed by default, below the code): the last 50 callback invocations with timestamp, callback name and a compact JSON of the arguments. `Clear` button.

### 4.5 Generation and drift

- The control list is generated at build time from `src/content/api/{Component}.json` (see `05`). A prop added to the type appears in the Playground automatically; a removed one disappears.
- `check-conformance.ts` fails if a public prop of the main component is missing from the Playground's control list or the Code-only list.
- Prop descriptions shown in the filter and tooltips come from `locales/{lng}/api.json`, so the Playground is translated.

### 4.6 Stage variant (visual plugins)

For plugins whose value is visual (3D globe, canvas, viewers), the component area becomes a **stage**: height `min(70vh, 720px)`, background `--ds-bg-subtle`, and the controls panel keeps its place above. Everything else (grouping, controls, code, event log, URL state) is identical. The choice between standard and stage is declared once in `nav.json` (`"playground": { "variant": "standard" | "stage" }`).

### 4.7 Theme editor (optional page)

If the plugin exposes CSS variables, `demos/theme-editor/` shows the same controls-above / preview-below layout with one control per CSS variable (colour, length, number) grouped by the variable's category, a light/dark switch, and a generated CSS block to copy.
