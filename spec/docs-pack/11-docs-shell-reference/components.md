# Shell components: contracts and reference skeletons

The shell is the same in every plugin repository. This file defines the file list, the props contract of each component, the DOM structure (class names from `shell.css`) and reference code for the parts earlier agents got wrong. Code blocks are **reference implementations**: build them as shown, complete the elided internals, and keep the DOM, class names, ARIA and behaviour exactly as written.

---

## 1. Files

```
src/shell/
├─ tokens.css  shell.css              ← verbatim from the pack
├─ icons.tsx                          ← inline SVG icon set (02 §9)
├─ AppShell.tsx                       ← layout frame
├─ Navbar.tsx  VersionMenu.tsx  LanguageMenu.tsx  ThemeToggle.tsx  SearchButton.tsx
├─ Sidebar.tsx  MobileDrawer.tsx
├─ Breadcrumbs.tsx  Toc.tsx  PrevNext.tsx  Footer.tsx
├─ SearchDialog.tsx
├─ theme-bootstrap.ts                 ← inline <head> script source
├─ nav.ts                             ← nav.json → tree, flat list, breadcrumbs, prev/next
└─ doc/                               ← page primitives
   ├─ Page.tsx  Section.tsx  P.tsx  List.tsx  Table.tsx  Code.tsx  Tabs.tsx
   ├─ Demo.tsx  Callout.tsx  CardGrid.tsx  PropsTable.tsx  Kbd.tsx
src/i18n/
├─ locales.ts   format.ts   Trans.tsx   I18nProvider.tsx   useT.ts   paths.ts
```

## 2. Layout frame

```tsx
// AppShell.tsx — structure is normative
export function AppShell({ layout = 'default', children }: { layout?: 'default' | 'wide'; children: React.ReactNode }) {
  const t = useT('common');
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="ds-app">
      <a className="ds-skip" href="#main">{t('shell.skipToContent')}</a>
      <Navbar drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen(o => !o)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="ds-body" data-layout={layout}>
        <aside className="ds-sidebar" aria-label={t('shell.sidebarLabel')}>
          <Sidebar />
        </aside>
        <main id="main" className="ds-main ds-content" tabIndex={-1}>
          {children}
        </main>
        {layout === 'default' && <Toc />}
      </div>
      <Footer />
    </div>
  );
}
```

- `ds-main` is the only element with the content padding. No wrapper inside it adds a `max-width` (O1).
- `Toc` renders `<aside className="ds-toc" aria-labelledby="ds-toc-title">`.

## 3. Navbar

```tsx
<header className="ds-navbar">
  <div className="ds-navbar__start">
    <button className="ds-icon-btn ds-hamburger" aria-label={t(open ? 'shell.closeMenu' : 'shell.openMenu')}
            aria-expanded={open} aria-controls="ds-drawer" onClick={onToggleDrawer}><MenuIcon/></button>
    <Link className="ds-wordmark" to={localePath('/')}>{site.displayName}</Link>
    <VersionMenu />
  </div>
  <div className="ds-navbar__end">
    <SearchButton />          {/* .ds-search-btn with icon, label, <kbd>/</kbd> */}
    <a className="ds-icon-btn" href={site.repoUrl} aria-label={t('shell.github')}><GithubIcon/></a>
    <ThemeToggle />           {/* .ds-icon-btn, no border */}
    <LanguageMenu />          {/* .ds-icon-btn with globe + <span class="ds-icon-btn__code">EN</span> */}
  </div>
</header>
```

Order of the right side is fixed: search, GitHub, theme, language (O21). No other items.

## 4. Sidebar

Contract: reads the nav tree and the current path; no props.

```tsx
export function Sidebar() {
  const t = useT('common'); const tn = useT('nav');
  const { sections, activeSectionId, isActive } = useNav();       // from nav.ts
  const [open, setOpen] = useSessionState<Record<string, boolean>>('ds:sidebar', {});
  const isOpen = (id: string) => open[id] ?? id === activeSectionId;

  return (
    <nav aria-label={t('shell.sidebarLabel')}>
      <ul className="ds-nav">
        {sections.map(s => (
          <li key={s.id} className="ds-nav__section" data-open={isOpen(s.id) || undefined}>
            <button type="button" className="ds-nav__header" aria-expanded={isOpen(s.id)}
                    aria-controls={`ds-nav-${s.id}`}
                    onClick={() => setOpen({ ...open, [s.id]: !isOpen(s.id) })}>
              {label(s.labelKey)}
            </button>
            <ul id={`ds-nav-${s.id}`} className="ds-nav__items">
              {s.items.map(item => item.type === 'group'
                ? <Fragment key={item.labelKey}>
                    <li className="ds-nav__group" role="presentation">{label(item.labelKey)}</li>
                    {item.items.map(i => <NavLink key={i.id} item={i} />)}
                  </Fragment>
                : <NavLink key={item.id} item={item} />)}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
// NavLink → <li><Link className="ds-nav__link" aria-current={isActive(i) ? 'page' : undefined} …>{label}{badge}</Link></li>
// label(key): keys starting with "nav." resolve from common.json first, then locales/{lng}/nav.json.
```

Behaviour: the header toggles (O4); the active section is open on load; state per section persists in `sessionStorage`; the sidebar scroll position is preserved across route changes (store `scrollTop` in a ref, restore after navigation); the active link is scrolled into view with `block: 'nearest'` on first load only.

## 5. Mobile drawer

```tsx
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useCloseOnRouteChange(onClose);
  useEscape(open, onClose);
  useBodyScrollLock(open);
  const ref = useFocusTrap<HTMLDivElement>(open);    // returns focus to the hamburger on close
  return (<>
    {open && <div className="ds-drawer-backdrop" onClick={onClose} aria-hidden="true" />}
    <div id="ds-drawer" ref={ref} className="ds-drawer" hidden={!open}
         role="dialog" aria-modal="true" aria-label={t('shell.sidebarLabel')}>
      <Sidebar />
    </div>
  </>);
}
```

## 6. Table of contents (scroll-spy)

- Headings come from the page's `Section` components (registered through context with `id`, `titleKey`, `depth`), not from DOM scraping, so the prerendered HTML already contains the ToC.
- Active heading: an `IntersectionObserver` with `rootMargin: "-{navbarH + 16}px 0px -70% 0px"`; the last heading whose top has passed the offset is active. At the bottom of the page the last heading is active.
- Active link gets `aria-current="true"`; styling per `shell.css` (no background, no radius — O6).

## 7. Theme

`theme-bootstrap.ts` (inlined into `<head>` by `root.tsx`, before any stylesheet):

```ts
export const themeBootstrap = `(function(){try{var t=localStorage.getItem('ds:theme');
if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`;
```

`ThemeToggle` flips `data-theme`, writes `localStorage['ds:theme']`, updates `meta[name=theme-color]`, and swaps its icon and `aria-label` (`shell.themeToDark` / `shell.themeToLight`).

## 8. Language menu and locale paths

```ts
// i18n/paths.ts
export const LOCALES = ['en', 'ro', 'hu', 'es', 'fr', 'de', 'pt'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';

// "/{pluginId}/ro/zoom/" → { locale: 'ro', rest: '/zoom/' }
export function parsePath(pathname: string, pluginId: string): { locale: Locale; rest: string } { /* … */ }
// ('ro', '/zoom/') → "/{pluginId}/ro/zoom/";  ('en', '/zoom/') → "/{pluginId}/zoom/"
export function buildPath(locale: Locale, rest: string, pluginId: string): string { /* … */ }
```

`LanguageMenu`: menu button (`aria-haspopup="menu"`); items are links to `buildPath(code, rest) + location.hash`, labelled with the native name from `localeNames`, `lang={code}`, the current one with `aria-current="true"` and a check icon. Selecting writes `localStorage['ds:locale']`. No automatic redirects.

## 9. i18n core

```ts
// i18n/format.ts — whole message format; no dependency
export function format(msg: string, vars: Record<string, string | number>, locale: Locale): string {
  // 1. plurals: {count, plural, one {…} few {…} other {…}} using new Intl.PluralRules(locale); '#' → formatted count
  // 2. variables: {name} → vars[name] (numbers through Intl.NumberFormat(locale))
  // unknown variable → throw in dev, leave "{name}" in prod
}
```

```tsx
// i18n/Trans.tsx — renders whitelisted inline tags from a message
// <strong> <em> <code> <kbd> <link to="…"> <ext href="…">; anything else throws at build time.
export function Trans({ k, ns, vars }: { k: string; ns?: string; vars?: Record<string, string | number> }) { /* tokenizer → React nodes */ }
```

- `useT(ns)` returns `t(key, vars?)` for plain strings (attributes, labels) and is backed by the locale bundle loaded for the current route.
- Locale bundles are imported with `import.meta.glob('/src/locales/*/**/*.json', { eager: false })` and loaded per route by the route's loader, so prerendered HTML contains translated text and client navigation fetches only the needed namespaces.
- A missing key renders `⟦ns:key⟧` in development and fails `check-i18n` in CI. It never silently falls back to English.

## 10. Search

- Build time (`build-search-index.ts`): for each locale, one JSON index `/{pluginId}/[lng/]search-index.json` with records `{ id, url, title, section, crumb, headings: [{ id, text }], text }` (text truncated to ~2,000 chars per page), plus API symbols and prop names.
- Runtime: the index is fetched on first open of the dialog. Scoring: exact title match > title prefix > heading match > API name > body text; diacritic-insensitive (`normalize('NFD')` + strip combining marks) and case-insensitive; multi-word queries require all words. Results capped at 20.
- Keyboard: `/` (when focus is not in an input), `Ctrl+K`, `⌘K` open; ↑/↓, Enter, Esc; the active result uses `aria-selected` inside a `role="listbox"`.

## 11. Doc primitives

| Component | Props | Renders |
|---|---|---|
| `Page` | `ns` | Loads namespace, renders breadcrumbs, `h1` (`meta.title`), `.ds-lead` (`meta.description`), children, `PrevNext`; sets document title and meta |
| `Section` | `id`, `titleKey`, `level?: 2 \| 3` | `h2`/`h3` with the id; registers in the ToC |
| `P` | `k`, `vars?` | `<p>` with `Trans` |
| `List` | `k`, `ordered?` | `ul`/`ol` from an array key |
| `Table` | `k` (array of rows) , `headKeys` | `.ds-table` in `.ds-table-wrap` |
| `Code` | `lang`, `title?`, `highlight?`, `tabs?: 'pm'` | `.ds-code` (+ `.ds-tabs` for package managers) |
| `Demo` | `id`, `component`, `source`, `height?` | `.ds-demo` (see `04` §1) |
| `Callout` | `tone`, `titleKey`, `k` | `.ds-callout` |
| `CardGrid` | `items: { to, titleKey, textKey }[]` | `.ds-cards` |
| `PropsTable` | `symbol` | generated from API JSON only |
| `Kbd` | `children` | `kbd` |

Pages import only from `~/shell/doc`, `~/demos/**` and the page's own namespace. They contain no text literals (`react/jsx-no-literals`).
