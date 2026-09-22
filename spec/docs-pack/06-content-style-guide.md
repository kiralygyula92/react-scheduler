# 06 — Content Style Guide and Translation Model

---

## 1. Voice

- Plain, direct, technical English (the `en` source). Short sentences. Present tense. Second person ("you").
- Say what something does before why it exists. Never open a page with architecture or philosophy.
- No marketing voice: no "blazing", "seamless", "powerful", "effortless", "revolutionary". No exclamation marks.
- No invented facts: no metrics, benchmarks, download counts, testimonials or compatibility claims that were not measured in this repo. Unknowns go to `GAPS.md`.
- British or American spelling is chosen once per plugin in `AGENTS.md` and used consistently (`TODO(user):` default American).

## 2. Headings and names

- Sentence case for all headings ("Page navigation", not "Page Navigation").
- Capability page titles are the capability's noun ("Zoom", "Column pinning"), never a sentence.
- Recipes are named after the user's goal ("Open at a specific page"), not the mechanism ("Using initialPage").
- The plugin's display name (`{{PLUGIN_DISPLAY_NAME}}`) is written exactly the same way everywhere; the package name (`{{NPM_PACKAGE}}`) appears only in code and install commands.
- Component, prop, hook, CSS variable and file names are always in `code`.

## 3. Examples

- Every example is complete and runnable: imports included, no `...`, no "configure as needed".
- Example data is generic and copyright-free: invented people, invented companies (`Northwind`-style names are fine only if invented here; prefer neutral ones like "Acme Tools" or "Harbor Logistics"), generated values. **Never** data, names, domains or screens from the source project.
- Example variable names are domain-neutral (`rows`, `document`, `items`, `value`), not taken from the source project.

## 4. Sanitization in content

Before a page is considered done, it passes the zero-reference scan (`09` §8). The Feature Dossier's "reference-leak inventory" lists every term that must never appear; the scan uses that list plus generic patterns (internal domains, emails, API paths, ticket IDs).

## 5. Translation model (full content translation)

All seven locales are **complete**. No page, heading, paragraph, table cell, button label, alt text, demo string or error message may appear only in English, with two exceptions: code (including code comments) and Changelog entries.

### 5.1 Where text lives

| Text | File |
|---|---|
| Shell (navbar, sidebar chrome, search, ToC title, footer, buttons, errors, 404) | `locales/{lng}/common.json` (seeded verbatim from `11-docs-shell-reference/locales/`) |
| Sidebar labels for plugin-specific pages and groups | `locales/{lng}/nav.json` |
| Page prose | `locales/{lng}/pages/{section}/{slug}.json` |
| Demo UI strings and sample labels | `locales/{lng}/demos.json` |
| API descriptions | `locales/{lng}/api.json` (see `05` §3) |

### 5.2 How a page is written

Page components contain **structure only**. Every user-visible string is a key.

```tsx
// src/content/pages/getting-started/installation.tsx
import { Page, Section, P, List, Code, Callout } from '~/shell/doc';

export const symbols = ['PdfViewer'];

export default function Installation() {
  return (
    <Page ns="pages/getting-started/installation">
      <Section id="install" titleKey="install.title">
        <P k="install.p1" />
        <Code lang="bash" tabs="pm">{'{{NPM_PACKAGE}}'}</Code>
      </Section>
      <Section id="peer-dependencies" titleKey="peers.title">
        <P k="peers.p1" />
        <List k="peers.items" />
      </Section>
    </Page>
  );
}
```

```json
// src/locales/en/pages/getting-started/installation.json
{
  "meta": {
    "title": "Installation",
    "description": "Install the package, its peer dependencies and the stylesheet."
  },
  "install": {
    "title": "Install",
    "p1": "Install <code>{{NPM_PACKAGE}}</code> with your package manager:"
  },
  "peers": {
    "title": "Peer dependencies",
    "p1": "The package expects these to be installed in your app:",
    "items": [
      "<code>react</code> and <code>react-dom</code> 18.2 or later",
      "<code>pdfjs-dist</code> {pdfjsRange} — the PDF engine (see <link to=\"/getting-started/requirements/\">Requirements</link>)"
    ]
  }
}
```

### 5.3 Message format (in-house, `src/i18n/format.ts`)

- Interpolation: `{name}`. Global variables always available: `{pluginName}`, `{packageName}`, `{version}`, `{siteUrl}`.
- Plurals: `{count, plural, one {# page} few {# pages} other {# pages}}`, resolved with `Intl.PluralRules` for the active locale (Romanian needs `few`; do not collapse to one/other).
- Inline markup (whitelist only, rendered by the in-house `<Trans>`): `<strong>`, `<em>`, `<code>`, `<kbd>`, `<link to="/relative/path/#hash">` (internal, locale-aware), `<ext href="https://…">` (external, opens in the same tab, gets the external-link icon). Any other tag is a build error.
- Arrays are allowed for lists and table rows. Objects are allowed for grouping. No HTML strings, no Markdown in values.
- Numbers, dates and file sizes are formatted with `Intl` using the active locale, never pre-formatted in the string.

### 5.4 Keys and anchors

- Keys are `camelCase` paths describing the content's role (`install.p1`, `peers.items`), not the English wording.
- A section's DOM `id` is set explicitly in the component (`<Section id="peer-dependencies">`) and is identical in all locales. The ToC, search and deep links use it. Never derive ids from translated text.
- Renaming a key is a breaking change for translators; do it in all seven files in the same commit.

### 5.5 Translation rules

| Rule | Detail |
|---|---|
| Source of truth | `en`. Other locales are translations of it, never independent writing |
| Completeness | Every key of `en` exists in every locale, non-empty, with the same placeholders and the same inline tags (`check-i18n.ts`) |
| Do not translate | Code, component/prop/type/CSS variable names, package names, file paths, URLs, keyboard key names inside `<kbd>`, the plugin display name, "MIT" |
| Terminology | One glossary per locale in `locales/{lng}/_glossary.json` (term → translation). Terms such as "prop", "slot", "hook", "headless", "playground" are decided once per locale and reused. `check-i18n.ts` warns when a glossary source term appears untranslated |
| Register | Informal "you" in `ro` (tu), `hu` (te), `es` (tú), `de` (du), `pt` (você); formal in `fr` (vous). `TODO(user):` confirm |
| Portuguese variant | `pt` uses Brazilian Portuguese spelling. `TODO(user):` confirm, or switch to `pt-PT` |
| Diacritics | Correct native characters, never ASCII substitutes: Romanian ș ț (comma-below, U+0219/U+021B), ă â î; Hungarian ő ű; German ß and umlauts; French and Portuguese accents and cedilla; Spanish ñ and inverted punctuation |
| Length | Translations may be longer; the shell must tolerate +40% text length without overflow (tested with a pseudo-locale, see `07` §4) |
| Status | Each locale file carries `"_meta": { "status": "machine" \| "reviewed", "sourceHash": "…" }`. Machine translations are allowed for release; the Versions of the site do not wait for review. `TODO(user):` which locales get human review |

### 5.6 What agents do when writing content

1. Write the English page component and `en` JSON.
2. Run `pnpm --filter docs i18n:check` — it lists missing keys per locale.
3. Translate the new keys into all six other locales in the same change, following §5.5 and the glossary.
4. Re-run the check; it must pass before the page counts as done.

A page is never merged with only English content.
