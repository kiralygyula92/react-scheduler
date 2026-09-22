// SPDX-License-Identifier: MIT
// Romanian (Romania) strings (Feature Dossier 06 §6.4). Draft: needs native review.
import type { SchedulerLocalization } from '../core/localization';

export const roRO: SchedulerLocalization = {
  locale: 'ro-RO',
  emptyAll: 'Nu există date în agendă.',
  emptyShift: 'Nu există elemente în această tură.',
  loading: 'Se încarcă…',
  errorTitle: 'Elementele nu au putut fi încărcate.',
  retry: 'Reîncearcă',
  shiftHeader: {
    previous: 'Tura anterioară',
    current: 'Tura curentă',
    next: 'Tura următoare',
    earlier: {
      one: 'Cu {{count}} tură înainte',
      few: 'Cu {{count}} ture înainte',
      other: 'Cu {{count}} de ture înainte',
    },
    later: {
      one: 'Cu {{count}} tură mai târziu',
      few: 'Cu {{count}} ture mai târziu',
      other: 'Cu {{count}} de ture mai târziu',
    },
  },
  nav: {
    viewPrevious: 'Vezi tura anterioară',
    viewCurrent: 'Vezi tura curentă',
    viewNext: 'Vezi tura următoare',
    viewEarlier: 'Vezi o tură mai devreme',
    viewLater: 'Vezi o tură mai târziu',
    toPreviousHint: 'Derulează la începutul turei anterioare',
    toCurrentHint: 'Derulează la începutul turei curente',
    toNextHint: 'Derulează la începutul turei următoare',
    toEarlierHint: 'Derulează la începutul unei ture mai devreme',
    toLaterHint: 'Derulează la începutul unei ture mai târziu',
    noPrevious: 'Nu există o tură anterioară.',
    noNext: 'Nu există o tură următoare.',
    carriedOverCount: {
      one: '({{count}} preluat)',
      few: '({{count}} preluate)',
      other: '({{count}} de preluate)',
    },
  },
  scrollTop: 'Derulează sus',
  timeLabel: {
    observed: 'Observat la:',
    since: 'Pregătit din:',
  },
  referenceLabel: 'Ref.:',
  more: {
    label: 'Mai mult',
    ariaLabel: {
      one: 'Încă {{count}} element de la {{time}}',
      few: 'Încă {{count}} elemente de la {{time}}',
      other: 'Încă {{count}} de elemente de la {{time}}',
    },
  },
  overflow: {
    title: {
      one: 'Mai multe elemente suprapuse ({{count}})',
      few: 'Mai multe elemente suprapuse ({{count}})',
      other: 'Mai multe elemente suprapuse ({{count}})',
    },
    empty: 'Nu există alte elemente.',
    tableLabel: 'Tabel cu elemente suprapuse',
    close: 'Închide',
    closeIcon: 'Închide',
    viewDetails: 'Vezi detalii',
    column: {
      time: 'Observat la',
      level: 'Severitate',
      title: 'Titlu',
      description: 'Descriere',
      actions: 'Acțiuni',
    },
  },
  pagination: {
    label: 'Paginare',
    previous: 'Înapoi',
    next: 'Înainte',
    page: 'Pagina {{page}}',
  },
  levels: {
    critical: 'Critic',
    watch: 'Atenție',
    monitoring: 'Monitorizare',
    capacityWatch: 'Atenție capacitate',
    ready: 'Pregătit',
    normal: 'Normal',
    onTarget: 'În țintă',
    routine: 'Rutină',
    resolved: 'Rezolvat',
  },
  tags: {
    impactsNextShift: 'Afectează tura următoare',
    carriedOver: 'Preluat',
  },
  pinnedStrip: {
    label: 'Elemente fixate',
    announcement: {
      one: '{{count}} element fixat',
      few: '{{count}} elemente fixate',
      other: '{{count}} de elemente fixate',
    },
  },
  now: {
    label: 'Acum: {{time}}',
  },
  views: {
    list: 'Listă',
    timeline: 'Cronologie',
  },
  detail: {
    close: 'Închide',
  },
  card: {
    description: '{{level}}, {{time}}',
  },
};
