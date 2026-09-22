# 05 — API Reference Specification

Reference documentation is **generated, never hand-written**. The TypeScript declarations of the package are the single source of truth for names, types, defaults and structure. Human prose lives in locale files and is keyed by symbol and member, so regeneration never overwrites translations.

---

## 1. Inputs

| Input | Source |
|---|---|
| Exported symbols | `packages/{{PACKAGE_DIR}}/src/index.ts` and every subpath entry in the package `exports` map |
| Types, props, defaults | TypeScript types + TSDoc (`@defaultValue`, `@category`, `@since`, `@deprecated`, `@see`, `@example`, `@min`, `@max`, `@step`, `@format`) |
| CSS variables | `packages/{{PACKAGE_DIR}}/src/styles/tokens.css`, each declaration preceded by a `/** @category … @description … */` comment |
| Slots | The package's `SlotMap` type (see `09` §4.3) |
| Class names | The package's exported `classNames` constant |

## 2. Extractor (`apps/docs/scripts/extract-api.ts`)

- Uses the **TypeScript 6 compiler API** through an npm alias, because TypeScript 7.0 ships without a stable programmatic API:

  ```json
  "devDependencies": { "typescript": "^7.0.0", "typescript-api": "npm:typescript@^6.0.0" }
  ```

  ```ts
  import ts from 'typescript-api';
  ```

  `TODO(user):` switch to the TS 7 API once it is declared stable; the output format below does not change.
- Runs before the site build (`pnpm --filter docs api`), writes `apps/docs/src/content/api/{symbol}.json` (git-ignored) and `index.json`.
- Also writes `api-strings.en.json`: every description found in TSDoc, keyed as below. This is the **English seed** for `locales/en/api.json`.

### 2.1 Output schema (per symbol)

```jsonc
{
  "name": "PdfViewer",
  "kind": "component",                 // component | hook | function | type | constant
  "importPath": "{{NPM_PACKAGE}}",     // or a subpath
  "since": "1.0.0",
  "deprecated": null,
  "descriptionKey": "api.PdfViewer.description",
  "props": [
    {
      "name": "zoom",
      "type": "number | 'page-fit' | 'page-width'",
      "typeKind": "union",             // boolean | number | string | literal-union | union | function | node | object | array
      "literals": ["page-fit", "page-width"],
      "default": "'page-width'",
      "required": false,
      "category": "Appearance",
      "min": 0.25, "max": 8, "step": 0.25,
      "descriptionKey": "api.PdfViewer.props.zoom",
      "since": "1.0.0",
      "deprecated": null
    }
  ],
  "slots":   [{ "name": "Toolbar", "propsType": "ToolbarSlotProps", "descriptionKey": "api.PdfViewer.slots.Toolbar" }],
  "cssVars": [{ "name": "--rpv-toolbar-bg", "light": "#fff", "dark": "#111", "category": "Toolbar", "descriptionKey": "api.cssVars.--rpv-toolbar-bg" }],
  "classes": [{ "name": "rpv-toolbar", "descriptionKey": "api.classes.rpv-toolbar" }],
  "returns": null,                     // hooks and functions
  "params":  [],                       // hooks and functions
  "usedBy": ["zoom", "fit-modes"],     // capability page ids, computed by inverting each page's `symbols`
  "sourcePath": "packages/{{PACKAGE_DIR}}/src/react/PdfViewer.tsx"
}
```

## 3. Strings and translation

- `locales/en/api.json` holds every `descriptionKey`. The extractor **adds** missing keys from TSDoc and **never overwrites** existing values (so edited English prose survives).
- The six other `locales/{lng}/api.json` files MUST contain every key in the English file (`check-i18n.ts` enforces it). Type strings, prop names, defaults and code are never translated.
- A key whose English source changed since the translation was written is detected by storing a hash of the English value next to each translation in `locales/{lng}/.api-sources.json`; `check-i18n.ts` reports stale translations as errors.

## 4. Symbol page rendering (T11)

Page frame, then, in order:

1. **Import** — code block with the import line(s) for every entry point exporting the symbol.
2. **Demos** — links to every capability page in `usedBy`.
3. **Props** (components) / **Parameters** and **Returns** (hooks, functions) — table: Name · Type · Default · Description. Required props are marked with a `*` and a visually hidden "required". Long union types wrap inside the cell; very long types collapse behind a "Show type" button. Deprecated rows are struck through with the deprecation note.
4. **Slots** — table: Slot · Props type · Description.
5. **CSS variables** — table: Variable · Light · Dark · Description.
6. **Class names** — table: Class · Description.
7. **Source** — a link to the source file on GitHub at the released tag.

Rows are rendered in the order declared in the source, not alphabetically, so related props stay together. Anchors: `#prop-{name}`, `#slot-{name}`, `#css-{name}`.

## 5. Consumers of the API data

| Consumer | Uses |
|---|---|
| API symbol pages | Everything |
| API index | name, kind, descriptionKey |
| Capability page "API" section | `symbols` from the page → links |
| Customization pages | cssVars, slots, classes |
| Playground | props (type, literals, bounds, category, default) |
| Theme editor | cssVars |
| `llms-full.md` and `.md` twins | Rendered as Markdown tables |
| Search index | Symbol names and prop names are indexed |

## 6. Drift checks (CI)

- Every exported symbol has a JSON file and a page in `nav.json` under Reference.
- Every `descriptionKey` exists in all seven locale `api.json` files and is non-empty.
- No hand-written props tables exist in `content/pages/**` (`check-conformance.ts` fails on `<table>` or `<PropsTable data={[...]}>` with literal rows).
- Every public prop of the main component appears in the Playground (`04` §4.5).
