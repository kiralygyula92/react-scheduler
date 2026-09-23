// SPDX-License-Identifier: MIT
// French (France) strings (Feature Dossier 06 §6.6). Draft: needs native review. A narrow no-break space (U+202F) precedes ":", as 06 §6.6 asks.
import type { SchedulerLocalization } from '../core/localization';

/**
 * The French (France) locale pack, passed to `localization`.
 *
 * @category Localization
 * @since 1.0.0
 */
export const frFR: SchedulerLocalization = {
  locale: 'fr-FR',
  emptyAll: "Aucune donnée d'agenda disponible.",
  emptyShift: 'Aucun élément dans ce poste.',
  loading: 'Chargement…',
  errorTitle: 'Impossible de charger les éléments.',
  retry: 'Réessayer',
  shiftHeader: {
    previous: 'Poste précédent',
    current: 'Poste actuel',
    next: 'Poste suivant',
    earlier: {
      one: '{{count}} poste plus tôt',
      other: '{{count}} postes plus tôt',
    },
    later: {
      one: '{{count}} poste plus tard',
      other: '{{count}} postes plus tard',
    },
  },
  nav: {
    viewPrevious: 'Voir le poste précédent',
    viewCurrent: 'Voir le poste actuel',
    viewNext: 'Voir le poste suivant',
    viewEarlier: 'Voir un poste plus tôt',
    viewLater: 'Voir un poste plus tard',
    toPreviousHint: 'Aller au début du poste précédent',
    toCurrentHint: 'Aller au début du poste actuel',
    toNextHint: 'Aller au début du poste suivant',
    toEarlierHint: "Aller au début d'un poste plus tôt",
    toLaterHint: "Aller au début d'un poste plus tard",
    noPrevious: 'Aucun poste précédent disponible.',
    noNext: 'Aucun poste suivant disponible.',
    carriedOverCount: {
      one: '({{count}} hérité)',
      many: '({{count}} hérités)',
      other: '({{count}} hérités)',
    },
  },
  scrollTop: 'Revenir en haut',
  timeLabel: {
    observed: 'Observé à :',
    since: 'Prêt depuis :',
  },
  referenceLabel: 'Réf. :',
  more: {
    label: 'Plus',
    ariaLabel: {
      one: '{{count}} autre élément à partir de {{time}}',
      many: '{{count}} autres éléments à partir de {{time}}',
      other: '{{count}} autres éléments à partir de {{time}}',
    },
  },
  overflow: {
    title: {
      one: 'Autres éléments qui se chevauchent ({{count}})',
      many: 'Autres éléments qui se chevauchent ({{count}})',
      other: 'Autres éléments qui se chevauchent ({{count}})',
    },
    empty: 'Aucun autre élément.',
    tableLabel: 'Tableau des éléments qui se chevauchent',
    close: 'Fermer',
    closeIcon: 'Fermer',
    viewDetails: 'Voir les détails',
    column: {
      time: 'Observé à',
      level: 'Gravité',
      title: 'Titre',
      description: 'Description',
      actions: 'Actions',
    },
  },
  pagination: {
    label: 'Pagination',
    previous: 'Précédent',
    next: 'Suivant',
    page: 'Page {{page}}',
  },
  levels: {
    critical: 'Critique',
    watch: 'Surveillance',
    monitoring: 'Suivi',
    capacityWatch: 'Surveillance de capacité',
    ready: 'Prêt',
    normal: 'Normal',
    onTarget: "Conforme à l'objectif",
    routine: 'Routine',
    resolved: 'Résolu',
  },
  tags: {
    impactsNextShift: 'Impacte le poste suivant',
    carriedOver: 'Hérité',
  },
  pinnedStrip: {
    label: 'Éléments épinglés',
    announcement: {
      one: '{{count}} élément épinglé',
      many: '{{count}} éléments épinglés',
      other: '{{count}} éléments épinglés',
    },
  },
  now: {
    label: 'Maintenant : {{time}}',
  },
  views: {
    list: 'Liste',
    timeline: 'Chronologie',
  },
  detail: {
    close: 'Fermer',
  },
  card: {
    description: '{{level}}, {{time}}',
  },
};
