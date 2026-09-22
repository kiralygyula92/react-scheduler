// SPDX-License-Identifier: MIT
// German (Germany) strings (Feature Dossier 06 §6.7). Draft: needs native review.
import type { SchedulerLocalization } from '../core/localization';

export const deDE: SchedulerLocalization = {
  locale: 'de-DE',
  emptyAll: 'Keine Agendadaten verfügbar.',
  emptyShift: 'Keine Einträge in dieser Schicht.',
  loading: 'Wird geladen …',
  errorTitle: 'Einträge konnten nicht geladen werden.',
  retry: 'Erneut versuchen',
  shiftHeader: {
    previous: 'Vorherige Schicht',
    current: 'Aktuelle Schicht',
    next: 'Nächste Schicht',
    earlier: {
      one: '{{count}} Schicht früher',
      other: '{{count}} Schichten früher',
    },
    later: {
      one: '{{count}} Schicht später',
      other: '{{count}} Schichten später',
    },
  },
  nav: {
    viewPrevious: 'Vorherige Schicht anzeigen',
    viewCurrent: 'Aktuelle Schicht anzeigen',
    viewNext: 'Nächste Schicht anzeigen',
    viewEarlier: 'Frühere Schicht anzeigen',
    viewLater: 'Spätere Schicht anzeigen',
    toPreviousHint: 'Zum Beginn der vorherigen Schicht scrollen',
    toCurrentHint: 'Zum Beginn der aktuellen Schicht scrollen',
    toNextHint: 'Zum Beginn der nächsten Schicht scrollen',
    toEarlierHint: 'Zum Beginn einer früheren Schicht scrollen',
    toLaterHint: 'Zum Beginn einer späteren Schicht scrollen',
    noPrevious: 'Keine vorherige Schicht verfügbar.',
    noNext: 'Keine nächste Schicht verfügbar.',
    carriedOverCount: {
      one: '({{count}} übernommen)',
      other: '({{count}} übernommen)',
    },
  },
  scrollTop: 'Nach oben scrollen',
  timeLabel: {
    observed: 'Beobachtet um:',
    since: 'Bereit seit:',
  },
  referenceLabel: 'Ref.:',
  more: {
    label: 'Mehr',
    ariaLabel: {
      one: '{{count}} weiterer Eintrag ab {{time}}',
      other: '{{count}} weitere Einträge ab {{time}}',
    },
  },
  overflow: {
    title: {
      one: 'Weitere überlappende Einträge ({{count}})',
      other: 'Weitere überlappende Einträge ({{count}})',
    },
    empty: 'Keine weiteren Einträge.',
    tableLabel: 'Tabelle der überlappenden Einträge',
    close: 'Schließen',
    closeIcon: 'Schließen',
    viewDetails: 'Details anzeigen',
    column: {
      time: 'Beobachtet um',
      level: 'Schweregrad',
      title: 'Titel',
      description: 'Beschreibung',
      actions: 'Aktionen',
    },
  },
  pagination: {
    label: 'Seitennavigation',
    previous: 'Zurück',
    next: 'Weiter',
    page: 'Seite {{page}}',
  },
  levels: {
    critical: 'Kritisch',
    watch: 'Beobachten',
    monitoring: 'Überwachung',
    capacityWatch: 'Kapazität beobachten',
    ready: 'Bereit',
    normal: 'Normal',
    onTarget: 'Im Zielbereich',
    routine: 'Routine',
    resolved: 'Erledigt',
  },
  tags: {
    impactsNextShift: 'Betrifft nächste Schicht',
    carriedOver: 'Übernommen',
  },
  pinnedStrip: {
    label: 'Angeheftete Einträge',
    announcement: {
      one: '{{count}} Eintrag angeheftet',
      other: '{{count}} Einträge angeheftet',
    },
  },
  now: {
    label: 'Jetzt: {{time}}',
  },
  views: {
    list: 'Liste',
    timeline: 'Zeitachse',
  },
  detail: {
    close: 'Schließen',
  },
  card: {
    description: '{{level}}, {{time}}',
  },
};
