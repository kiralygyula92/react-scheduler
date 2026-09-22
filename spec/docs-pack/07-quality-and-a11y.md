# 07 — Quality, Accessibility, Performance and SEO (docs site)

Package quality gates are in `09` §9. This file covers the documentation site.

---

## 1. Targets

| Area | Target |
|---|---|
| Accessibility | **WCAG 2.2 AA**; zero serious or critical axe violations on every page, both themes, all locales |
| Lighthouse (mobile, throttled) | ≥ 95 Performance, 100 Accessibility, 100 Best Practices, 100 SEO on: Overview, one capability page, Playground, one API page |
| Core Web Vitals (Speed Insights, p75) | LCP < 2.0s, INP < 150ms, CLS < 0.05 |
| JS per content page (gzip, excluding demos) | ≤ 90 kB shell + router + page |
| CSS (gzip) | ≤ 20 kB for the shell |
| Fonts | Inter variable, Latin + Latin Extended subsets (covers ro, hu, de, fr, es, pt), `font-display: swap`, preloaded |

## 2. Accessibility requirements

- Skip link ("Skip to content") as the first focusable element, targeting `<main id="main">`.
- Landmarks: `header` (navbar), `nav` (sidebar, labelled), `main`, `aside` (ToC, labelled), `footer`.
- Exactly one `h1`; heading levels never skip.
- Visible focus on every interactive element: `outline: 2px solid var(--ds-focus); outline-offset: 2px` (never removed, never only colour).
- Menus (version, language) follow the menu-button pattern: `aria-haspopup`, `aria-expanded`, arrow-key navigation, Esc closes and returns focus.
- Dialogs (search) and the drawer trap focus and restore it on close.
- The theme toggle has an `aria-label` describing the action ("Switch to dark theme") and updates it.
- The language menu marks the current language with `aria-current="true"` and each item has `lang="{code}"`.
- Demos have an accessible name (the demo title) and the demo frame is a labelled region.
- Colour is never the only carrier of meaning (badges have text, active items have weight and `aria-current`).
- Contrast pairs from `02` §2 are unit-tested with a contrast function over `tokens.css` for both themes.
- Touch targets ≥ 24×24 CSS px (WCAG 2.5.8); icon buttons are 36–40px.
- `prefers-reduced-motion` disables transitions and smooth scrolling.

## 3. SEO

- Static HTML for every page and locale (prerendered), with the metadata contract from `01` §9.
- `hreflang` alternates on every page and in `sitemap.xml`; canonical to self.
- `robots.txt` allowing everything and pointing to the sitemap.
- Descriptive link text; no "click here".
- Titles ≤ 60 characters, descriptions 70–160 characters (checked per locale; long translations produce a warning, not an error).

## 4. Tests

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | i18n formatter (interpolation, plurals for all 7 locales, tag whitelist), search scoring, highlighter tokenization per language, nav → routes generation, contrast checker |
| Component | Vitest + Testing Library | Sidebar toggle and active state, drawer focus trap, menus keyboard, search dialog keyboard, ToC scroll-spy, copy button announcements |
| E2E | Playwright (Chromium, Firefox, WebKit) | Every route in `nav.json` × `en` returns 200 and renders an `h1`; a sample of 10 routes × every locale; mobile drawer journey; search journey; language switch keeps path and hash; theme persistence without flash |
| Visual | Playwright screenshots | Overview, capability page, Playground, API page, search open, mobile drawer open — at 390, 1024 and 1440 widths, light and dark. Baselines are **shared across plugins** for shell-only regions (navbar, sidebar frame, ToC frame) |
| A11y | `@axe-core/playwright` | Every E2E page |
| Pseudo-locale | `check-i18n --pseudo` | Builds a pseudo-locale (`⟦ÄççëñţëḋЁxpanded+40%⟧`) and fails if any visible text node lacks the markers (catches hard-coded strings) or overflows its container |
| Links | `check-links.ts` | Every internal link and anchor resolves, in every locale |

## 5. CI gates (every PR)

1. `pnpm lint` (ESLint with `react/jsx-no-literals` on `src/content/**` and `src/shell/**`, Stylelint with the token rule).
2. `pnpm typecheck` (TypeScript 7).
3. `pnpm test` (unit + component).
4. `pnpm --filter docs api` then `pnpm --filter docs i18n:check`.
5. `pnpm --filter docs build` (prerender all routes × locales).
6. `pnpm --filter docs conformance` (§6).
7. `pnpm e2e` (smoke subset on PRs, full suite on `main`).
8. Lighthouse CI on the four pages from §1 against the Vercel preview URL (informational on PRs, gating on `main`).

## 6. Conformance checks (`scripts/check-conformance.ts`)

| # | Check |
|---|---|
| C1 | `nav.json` validates against `nav.schema.json` and has the nine sections in the fixed order with their fixed children |
| C2 | Every nav item has a page component and a locale file in all 7 locales |
| C3 | Every page has exactly one `h1`, a non-empty `meta.title` and `meta.description` |
| C4 | Every template's required sections exist (per `03`), matched by section `id` |
| C5 | Every capability page has a demo in `Basics`, a `limitations` section and an `api` section |
| C6 | No hand-written props tables (`05` §6) |
| C7 | Every public prop of the main component is in the Playground |
| C8 | `src/shell/**` matches the reference checksum (warning with diff) |
| C9 | No raw colour or duration literals in any site CSS outside `tokens.css` (hex, rgb(), hsl(), named colours other than `transparent`, `currentColor`, `inherit`; `ms`/`s` values) |
| C10 | No forbidden features: pricing, tiers, "Edit this page", "Was this page helpful" (text and component names) |
| C11 | `llms.txt`, `llms-full.md`, `llms-full.txt` and every `.md` twin exist for every locale and match the page list |
| C12 | Zero-reference scan passes for `apps/docs/**` (see `09` §8) |
| C13 | Every demo source file is imported as `?raw` by exactly one `<Demo>` or the Demos pages |
| C14 | Sample assets in `public/samples/` are listed in `SOURCES.md` with a licence |
| C15 | `vercel.json` contains no rewrite that matches `/_vercel/` (see `10` §3) |
