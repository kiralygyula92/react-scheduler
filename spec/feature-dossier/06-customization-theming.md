# 06 — Customization and theming

Covered here: parts and slots, the CSS contract, design tokens, presets, density, unstyled mode,
handlers (summary) and localization (keys plus the 7 packs). Signatures are in `04-api-reference.md`.

---

## 1. Parts

Every visible part has a stable name. The name is used for:

- `slots.<part>` and `slotProps.<part>`;
- `classNames.<part>` and `styles.<part>`;
- the class `rs-<part-kebab>`;
- the attribute `data-rs-part="<part>"`.

| Part | Default element | Present in | Notes |
|---|---|---|---|
| `root` | `div role="region"` | both | carries `data-rs-preset`, `data-rs-scheme`, `data-rs-density`, `data-rs-view`, `data-rs-compact` |
| `header` | — | both | only when `renderHeader` or `slots.header` is given |
| `stickyTop` | `div` | both | list: `position: sticky`; timeline: static above the scroller |
| `stickyBottom` | `div` | both | |
| `scroller` | `div` | both | `overflow-anchor: none` |
| `body` | `div` | list | |
| `pinnedStrip` | `div role="region"` | both | labelled `pinnedStrip.label` |
| `pinnedStripTrack` | `ul role="list"` | both | |
| `pinnedChip` | `button` (inside `li`) | both | |
| `edgeFade` | `div aria-hidden` | both | `data-rs-side="start|end"` |
| `liveRegion` | `div aria-live="polite"` | both | visually hidden |
| `navButton` | `button` | both | `data-rs-position="top|bottom"`, `data-rs-disabled` |
| `carriedOverCount` | `span` | both | |
| `shiftSection` | `section` | list | `data-rs-offset` |
| `shiftHeader` | `div` | list | |
| `shiftHeaderTitle` | `h{headingLevel}` | list | |
| `shiftHeaderRange` | `span` | list | |
| `shiftEmpty` | `p` | list | |
| `itemList` | `ul role="list"` | list | |
| `listCard` | `li` | list | `data-rs-level`, `data-rs-variant` |
| `timelineCard` | `li` | timeline | absolutely positioned; `data-rs-column`, `data-rs-columns` |
| `cardActivator` | `button` | both | phrasing content only |
| `cardRail` | `span aria-hidden` | both | |
| `cardTitle` | `span` | both | |
| `cardDescription` | `span` | both | |
| `cardTimeLabel` | `span` | both | |
| `cardSuggestion` | `span` | timeline | |
| `cardPills` | `span` | both | |
| `levelPill` | `span` | both | `data-rs-level` |
| `tagPill` | `span` | both | `data-rs-tag` |
| `referencePill` | `span` | both | |
| `pillIcon` | `svg aria-hidden` | both | the diamond |
| `pinSentinel` | `span aria-hidden` | both | 1 px, `data-rs-edge="top|bottom"` |
| `nowMarker` | `div role="separator"` | list | line plus label |
| `timeGrid` | `div` | timeline | |
| `timeGutter` | `div aria-hidden` | timeline | hour labels are decorative (time is in the card descriptions) |
| `hourLabel` | `span` | timeline | `data-rs-boundary` |
| `gridBox` | `div` | timeline | |
| `offShiftBand` | `div aria-hidden` | timeline | |
| `hourLine` | `div aria-hidden` | timeline | `data-rs-boundary` |
| `nowLine` | `div role="separator"` | timeline | |
| `nowLabel` | `span` | timeline | |
| `laneStartPad` / `laneEndPad` | `div` | timeline | "+more" chips live in `laneEndPad` |
| `lane` | `ul role="list"` | timeline | |
| `moreChip` | `button` | timeline | |
| `overflowDialog` | `dialog` | timeline | |
| `overflowTable` | `table` | timeline | |
| `pagination` | `nav` | timeline | |
| `detailDialog` | `dialog` | both | `DefaultItemDetail` |
| `emptyState` / `loadingState` / `errorState` | `div` | both | |
| `scrollTopButton` | `button` | list (compact) | |
| `tooltip` | `div role="tooltip"` | both | |

### 1.1 Slot contract

```ts
export type SchedulerSlots<TItem> = { [P in SchedulerPart]: React.ComponentType<SlotProps<P, TItem>> };
export type SchedulerSlotProps<TItem> = {
  [P in SchedulerPart]: Partial<SlotProps<P, TItem>> | ((ownerState: OwnerState<TItem>) => Partial<SlotProps<P, TItem>>)
};

interface BaseSlotProps<TItem> {
  ownerState: OwnerState<TItem>;
  className: string;              // 'rs-<part>' + classNames[part] + slotProps className
  style?: React.CSSProperties;    // structural inline styles + styles[part]
  'data-rs-part': string;
  ref?: React.Ref<any>;           // MUST be attached (pinning, measuring, focus)
  children?: React.ReactNode;
}

export interface OwnerState<TItem> {
  view: ViewKind;
  compact: boolean;
  preset: PresetName;
  colorScheme: 'light' | 'dark';
  density: Density;
  dir: 'ltr' | 'rtl';
  item?: TItem;
  level?: LevelDefinition;
  variant?: CardVariant;
  shift?: ShiftWindow;
  position?: 'top' | 'bottom';
  disabled?: boolean;
  pinned?: boolean;
  carriedOver?: boolean;
  active?: boolean;
}
```

- **Part-specific props** extend the base: for example, `cardActivator` receives `onClick`, `onKeyDown` and `aria-describedby`; `navButton` receives `NavState`.
- **Merge order** for each part:
  1. library defaults;
  2. `slotProps`;
  3. `classNames` / `styles` (appended or merged);
  4. event handlers composed as library first, then consumer. A consumer handler may call `event.preventDefault()` to cancel the library default (equivalent to not calling `next()`).

---

## 2. CSS contract

- **Stylesheet:** `react-scheduler/styles.css` is plain CSS. There is no runtime styling engine.
- **Specificity:**
  - Decorative rules use zero-specificity selectors: `:where(.rs-root:not([data-rs-unstyled])) :where(.rs-list-card) { … }`.
  - Any consumer class therefore wins without `!important`.
- **Modifiers:** data attributes (`data-rs-level`, `data-rs-variant`, `data-rs-disabled`, `data-rs-active`, `data-rs-compact`, …), never generated class names.
- **Structural inline styles:** only behaviour-critical geometry is inline:
  - timeline card `top` / `height` / `inset-inline-start` / `width`;
  - grid height;
  - "+more" `top`;
  - now line and label `top`.
- **Properties:** logical properties everywhere (F-29).
- **Unstyled mode** (`unstyled`):
  - Sets `data-rs-unstyled`, which removes every decorative rule.
  - What remains: the structural inline styles, `position: sticky` for the list sticky top, `overflow` on the scroller, sentinel placement and the visually-hidden utility.
  - The consumer styles everything else through `classNames`, `styles` or slots.

---

## 3. Tokens

The tokens are CSS custom properties on `.rs-root`, set by `[data-rs-preset][data-rs-scheme]` selectors and
overridable through the `tokens` prop (inline) or plain CSS.

- **Classic values:** `02-visual-spec.md` §1 (colour, shadow, radius, typography, dimensions).
- **Default preset:** identical to classic **except** the values below. These are the accessibility and
  portability fixes (**B-19**), and each contrast ratio was computed against its actual background.

| Token | Default light | Default dark | Reason |
|---|---|---|---|
| `--rs-font-family` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | same | no named web fonts |
| `--rs-font-family-display` | = `--rs-font-family` | same | |
| `--rs-color-accent` | `#141414` | **`#F2F2F2`** | dark: scroll-to-top button, spinner and focus ring were black on `#121212` |
| `--rs-color-on-accent` | `#FFFFFF` | **`#000000`** | |
| `--rs-color-focus` *(new)* | `#141414` | `#FFFFFF` | focus rings use this instead of level colours (≥ 3:1 on every surface) |
| `--rs-color-alert-text-muted` | **`#6E4436`** (4.79:1 on `#F8B6A1`) | **`#C99A89`** (4.94:1 on `#5C2410`) | classic 3.4:1 / 3.25:1 |
| `--rs-color-now` | **`#6B6F78`** (label text 5.03:1) | `#999DA6` (black text 7.7:1) | classic light: white on `#999DA6` = 2.72:1 |
| `--rs-level-<key>-on` | **`#000000` for all levels** | `#000000` for all levels | white on the green/orange/grey/blue pills was 1.97–4.07:1 |
| `--rs-level-resolved` | `#999DA6` | **`#7A7F88`** (black text 5.22:1) | classic dark `#6F747C` gives 4.47:1 |

- **Classic-only focus colour:** the classic preset sets `--rs-color-focus` to the level colour (cards and chips) or `--rs-color-accent` ("+more"), reproducing the source.
- **Classic contrast shortfalls:** the classic preset's known shortfalls are listed in `07` (B-19). They are kept for pixel parity.

### 3.1 Token names

| Group | Tokens |
|---|---|
| **Colour** | `--rs-color-bg`, `-surface`, `-surface-muted`, `-surface-overlay`, `-text`, `-text-muted`, `-text-secondary`, `-text-body`, `-text-inverse`, `-on-pill-dark`, `-on-pill-light`, `-divider`, `-grid-line`, `-grid-boundary`, `-off-shift`, `-now`, `-nav-bg`, `-nav-bg-hover`, `-nav-border`, `-alert-surface`, `-alert-border`, `-alert-text-muted`, `-pill-neutral`, `-more-bg`, `-more-text`, `-tooltip-bg`, `-tooltip-text`, `-accent`, `-on-accent`, `-focus`, `-backdrop`, `-table-head-bg`, `-table-head-text`, `-table-row`, `-table-row-alt`, `-table-row-hover`, `-icon`, `-icon-muted`, `-edge-fade-tint` |
| **Levels** | `--rs-level-<key>`, `--rs-level-<key>-on` for every level key (custom levels fall back to `--rs-level-fallback` `#999DA6` / on `#000000`) |
| **Shadow** | `--rs-shadow-card`, `-card-hover`, `-sticky`, `-pill`, `-pill-hover`, `-tooltip`, `-dialog`, `-floating` |
| **Radius** | `--rs-radius-card`, `-pill`, `-button`, `-tooltip`, `-dialog`, `-table`, `-grid` |
| **Typography** | `--rs-font-family`, `--rs-font-family-display`, and per text style `--rs-text-<style>-size` / `-line` / `-weight` (styles: `card-title`, `card-body`, `suggestion`, `pill`, `nav`, `count`, `section-title`, `section-range`, `empty`, `hour`, `now`, `more`, `tooltip`, `dialog-title`, `table-head`, `table-cell`) |
| **Dimensions** | `--rs-gutter-width`, `-lane-padding`, `-card-gap`, `-pill-height`, `-more-height`, `-rail-width`, `-edge-fade-width`, `-sticky-bottom-list`, `-sticky-bottom-timeline`, `-grid-pad-top`, `-grid-pad-bottom`, `-now-line`, `-focus-width`, `-focus-offset`, `-card-padding`, `-card-rail-gap`, `-list-gap`, `-chip-width-lg`, `-chip-width-md`, `-chip-width-sm` |
| **Motion** | `--rs-duration-fast` (150 ms), `-duration-base` (250 ms), `-duration-chip` (180 ms), `--rs-ease-standard` (`cubic-bezier(0.4, 0, 0.2, 1)`), `--rs-ease-chip` (`cubic-bezier(0.2, 0.9, 0.3, 1.2)`) |

- **Hour height:** it is a behaviour option (`timeline.hourHeight`) because the layout engine needs it in JavaScript. The stylesheet reads the computed value through `--rs-hour-height`, set inline on the root.
- **Theme conversion:** consumers who only have a colour palette can call `createTokens({ primary, surface, … })` *(v1.x helper)*.

---

## 4. Density

| Value | Standard (= classic) | Comfortable | Dense |
|---|---|---|---|
| `--rs-card-padding` | 12 | 16 | 8 |
| `--rs-card-rail-gap` | 20 | 20 | 12 |
| `--rs-list-gap` | 6 | 10 | 4 |
| `--rs-pill-height` | 24 | 28 | 20 |
| card title size / line | 16 / 20 | 17 / 24 | 14 / 18 |
| card body size / line | 14 / 20 | 15 / 22 | 12 / 16 |
| timeline card top padding | 20 | 24 | 12 |
| default `timeline.hourHeight` | 172 | 200 | 120 |
| default `timeline.minCardHeight` | 80 | 96 | 56 |

- An explicit `timeline.hourHeight` / `minCardHeight` overrides the density default.
- Density never changes behaviour thresholds expressed in minutes (lead, gutter).

---

## 5. Handlers (summary)

| Interaction | Middleware | Default behaviour | Callbacks after |
|---|---|---|---|
| activate a card, chip, row or `api` | `onItemActivate` | open the detail (unless `disabled` / `enableItemDetail: false`) | `onOpenItemIdChange`, `onItemOpen` |
| key down on a card | `onItemKeyDown` | Enter/Space activate | — |
| navigation button | `onNavigate` | scroll to target | `onNavigate`, then `onActiveShiftChange` when it settles |
| "+more" | `onMoreActivate` | open the overflow dialog | `onOpenOverflowIdChange`, `onOverflowOpen` |
| scroll-to-top | `onScrollTop` | scroll to 0 | `onScrollTop` |
| sort a column | `onOverflowSort` | re-sort, page 0 | `onOverflowSortChange`, `onOverflowPageChange` |
| change page | `onOverflowPage` | show page | `onOverflowPageChange` |
| close overflow | `onOverflowClose` | close | `onOpenOverflowIdChange(null)`, `onOverflowClose` |
| close detail | `onDetailClose` | close, restore focus | `onOpenItemIdChange(null)`, `onItemClose` |
| pin / unpin | `onPin` | update the pinned set | `onPinnedChange` |
| header signal | `onHeaderSignal` | update the value | `onHeaderExpandedChange` |

---

## 6. Localization

### 6.1 Keys

```ts
export interface SchedulerLocalization {
  locale: string;            // BCP 47, used for Intl
  dir?: 'ltr' | 'rtl';
  emptyAll: string;
  emptyShift: string;
  loading: string;
  errorTitle: string;
  retry: string;
  shiftHeader: { previous: string; current: string; next: string; earlier: PluralForms; later: PluralForms };
  nav: {
    viewPrevious: string; viewCurrent: string; viewNext: string; viewEarlier: string; viewLater: string;
    toPreviousHint: string; toCurrentHint: string; toNextHint: string; toEarlierHint: string; toLaterHint: string;
    noPrevious: string; noNext: string;
    carriedOverCount: PluralForms;
  };
  scrollTop: string;
  timeLabel: { observed: string; since: string };
  referenceLabel: string;
  more: { label: string; ariaLabel: PluralForms };
  overflow: {
    title: PluralForms; empty: string; tableLabel: string; close: string; closeIcon: string; viewDetails: string;
    column: { time: string; level: string; title: string; description: string; actions: string };
  };
  pagination: { label: string; previous: string; next: string; page: string };
  levels: Record<string, string>;
  tags: Record<string, string>;
  pinnedStrip: { label: string; announcement: PluralForms };
  now: { label: string };
  views: { list: string; timeline: string };
  detail: { close: string };
  card: { description: string };
}
```

- **Placeholders:**
  - `{{count}}`: `shiftHeader.earlier|later`, `nav.carriedOverCount`, `more.ariaLabel`, `overflow.title`, `pinnedStrip.announcement`;
  - `{{time}}`: `more.ariaLabel`, `now.label`;
  - `{{page}}`: `pagination.page`;
  - `{{level}}`, `{{time}}`: `card.description`.
- **Parity text:** the parity en strings are the source strings (`01` §10). New keys are marked *new* below.
- **Review status:** ro, hu, fr, de and pt-PT are drafts, and new es keys are drafts. All of them need native review (`11`).
- **Right-to-left:** no RTL pack ships in v1.0. `dir` is supported for custom packs.
- **Glyphs:** a few glyphs are presentation, not text: the pagination ellipsis "…" (`aria-hidden`), the en dash in time ranges, " - " in shift ranges, and the item counts. They come from `formatters` (override there) and are not localization keys.

### 6.2 `enUS`

```json
{
  "locale": "en-US",
  "emptyAll": "No agenda data available.",
  "emptyShift": "No items in this shift.",
  "loading": "Loading…",
  "errorTitle": "Items could not be loaded.",
  "retry": "Retry",
  "shiftHeader": {
    "previous": "Previous shift", "current": "Current shift", "next": "Next shift",
    "earlier": { "one": "{{count}} shift earlier", "other": "{{count}} shifts earlier" },
    "later": { "one": "{{count}} shift later", "other": "{{count}} shifts later" }
  },
  "nav": {
    "viewPrevious": "View previous shift", "viewCurrent": "View current shift", "viewNext": "View next shift",
    "viewEarlier": "View earlier shift", "viewLater": "View later shift",
    "toPreviousHint": "Scroll to previous shift start", "toCurrentHint": "Scroll to current shift start",
    "toNextHint": "Scroll to next shift start", "toEarlierHint": "Scroll to earlier shift start",
    "toLaterHint": "Scroll to later shift start",
    "noPrevious": "No previous shift available.", "noNext": "No next shift available.",
    "carriedOverCount": { "one": "({{count}} inherited)", "other": "({{count}} inherited)" }
  },
  "scrollTop": "Scroll to top",
  "timeLabel": { "observed": "Observed at:", "since": "Ready since:" },
  "referenceLabel": "Ref:",
  "more": { "label": "More", "ariaLabel": { "one": "{{count}} more item from {{time}}", "other": "{{count}} more items from {{time}}" } },
  "overflow": {
    "title": { "one": "More overlapping items ({{count}})", "other": "More overlapping items ({{count}})" },
    "empty": "No additional items.", "tableLabel": "Overflow items table", "close": "Close", "closeIcon": "Close",
    "viewDetails": "View details",
    "column": { "time": "Observed at", "level": "Severity", "title": "Title", "description": "Description", "actions": "Actions" }
  },
  "pagination": { "label": "Pagination", "previous": "Previous", "next": "Next", "page": "Page {{page}}" },
  "levels": {
    "critical": "Critical", "watch": "Watch", "monitoring": "Monitoring", "capacityWatch": "Capacity Watch", "ready": "Ready",
    "normal": "Normal", "onTarget": "On target", "routine": "Routine", "resolved": "Resolved"
  },
  "tags": { "impactsNextShift": "Impacts Next Shift", "carriedOver": "Inherited" },
  "pinnedStrip": { "label": "Pinned items", "announcement": { "one": "{{count}} item pinned", "other": "{{count}} items pinned" } },
  "now": { "label": "Now: {{time}}" },
  "views": { "list": "List", "timeline": "Timeline" },
  "detail": { "close": "Close" },
  "card": { "description": "{{level}}, {{time}}" }
}
```

*New keys (not in the source):* `loading`, `errorTitle`, `retry`, `shiftHeader.earlier/later`,
`nav.viewEarlier/viewLater/toEarlierHint/toLaterHint`, `more.ariaLabel`, `pagination.label/page`,
`pinnedStrip.*`, `now.label`, `views.*`, `detail.close`, `card.description`. The key `referenceLabel`
replaces a domain word.

### 6.3 `esES`

```json
{
  "locale": "es-ES",
  "emptyAll": "No hay datos de agenda disponibles.",
  "emptyShift": "No hay elementos programados para este turno.",
  "loading": "Cargando…",
  "errorTitle": "No se pudieron cargar los elementos.",
  "retry": "Reintentar",
  "shiftHeader": {
    "previous": "Turno anterior", "current": "Turno actual", "next": "Próximo turno",
    "earlier": { "one": "{{count}} turno antes", "other": "{{count}} turnos antes" },
    "later": { "one": "{{count}} turno después", "other": "{{count}} turnos después" }
  },
  "nav": {
    "viewPrevious": "Ver turno anterior", "viewCurrent": "Ver turno actual", "viewNext": "Ver próximo turno",
    "viewEarlier": "Ver un turno antes", "viewLater": "Ver un turno después",
    "toPreviousHint": "Ir al inicio del turno anterior", "toCurrentHint": "Ir al inicio del turno actual",
    "toNextHint": "Ir al inicio del próximo turno", "toEarlierHint": "Ir al inicio de un turno antes",
    "toLaterHint": "Ir al inicio de un turno después",
    "noPrevious": "No hay un turno anterior disponible.", "noNext": "No hay un próximo turno disponible.",
    "carriedOverCount": { "one": "({{count}} heredado)", "other": "({{count}} heredados)" }
  },
  "scrollTop": "Volver arriba",
  "timeLabel": { "observed": "Observado a las:", "since": "Listo desde:" },
  "referenceLabel": "Ref.:",
  "more": { "label": "Más", "ariaLabel": { "one": "{{count}} elemento más desde las {{time}}", "other": "{{count}} elementos más desde las {{time}}" } },
  "overflow": {
    "title": { "one": "Más elementos superpuestos ({{count}})", "other": "Más elementos superpuestos ({{count}})" },
    "empty": "No hay más elementos.", "tableLabel": "Tabla de elementos superpuestos", "close": "Cerrar", "closeIcon": "Cerrar",
    "viewDetails": "Ver detalles",
    "column": { "time": "Observado a las", "level": "Severidad", "title": "Título", "description": "Descripción", "actions": "Acciones" }
  },
  "pagination": { "label": "Paginación", "previous": "Anterior", "next": "Siguiente", "page": "Página {{page}}" },
  "levels": {
    "critical": "Crítico", "watch": "Vigilancia", "monitoring": "Supervisión", "capacityWatch": "Vigilancia de capacidad",
    "ready": "Listo", "normal": "Normal", "onTarget": "En objetivo", "routine": "Rutina", "resolved": "Resuelto"
  },
  "tags": { "impactsNextShift": "Afecta al siguiente turno", "carriedOver": "Heredado" },
  "pinnedStrip": { "label": "Elementos fijados", "announcement": { "one": "{{count}} elemento fijado", "other": "{{count}} elementos fijados" } },
  "now": { "label": "Ahora: {{time}}" },
  "views": { "list": "Lista", "timeline": "Cronología" },
  "detail": { "close": "Cerrar" },
  "card": { "description": "{{level}}, {{time}}" }
}
```

### 6.4 `roRO` *(draft — needs native review)*

```json
{
  "locale": "ro-RO",
  "emptyAll": "Nu există date în agendă.",
  "emptyShift": "Nu există elemente în această tură.",
  "loading": "Se încarcă…",
  "errorTitle": "Elementele nu au putut fi încărcate.",
  "retry": "Reîncearcă",
  "shiftHeader": {
    "previous": "Tura anterioară", "current": "Tura curentă", "next": "Tura următoare",
    "earlier": { "one": "Cu {{count}} tură înainte", "few": "Cu {{count}} ture înainte", "other": "Cu {{count}} de ture înainte" },
    "later": { "one": "Cu {{count}} tură mai târziu", "few": "Cu {{count}} ture mai târziu", "other": "Cu {{count}} de ture mai târziu" }
  },
  "nav": {
    "viewPrevious": "Vezi tura anterioară", "viewCurrent": "Vezi tura curentă", "viewNext": "Vezi tura următoare",
    "viewEarlier": "Vezi o tură mai devreme", "viewLater": "Vezi o tură mai târziu",
    "toPreviousHint": "Derulează la începutul turei anterioare", "toCurrentHint": "Derulează la începutul turei curente",
    "toNextHint": "Derulează la începutul turei următoare", "toEarlierHint": "Derulează la începutul unei ture mai devreme",
    "toLaterHint": "Derulează la începutul unei ture mai târziu",
    "noPrevious": "Nu există o tură anterioară.", "noNext": "Nu există o tură următoare.",
    "carriedOverCount": { "one": "({{count}} preluat)", "few": "({{count}} preluate)", "other": "({{count}} de preluate)" }
  },
  "scrollTop": "Derulează sus",
  "timeLabel": { "observed": "Observat la:", "since": "Pregătit din:" },
  "referenceLabel": "Ref.:",
  "more": { "label": "Mai mult", "ariaLabel": { "one": "Încă {{count}} element de la {{time}}", "few": "Încă {{count}} elemente de la {{time}}", "other": "Încă {{count}} de elemente de la {{time}}" } },
  "overflow": {
    "title": { "one": "Mai multe elemente suprapuse ({{count}})", "few": "Mai multe elemente suprapuse ({{count}})", "other": "Mai multe elemente suprapuse ({{count}})" },
    "empty": "Nu există alte elemente.", "tableLabel": "Tabel cu elemente suprapuse", "close": "Închide", "closeIcon": "Închide",
    "viewDetails": "Vezi detalii",
    "column": { "time": "Observat la", "level": "Severitate", "title": "Titlu", "description": "Descriere", "actions": "Acțiuni" }
  },
  "pagination": { "label": "Paginare", "previous": "Înapoi", "next": "Înainte", "page": "Pagina {{page}}" },
  "levels": {
    "critical": "Critic", "watch": "Atenție", "monitoring": "Monitorizare", "capacityWatch": "Atenție capacitate",
    "ready": "Pregătit", "normal": "Normal", "onTarget": "În țintă", "routine": "Rutină", "resolved": "Rezolvat"
  },
  "tags": { "impactsNextShift": "Afectează tura următoare", "carriedOver": "Preluat" },
  "pinnedStrip": { "label": "Elemente fixate", "announcement": { "one": "{{count}} element fixat", "few": "{{count}} elemente fixate", "other": "{{count}} de elemente fixate" } },
  "now": { "label": "Acum: {{time}}" },
  "views": { "list": "Listă", "timeline": "Cronologie" },
  "detail": { "close": "Închide" },
  "card": { "description": "{{level}}, {{time}}" }
}
```

### 6.5 `huHU` *(draft — needs native review)*

```json
{
  "locale": "hu-HU",
  "emptyAll": "Nincs elérhető napirendi adat.",
  "emptyShift": "Ebben a műszakban nincs elem.",
  "loading": "Betöltés…",
  "errorTitle": "Az elemeket nem sikerült betölteni.",
  "retry": "Újra",
  "shiftHeader": {
    "previous": "Előző műszak", "current": "Aktuális műszak", "next": "Következő műszak",
    "earlier": { "one": "{{count}} műszakkal korábban", "other": "{{count}} műszakkal korábban" },
    "later": { "one": "{{count}} műszakkal később", "other": "{{count}} műszakkal később" }
  },
  "nav": {
    "viewPrevious": "Előző műszak megtekintése", "viewCurrent": "Aktuális műszak megtekintése", "viewNext": "Következő műszak megtekintése",
    "viewEarlier": "Korábbi műszak megtekintése", "viewLater": "Későbbi műszak megtekintése",
    "toPreviousHint": "Görgetés az előző műszak elejére", "toCurrentHint": "Görgetés az aktuális műszak elejére",
    "toNextHint": "Görgetés a következő műszak elejére", "toEarlierHint": "Görgetés egy korábbi műszak elejére",
    "toLaterHint": "Görgetés egy későbbi műszak elejére",
    "noPrevious": "Nincs előző műszak.", "noNext": "Nincs következő műszak.",
    "carriedOverCount": { "one": "({{count}} átvett)", "other": "({{count}} átvett)" }
  },
  "scrollTop": "Vissza a tetejére",
  "timeLabel": { "observed": "Észlelve:", "since": "Kész ekkortól:" },
  "referenceLabel": "Hiv.:",
  "more": { "label": "Több", "ariaLabel": { "one": "További {{count}} elem ekkortól: {{time}}", "other": "További {{count}} elem ekkortól: {{time}}" } },
  "overflow": {
    "title": { "one": "További átfedő elemek ({{count}})", "other": "További átfedő elemek ({{count}})" },
    "empty": "Nincs további elem.", "tableLabel": "Átfedő elemek táblázata", "close": "Bezárás", "closeIcon": "Bezárás",
    "viewDetails": "Részletek",
    "column": { "time": "Észlelve", "level": "Súlyosság", "title": "Cím", "description": "Leírás", "actions": "Műveletek" }
  },
  "pagination": { "label": "Lapozás", "previous": "Előző", "next": "Következő", "page": "{{page}}. oldal" },
  "levels": {
    "critical": "Kritikus", "watch": "Figyelés", "monitoring": "Monitorozás", "capacityWatch": "Kapacitásfigyelés",
    "ready": "Kész", "normal": "Normál", "onTarget": "Célértéken", "routine": "Rutin", "resolved": "Megoldva"
  },
  "tags": { "impactsNextShift": "Hatással van a következő műszakra", "carriedOver": "Átvett" },
  "pinnedStrip": { "label": "Rögzített elemek", "announcement": { "one": "{{count}} elem rögzítve", "other": "{{count}} elem rögzítve" } },
  "now": { "label": "Most: {{time}}" },
  "views": { "list": "Lista", "timeline": "Idővonal" },
  "detail": { "close": "Bezárás" },
  "card": { "description": "{{level}}, {{time}}" }
}
```

### 6.6 `frFR` *(draft — needs native review; use U+202F before `:` in production copy)*

```json
{
  "locale": "fr-FR",
  "emptyAll": "Aucune donnée d'agenda disponible.",
  "emptyShift": "Aucun élément dans ce poste.",
  "loading": "Chargement…",
  "errorTitle": "Impossible de charger les éléments.",
  "retry": "Réessayer",
  "shiftHeader": {
    "previous": "Poste précédent", "current": "Poste actuel", "next": "Poste suivant",
    "earlier": { "one": "{{count}} poste plus tôt", "other": "{{count}} postes plus tôt" },
    "later": { "one": "{{count}} poste plus tard", "other": "{{count}} postes plus tard" }
  },
  "nav": {
    "viewPrevious": "Voir le poste précédent", "viewCurrent": "Voir le poste actuel", "viewNext": "Voir le poste suivant",
    "viewEarlier": "Voir un poste plus tôt", "viewLater": "Voir un poste plus tard",
    "toPreviousHint": "Aller au début du poste précédent", "toCurrentHint": "Aller au début du poste actuel",
    "toNextHint": "Aller au début du poste suivant", "toEarlierHint": "Aller au début d'un poste plus tôt",
    "toLaterHint": "Aller au début d'un poste plus tard",
    "noPrevious": "Aucun poste précédent disponible.", "noNext": "Aucun poste suivant disponible.",
    "carriedOverCount": { "one": "({{count}} hérité)", "many": "({{count}} hérités)", "other": "({{count}} hérités)" }
  },
  "scrollTop": "Revenir en haut",
  "timeLabel": { "observed": "Observé à :", "since": "Prêt depuis :" },
  "referenceLabel": "Réf. :",
  "more": { "label": "Plus", "ariaLabel": { "one": "{{count}} autre élément à partir de {{time}}", "many": "{{count}} autres éléments à partir de {{time}}", "other": "{{count}} autres éléments à partir de {{time}}" } },
  "overflow": {
    "title": { "one": "Autres éléments qui se chevauchent ({{count}})", "many": "Autres éléments qui se chevauchent ({{count}})", "other": "Autres éléments qui se chevauchent ({{count}})" },
    "empty": "Aucun autre élément.", "tableLabel": "Tableau des éléments qui se chevauchent", "close": "Fermer", "closeIcon": "Fermer",
    "viewDetails": "Voir les détails",
    "column": { "time": "Observé à", "level": "Gravité", "title": "Titre", "description": "Description", "actions": "Actions" }
  },
  "pagination": { "label": "Pagination", "previous": "Précédent", "next": "Suivant", "page": "Page {{page}}" },
  "levels": {
    "critical": "Critique", "watch": "Surveillance", "monitoring": "Suivi", "capacityWatch": "Surveillance de capacité",
    "ready": "Prêt", "normal": "Normal", "onTarget": "Conforme à l'objectif", "routine": "Routine", "resolved": "Résolu"
  },
  "tags": { "impactsNextShift": "Impacte le poste suivant", "carriedOver": "Hérité" },
  "pinnedStrip": { "label": "Éléments épinglés", "announcement": { "one": "{{count}} élément épinglé", "many": "{{count}} éléments épinglés", "other": "{{count}} éléments épinglés" } },
  "now": { "label": "Maintenant : {{time}}" },
  "views": { "list": "Liste", "timeline": "Chronologie" },
  "detail": { "close": "Fermer" },
  "card": { "description": "{{level}}, {{time}}" }
}
```

### 6.7 `deDE` *(draft — needs native review)*

```json
{
  "locale": "de-DE",
  "emptyAll": "Keine Agendadaten verfügbar.",
  "emptyShift": "Keine Einträge in dieser Schicht.",
  "loading": "Wird geladen …",
  "errorTitle": "Einträge konnten nicht geladen werden.",
  "retry": "Erneut versuchen",
  "shiftHeader": {
    "previous": "Vorherige Schicht", "current": "Aktuelle Schicht", "next": "Nächste Schicht",
    "earlier": { "one": "{{count}} Schicht früher", "other": "{{count}} Schichten früher" },
    "later": { "one": "{{count}} Schicht später", "other": "{{count}} Schichten später" }
  },
  "nav": {
    "viewPrevious": "Vorherige Schicht anzeigen", "viewCurrent": "Aktuelle Schicht anzeigen", "viewNext": "Nächste Schicht anzeigen",
    "viewEarlier": "Frühere Schicht anzeigen", "viewLater": "Spätere Schicht anzeigen",
    "toPreviousHint": "Zum Beginn der vorherigen Schicht scrollen", "toCurrentHint": "Zum Beginn der aktuellen Schicht scrollen",
    "toNextHint": "Zum Beginn der nächsten Schicht scrollen", "toEarlierHint": "Zum Beginn einer früheren Schicht scrollen",
    "toLaterHint": "Zum Beginn einer späteren Schicht scrollen",
    "noPrevious": "Keine vorherige Schicht verfügbar.", "noNext": "Keine nächste Schicht verfügbar.",
    "carriedOverCount": { "one": "({{count}} übernommen)", "other": "({{count}} übernommen)" }
  },
  "scrollTop": "Nach oben scrollen",
  "timeLabel": { "observed": "Beobachtet um:", "since": "Bereit seit:" },
  "referenceLabel": "Ref.:",
  "more": { "label": "Mehr", "ariaLabel": { "one": "{{count}} weiterer Eintrag ab {{time}}", "other": "{{count}} weitere Einträge ab {{time}}" } },
  "overflow": {
    "title": { "one": "Weitere überlappende Einträge ({{count}})", "other": "Weitere überlappende Einträge ({{count}})" },
    "empty": "Keine weiteren Einträge.", "tableLabel": "Tabelle der überlappenden Einträge", "close": "Schließen", "closeIcon": "Schließen",
    "viewDetails": "Details anzeigen",
    "column": { "time": "Beobachtet um", "level": "Schweregrad", "title": "Titel", "description": "Beschreibung", "actions": "Aktionen" }
  },
  "pagination": { "label": "Seitennavigation", "previous": "Zurück", "next": "Weiter", "page": "Seite {{page}}" },
  "levels": {
    "critical": "Kritisch", "watch": "Beobachten", "monitoring": "Überwachung", "capacityWatch": "Kapazität beobachten",
    "ready": "Bereit", "normal": "Normal", "onTarget": "Im Zielbereich", "routine": "Routine", "resolved": "Erledigt"
  },
  "tags": { "impactsNextShift": "Betrifft nächste Schicht", "carriedOver": "Übernommen" },
  "pinnedStrip": { "label": "Angeheftete Einträge", "announcement": { "one": "{{count}} Eintrag angeheftet", "other": "{{count}} Einträge angeheftet" } },
  "now": { "label": "Jetzt: {{time}}" },
  "views": { "list": "Liste", "timeline": "Zeitachse" },
  "detail": { "close": "Schließen" },
  "card": { "description": "{{level}}, {{time}}" }
}
```

### 6.8 `ptPT` *(draft — needs native review)*

```json
{
  "locale": "pt-PT",
  "emptyAll": "Não existem dados de agenda disponíveis.",
  "emptyShift": "Não existem itens neste turno.",
  "loading": "A carregar…",
  "errorTitle": "Não foi possível carregar os itens.",
  "retry": "Tentar novamente",
  "shiftHeader": {
    "previous": "Turno anterior", "current": "Turno atual", "next": "Próximo turno",
    "earlier": { "one": "{{count}} turno antes", "other": "{{count}} turnos antes" },
    "later": { "one": "{{count}} turno depois", "other": "{{count}} turnos depois" }
  },
  "nav": {
    "viewPrevious": "Ver turno anterior", "viewCurrent": "Ver turno atual", "viewNext": "Ver próximo turno",
    "viewEarlier": "Ver um turno antes", "viewLater": "Ver um turno depois",
    "toPreviousHint": "Ir para o início do turno anterior", "toCurrentHint": "Ir para o início do turno atual",
    "toNextHint": "Ir para o início do próximo turno", "toEarlierHint": "Ir para o início de um turno antes",
    "toLaterHint": "Ir para o início de um turno depois",
    "noPrevious": "Não existe turno anterior disponível.", "noNext": "Não existe próximo turno disponível.",
    "carriedOverCount": { "one": "({{count}} herdado)", "other": "({{count}} herdados)" }
  },
  "scrollTop": "Voltar ao topo",
  "timeLabel": { "observed": "Observado às:", "since": "Pronto desde:" },
  "referenceLabel": "Ref.:",
  "more": { "label": "Mais", "ariaLabel": { "one": "Mais {{count}} item a partir das {{time}}", "other": "Mais {{count}} itens a partir das {{time}}" } },
  "overflow": {
    "title": { "one": "Mais itens sobrepostos ({{count}})", "other": "Mais itens sobrepostos ({{count}})" },
    "empty": "Não existem mais itens.", "tableLabel": "Tabela de itens sobrepostos", "close": "Fechar", "closeIcon": "Fechar",
    "viewDetails": "Ver detalhes",
    "column": { "time": "Observado às", "level": "Gravidade", "title": "Título", "description": "Descrição", "actions": "Ações" }
  },
  "pagination": { "label": "Paginação", "previous": "Anterior", "next": "Seguinte", "page": "Página {{page}}" },
  "levels": {
    "critical": "Crítico", "watch": "Vigilância", "monitoring": "Monitorização", "capacityWatch": "Vigilância de capacidade",
    "ready": "Pronto", "normal": "Normal", "onTarget": "No objetivo", "routine": "Rotina", "resolved": "Resolvido"
  },
  "tags": { "impactsNextShift": "Afeta o próximo turno", "carriedOver": "Herdado" },
  "pinnedStrip": { "label": "Itens fixados", "announcement": { "one": "{{count}} item fixado", "other": "{{count}} itens fixados" } },
  "now": { "label": "Agora: {{time}}" },
  "views": { "list": "Lista", "timeline": "Cronologia" },
  "detail": { "close": "Fechar" },
  "card": { "description": "{{level}}, {{time}}" }
}
```
