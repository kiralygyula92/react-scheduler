# Placeholder Glossary

## How keys are resolved

Keys use `{{UPPER_SNAKE_CASE}}`. You never find-and-replace them. Instead:

1. **Template Prompt 1** (source repository): fill the **Value** column of its INPUTS table. The agent resolves every key in the prompt from that table and asks if a required value is empty.
2. **Template Prompt 2** (new repository): fill the **Value** column of its INPUTS table (the project dictionary). Defaults are pre-filled; "derived" rows may stay empty.
3. At **M0** the agent copies the resolved dictionary into the **Project dictionary** section of `AGENTS.md`. Every later session, in any tool, resolves keys in `spec/docs-pack/` and `spec/feature-dossier/` from there.
4. Files in `spec/` are **never** edited to substitute values. They stay identical across plugin repositories, so a pack update is a plain copy.

`${{ … }}` inside GitHub Actions YAML is GitHub's own expression syntax, **not** a key; leave it unchanged.

## Template Prompt 1 keys

| Key | Meaning | Example |
|---|---|---|
| `{{FEATURE_NAME}}` | The feature's name in the source project (never leaves the source repo in clear text) | "the list table" |
| `{{SOURCE_PATHS}}` | Source folders and files where the feature lives and is used | `src/components/tables/`, `src/pages/**/sections/*Table.tsx` |
| `{{SOURCE_STACK}}` | Source tech stack | React 19, TypeScript, MUI 7, Zustand, Vite |
| `{{KNOWN_EDGE_CASES}}` | Known edge cases and bugs to confirm (optional) | "pagination ellipsis hides one page" |
| `{{OUT_OF_SCOPE}}` | What must not be documented or rebuilt | "server API client, auth" |
| `{{NPM_PACKAGE}}` | Working package name | `react-tablekit` |
| `{{PLUGIN_DISPLAY_NAME}}` | Human name | `React Tablekit` |
| `{{CSS_PREFIX}}` | 2–4 letter CSS prefix | `tk` |
| `{{ENGINE_PEER}}` | Approved engine peer with range, or `none` | `none`, or `pdfjs-dist >=4.10 <6` |
| `{{EXTENSION_WISHLIST}}` | Extra capabilities wanted beyond parity (optional) | "sorting, filter section, row overrides, collapsible rows, pinned columns, overridable handlers, theming" |
| `{{DOSSIER_OUTPUT_DIR}}` | Untracked folder for the Dossier | `~/dossiers/react-tablekit/` |
| `{{DENYLIST_SALT}}` | Random string used to hash denylist terms; reuse it in TP2 | `k3v9-q1x7` |

## Template Prompt 2 keys (project dictionary)

These are also the keys used throughout the docs pack and in `agent-files/`.

| Key | Meaning | Default / example |
|---|---|---|
| `{{NPM_PACKAGE}}` | Published package name (scoped or not) | `react-pdf-viewer` or `@acme/react-pdf-viewer` |
| `{{PLUGIN_DISPLAY_NAME}}` | Human name shown in the navbar and text | `React PDF Viewer` |
| `{{PLUGIN_ID}}` | Kebab-case id and site base path | derived: unscoped package name |
| `{{NPM_SCOPE}}` | npm scope used if the plain name is taken | `acme` |
| `{{COMPONENT}}` | Main exported component | `PdfViewer` |
| `{{CSS_PREFIX}}` | 2–4 letter CSS prefix (same as TP1) | `rpv` |
| `{{ENGINE_PEER}}` | Engine peer with range, or `none` (same as TP1) | `none` |
| `{{ONE_LINE_DESCRIPTION}}` | Package description, also the Overview's `meta.description` | "Accessible, themeable PDF viewing for React" |
| `{{KEYWORDS}}` | npm keywords | `pdf`, `viewer`, `pdfjs` |
| `{{PACKAGE_DIR}}` | Folder under `packages/` | derived: `{{PLUGIN_ID}}` |
| `{{REPO_NAME}}` | Repository name | derived: `{{PLUGIN_ID}}` |
| `{{REPO_URL}}` | Repository URL | `https://github.com/owner/react-pdf-viewer` |
| `{{SITE_DOMAIN}}` | Production domain of the docs site | `react-pdf-viewer.vercel.app` |
| `{{COPYRIGHT_HOLDER}}` | Name in the MIT licence | your name or company |
| `{{YEAR}}` | Copyright year | `2026` |
| `{{DENYLIST_SALT}}` | Same salt as TP1 (also recorded in the Dossier README) | `k3v9-q1x7` |
| `{{FEATURE_DOSSIER_PATH}}` | Dossier location | `spec/feature-dossier` |
| `{{DOCS_PACK_PATH}}` | Docs pack location | `spec/docs-pack` |
| `{{PACKAGE_MANAGER}}` | Package manager | `pnpm 10` |
| `{{NODE_VERSION}}` | Node for development and CI | `24 LTS` |
| `{{SPELLING}}` | English variant for content | `American English` |

Keys shared by both prompts (`{{NPM_PACKAGE}}`, `{{PLUGIN_DISPLAY_NAME}}`, `{{CSS_PREFIX}}`, `{{ENGINE_PEER}}`, `{{DENYLIST_SALT}}`) MUST have the same value in both.
