# 09 — Plugin Package Standards

Applies to `packages/{{PACKAGE_DIR}}/`. The goal is a **native, generic, dependency-free, MIT-licensed** React package that can be dropped into any project.

---

## 1. Principles

1. **Native first.** Every feature is written in TypeScript, HTML, CSS and browser APIs unless it genuinely cannot be (§3).
2. **Headless core, thin React adapter.** Logic lives in framework-agnostic TypeScript; React components are a replaceable rendering layer.
3. **Everything visible is overridable** (slots), **everything visual is a token** (CSS variables), **every interaction is interceptable** (handlers).
4. **Generic.** No trace of the source project (§8). Names describe the feature, not a business domain.
5. **Parity, then extension.** The parity layer reproduces the source behaviour (minus listed bugs); extensions are additive and never break parity tests.
6. **Publishable.** ESM + CJS + types, SSR-safe, tree-shakeable, React 18 and 19, measured bundle budgets.

## 2. Licence

- `LICENSE` at the repo root **and** in the package directory: MIT, `Copyright (c) {{YEAR}} {{COPYRIGHT_HOLDER}}`.
- `package.json` → `"license": "MIT"`.
- Every source file MAY carry `// SPDX-License-Identifier: MIT`; none may carry another licence header.
- No code copied from projects under other licences. Code adapted from MIT/permissive sources keeps its notice in `THIRD_PARTY_NOTICES.md` (shipped in `files`).

## 3. Dependency policy

### 3.1 Runtime (`dependencies`, `peerDependencies`)

| Allowed | Condition |
|---|---|
| `react`, `react-dom` | Always, as **peers**: `^18.2.0 \|\| ^19.0.0` |
| One **engine** library (e.g. `pdfjs-dist` for PDF rendering, `three` for WebGL) | Only if the Dossier shows the capability cannot reasonably be reproduced natively (a PDF parser/renderer, a WebGL scene graph). MUST be a **peer** with a documented range, lazily imported where possible, never bundled |
| Anything else | **Not allowed** by default. Requires an ADR (§3.3) proving it cannot be written natively in reasonable effort, plus user approval |

`"dependencies": {}` MUST be empty unless an ADR says otherwise. Examples of things that are **always** written natively: state management, rich-text editing, tables, virtualization, sorting/filtering, date formatting (use `Intl`), sanitization, drag and drop, focus management, i18n, icons, styling, class-name merging, unique ids, debouncing, event emitters, resize/intersection observers.

### 3.2 Licence allowlist (runtime and dev)

| Allowed (SPDX) | Not allowed |
|---|---|
| MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0, CC0-1.0, Unlicense; fonts: OFL-1.1 (site only) | GPL, LGPL, AGPL, MPL (runtime), SSPL, BUSL/BSL, Elastic, Commons Clause, CC-BY-NC, "source-available", custom or missing licences, anything whose licence can be changed or revoked for existing versions |

Apache-2.0 is allowed (e.g. `pdfjs-dist`); it requires keeping its NOTICE when redistributing — which a peer dependency does not do, so no action is needed unless code is copied.

Check with `pnpm licenses list --prod` and `npx license-checker --production --summary --onlyAllow "MIT;ISC;BSD-2-Clause;BSD-3-Clause;0BSD;Apache-2.0;CC0-1.0;Unlicense"` in CI.

### 3.3 ADR for a dependency (`docs/adr/NNNN-dependency-{name}.md`)

```
# NNNN — Dependency: {name}
Status: proposed | accepted (by {{COPYRIGHT_HOLDER}}, date)
Capability: what it provides
Why not native: concrete reasons (size of spec, years of edge cases, security surface)
Licence: SPDX id, link to licence file at the pinned version
Placement: peerDependency | dependency | devDependency
Range: e.g. ">=4.10 <6"
Size impact: min+gz, and whether it is lazily loaded
Maintenance: release cadence, maintainers, last release
Exit plan: what to do if it is abandoned or relicensed
```

### 3.4 State management

No Redux Toolkit, Zustand, Jotai, MobX or similar — in the package **or** the docs site. The package uses a ~40-line internal store (`src/core/store.ts`: `getState`, `setState(updater)`, `subscribe`) exposed to React through `useSyncExternalStore` with selector support. This gives the same benefits without a dependency and keeps state framework-agnostic.

### 3.5 Dev dependencies

Allowed when on the licence allowlist: TypeScript, tsdown, Vitest, Testing Library, Playwright, axe, ESLint, Stylelint, Prettier, Changesets, size-limit, knip, publint, `@arethetypeswrong/cli`, fast-check. Dev tools never appear in the published tarball.

## 4. Architecture

### 4.1 Layout

```
packages/{{PACKAGE_DIR}}/
├─ src/
│  ├─ core/            ← framework-agnostic: state, engine, feature modules, pure utils (no React, no DOM at import time)
│  ├─ react/           ← components, hooks, providers, slots
│  ├─ styles/          ← tokens.css (variables), base.css (structural), theme.css (visual), index.css
│  ├─ locales/         ← en.ts (default, bundled), ro.ts, hu.ts, es.ts, fr.ts, de.ts, pt.ts
│  ├─ index.ts         ← main entry (re-exports react + types)
│  └─ core.ts          ← headless entry
├─ test/{core,react,types,a11y,bench}/
├─ tsdown.config.ts  tsconfig.json  package.json  README.md  LICENSE  CHANGELOG.md
```

### 4.2 Naming conventions (all plugins)

| Pattern | Meaning | Example |
|---|---|---|
| `enableX` | Boolean feature flag | `enableSearch` |
| `defaultX` / `x` + `onXChange` | Uncontrolled / controlled state pair | `defaultPage` / `page` + `onPageChange` |
| `renderX` | Render prop returning `ReactNode` | `renderEmpty` |
| `getXProps` | Prop getter returning props for an element | `getToolbarProps` |
| `slots.X` / `slotProps.X` | Component replacement / props for a slot | `slots.Toolbar` |
| `handlers.onX` | Interaction middleware `(ctx, next) => void` | `handlers.onZoom` |
| `localization` | Partial message object | `localization={ro}` |
| `classNames.x` / `styles.x` | Per-part class name / inline style | `classNames.toolbar` |
| CSS class | `{{CSS_PREFIX}}-` + BEM-ish | `rpv-toolbar__button--active` |
| CSS variable | `--{{CSS_PREFIX}}-` | `--rpv-toolbar-bg` |
| Data attribute | State for CSS | `data-state="open"`, `data-disabled` |

`{{CSS_PREFIX}}` is 2–4 letters derived from the package name and fixed in the Dossier.

### 4.3 Override system (levels, lightest first)

1. **CSS variables** (theme tokens).
2. **`className` / `classNames` / `style` / `styles`** per part.
3. **`slotProps`** — extra props merged into a default slot (event handlers are chained; the slot's own handler can call `event.preventDefault()`-style `preventDefaultBehaviour()`).
4. **`slots`** — replace a part entirely; the replacement receives the computed props and a `Default` component to wrap.
5. **`handlers`** — middleware per interaction: `(ctx, next) => void | Promise<void>`; call `next()` for default behaviour, `next(modifiedCtx)` to alter it, or don't call it to cancel.
6. **Headless** — `use{{COMPONENT}}()` hook(s) and `create{{COMPONENT}}()` core function to build a custom UI.

Slot names, their props types and the handlers list are exported types (`{{COMPONENT}}SlotMap`, `{{COMPONENT}}Handlers`) so the API extractor can document them.

### 4.4 Styling

- Plain CSS, no CSS-in-JS runtime. `styles/index.css` wraps everything in `@layer {{CSS_PREFIX}}` so consumer styles win without `!important`.
- `tokens.css` defines every visual value as a variable on `.{{CSS_PREFIX}}-root` with light defaults and a `[data-theme="dark"]` / `.{{CSS_PREFIX}}-root[data-color-scheme="dark"]` override. A `colorScheme` prop (`'light' | 'dark' | 'system'`) sets it.
- **Unstyled mode**: importing only `base.css` (structural layout) or nothing, plus `unstyled` prop, gives a bare component.
- No global selectors, no styles on `html`/`body`, no `@import` of remote fonts.

### 4.5 SSR and runtime safety

- No access to `window`, `document`, `navigator` or engine globals at module scope. Browser-only work happens in effects or lazily.
- `renderToString` of every component must not throw (tested).
- Engines are loaded with dynamic `import()` inside effects; the component renders a loading state on the server.
- Every component forwards its ref (React 19 `ref` prop; `forwardRef` for 18 compatibility).
- No `console.log` in published code; development warnings behind `process.env.NODE_ENV !== 'production'`.

### 4.6 Localization

- Every user-visible and ARIA string is a key in `{{COMPONENT}}Messages`. `en` is bundled as the default.
- Locale packs for `ro`, `hu`, `es`, `fr`, `de`, `pt` ship as subpath exports (`{{NPM_PACKAGE}}/locales/ro`), tree-shaken when unused. Their strings follow `06` §5.5.
- Numbers and dates are formatted with `Intl` and the `locale` prop.
- Right-to-left: layout uses logical properties (`margin-inline-start`, `inset-inline-end`) so RTL works when a consumer supplies an RTL locale.

## 5. `package.json` (template)

```json
{
  "name": "{{NPM_PACKAGE}}",
  "version": "0.0.0",
  "description": "{{ONE_LINE_DESCRIPTION}}",
  "license": "MIT",
  "author": "{{COPYRIGHT_HOLDER}}",
  "homepage": "https://{{SITE_DOMAIN}}/{{PLUGIN_ID}}/",
  "repository": { "type": "git", "url": "git+{{REPO_URL}}.git", "directory": "packages/{{PACKAGE_DIR}}" },
  "bugs": { "url": "{{REPO_URL}}/issues" },
  "keywords": ["react", "{{KEYWORDS}}"],
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./core": {
      "import": { "types": "./dist/core.d.ts", "default": "./dist/core.js" },
      "require": { "types": "./dist/core.d.cts", "default": "./dist/core.cjs" }
    },
    "./locales/*": {
      "import": { "types": "./dist/locales/*.d.ts", "default": "./dist/locales/*.js" },
      "require": { "types": "./dist/locales/*.d.cts", "default": "./dist/locales/*.cjs" }
    },
    "./styles.css": "./dist/styles/index.css",
    "./base.css": "./dist/styles/base.css",
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0",
    "react-dom": "^18.2.0 || ^19.0.0"
  },
  "dependencies": {},
  "engines": { "node": ">=20" },
  "publishConfig": { "access": "public", "provenance": true },
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "size": "size-limit",
    "lint:pkg": "publint && attw --pack ."
  }
}
```

If an engine peer is approved, add it to `peerDependencies` (and to `peerDependenciesMeta` as optional only if the package works without it).

## 6. Build configuration

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/core.ts', 'src/locales/*.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: 'neutral',
  external: ['react', 'react-dom', 'react/jsx-runtime' /* + engine peer */],
  copy: [{ from: 'src/styles', to: 'dist/styles' }],
});
```

`tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `isolatedDeclarations: true`, `verbatimModuleSyntax`, `jsx: "react-jsx"`, `target: "ES2022"`, `lib: ["ES2023", "DOM", "DOM.Iterable"]`, `moduleResolution: "bundler"`. `isolatedDeclarations` lets the bundler emit `.d.ts` without the TypeScript compiler API. `TODO(user):` verify the tsdown option names against its current docs at scaffold time; record deviations in an ADR.

## 7. Versioning

- Semantic Versioning. Start at `0.1.0`; `1.0.0` when the Dossier's v1.0 scope is complete and audited (§10).
- Changesets: every user-facing change adds a changeset; `changeset version` writes `CHANGELOG.md`; the release workflow publishes (`10` §4).
- Deprecate before removing: a deprecated API keeps working for at least one minor release, emits a development warning, and has a Migration entry.
- Pre-releases use dist-tags `next` (release candidates) and `beta`.

## 8. Zero-reference scan (sanitization gate)

`scripts/check-zero-reference.ts` runs in CI over the **whole repository, including `spec/`**, excluding only `node_modules`, build output and `.git`:

- **Hashed denylist.** The Feature Dossier ships `denylist.sha256.txt`: one SHA-256 per source-specific term, computed as `sha256("{{DENYLIST_SALT}}:" + term.trim().toLowerCase())`. The scanner lower-cases every text file, splits it into tokens (on whitespace and punctuation, but also keeping dotted/hyphenated tokens such as domains whole) and hashes every token and every 2- and 3-token sequence with the same salt. Any hit fails the build with the file and line. The clear-text terms never enter the new repository.
- **Generic patterns**: e-mail addresses other than `@example.com`/`@example.org`, URLs other than the project's own domains and well-known public documentation sites, IPs, `localhost:` ports, JWT-like and key-like strings, absolute file paths.
- **File names and metadata** are scanned too: file and folder names, SVG `<metadata>`/`<title>`, image EXIF (stripped at add time), `package.json` fields, test names and snapshots.
- **Assets**: every image, font, icon and sample file is listed in `SOURCES.md` with its origin and licence.
- The scan must report zero findings. Never "fix" a finding by obfuscating the term; replace the concept with the Dossier's generic name.

## 9. Quality gates

| Gate | Requirement |
|---|---|
| Parity tests | The characterization tests from the Dossier pass against the new implementation |
| Unit coverage | ≥ 90% lines / 85% branches in `core`, ≥ 80% in `react` |
| Type tests | `expectTypeOf` tests for generics, controlled/uncontrolled props, slot and handler types |
| A11y | `vitest-axe` on every component configuration; keyboard tests per the Dossier's a11y spec |
| SSR | `renderToString` test for every component |
| React versions | CI matrix runs the test suite against React 18.3 and React 19 |
| Bundle | `size-limit` budgets from the Dossier (default: core ≤ 12 kB, full ≤ 30 kB min+gz excluding the engine peer) |
| Package | `publint` and `attw` (are-the-types-wrong) report no errors; `npm pack --dry-run` lists only intended files |
| Dead code | `knip` reports zero unused files, exports and dependencies (P4) |
| Licences | §3.2 check passes |
| Zero reference | §8 passes |

## 10. Pre-publish audit (P8)

Before `1.0.0` and every major, write `docs/audit/{version}.md` covering:

1. **Dependencies** — output of the production dependency tree; confirm only React peers plus approved engines.
2. **Rendering** — every demo and Playground configuration in Chromium, Firefox and WebKit, light and dark, 390/1024/1440 widths; list of issues found and fixed.
3. **Performance** — benchmarks from the Dossier's budgets; React Profiler notes for re-render counts in the main interactions; memory check for leaks (mount/unmount 100 times).
4. **Gaps** — Dossier features not implemented, each with a decision (ship later / drop) and a `GAPS.md` entry.
5. **Bugs and blockers** — open issues, each triaged.
6. **API review** — naming consistency with §4.2, no `any` in public types, no dead parameters.
7. **Sign-off** — checklist of §9 gates with CI run links.
