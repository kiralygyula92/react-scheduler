// SPDX-License-Identifier: MIT
// Hungarian (Hungary) strings (Feature Dossier 06 §6.5). Draft: needs native review.
import type { SchedulerLocalization } from '../core/localization';

export const huHU: SchedulerLocalization = {
  locale: 'hu-HU',
  emptyAll: 'Nincs elérhető napirendi adat.',
  emptyShift: 'Ebben a műszakban nincs elem.',
  loading: 'Betöltés…',
  errorTitle: 'Az elemeket nem sikerült betölteni.',
  retry: 'Újra',
  shiftHeader: {
    previous: 'Előző műszak',
    current: 'Aktuális műszak',
    next: 'Következő műszak',
    earlier: {
      one: '{{count}} műszakkal korábban',
      other: '{{count}} műszakkal korábban',
    },
    later: {
      one: '{{count}} műszakkal később',
      other: '{{count}} műszakkal később',
    },
  },
  nav: {
    viewPrevious: 'Előző műszak megtekintése',
    viewCurrent: 'Aktuális műszak megtekintése',
    viewNext: 'Következő műszak megtekintése',
    viewEarlier: 'Korábbi műszak megtekintése',
    viewLater: 'Későbbi műszak megtekintése',
    toPreviousHint: 'Görgetés az előző műszak elejére',
    toCurrentHint: 'Görgetés az aktuális műszak elejére',
    toNextHint: 'Görgetés a következő műszak elejére',
    toEarlierHint: 'Görgetés egy korábbi műszak elejére',
    toLaterHint: 'Görgetés egy későbbi műszak elejére',
    noPrevious: 'Nincs előző műszak.',
    noNext: 'Nincs következő műszak.',
    carriedOverCount: {
      one: '({{count}} átvett)',
      other: '({{count}} átvett)',
    },
  },
  scrollTop: 'Vissza a tetejére',
  timeLabel: {
    observed: 'Észlelve:',
    since: 'Kész ekkortól:',
  },
  referenceLabel: 'Hiv.:',
  more: {
    label: 'Több',
    ariaLabel: {
      one: 'További {{count}} elem ekkortól: {{time}}',
      other: 'További {{count}} elem ekkortól: {{time}}',
    },
  },
  overflow: {
    title: {
      one: 'További átfedő elemek ({{count}})',
      other: 'További átfedő elemek ({{count}})',
    },
    empty: 'Nincs további elem.',
    tableLabel: 'Átfedő elemek táblázata',
    close: 'Bezárás',
    closeIcon: 'Bezárás',
    viewDetails: 'Részletek',
    column: {
      time: 'Észlelve',
      level: 'Súlyosság',
      title: 'Cím',
      description: 'Leírás',
      actions: 'Műveletek',
    },
  },
  pagination: {
    label: 'Lapozás',
    previous: 'Előző',
    next: 'Következő',
    page: '{{page}}. oldal',
  },
  levels: {
    critical: 'Kritikus',
    watch: 'Figyelés',
    monitoring: 'Monitorozás',
    capacityWatch: 'Kapacitásfigyelés',
    ready: 'Kész',
    normal: 'Normál',
    onTarget: 'Célértéken',
    routine: 'Rutin',
    resolved: 'Megoldva',
  },
  tags: {
    impactsNextShift: 'Hatással van a következő műszakra',
    carriedOver: 'Átvett',
  },
  pinnedStrip: {
    label: 'Rögzített elemek',
    announcement: {
      one: '{{count}} elem rögzítve',
      other: '{{count}} elem rögzítve',
    },
  },
  now: {
    label: 'Most: {{time}}',
  },
  views: {
    list: 'Lista',
    timeline: 'Idővonal',
  },
  detail: {
    close: 'Bezárás',
  },
  card: {
    description: '{{level}}, {{time}}',
  },
};
