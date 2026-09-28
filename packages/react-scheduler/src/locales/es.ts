// SPDX-License-Identifier: MIT
// Spanish (Spain) strings (Feature Dossier 06 §6.3). The parity keys come from the source; the new keys are drafts that need native review.
import type { SchedulerLocalization } from '../core/localization';

/**
 * The Spanish (Spain) locale pack, passed to `localization`.
 *
 * @category Localization
 * @since 1.0.0
 */
export const esES: SchedulerLocalization = {
  locale: 'es-ES',
  emptyAll: 'No hay nada programado para este día.',
  emptyShift: 'No hay elementos programados para este turno.',
  loading: 'Cargando…',
  errorTitle: 'No se pudieron cargar los elementos.',
  retry: 'Reintentar',
  shiftHeader: {
    previous: 'Turno anterior',
    current: 'Turno actual',
    next: 'Próximo turno',
    earlier: {
      one: '{{count}} turno antes',
      other: '{{count}} turnos antes',
    },
    later: {
      one: '{{count}} turno después',
      other: '{{count}} turnos después',
    },
  },
  nav: {
    viewPrevious: 'Ver turno anterior',
    viewCurrent: 'Ver turno actual',
    viewNext: 'Ver próximo turno',
    viewEarlier: 'Ver un turno antes',
    viewLater: 'Ver un turno después',
    toPreviousHint: 'Ir al inicio del turno anterior',
    toCurrentHint: 'Ir al inicio del turno actual',
    toNextHint: 'Ir al inicio del próximo turno',
    toEarlierHint: 'Ir al inicio de un turno antes',
    toLaterHint: 'Ir al inicio de un turno después',
    noPrevious: 'No hay un turno anterior disponible.',
    noNext: 'No hay un próximo turno disponible.',
    carriedOverCount: {
      one: '({{count}} heredado)',
      other: '({{count}} heredados)',
    },
  },
  scrollTop: 'Volver arriba',
  timeLabel: {
    observed: 'Observado a las:',
    since: 'Listo desde:',
  },
  referenceLabel: 'Ref.:',
  more: {
    label: 'Más',
    ariaLabel: {
      one: '{{count}} elemento más desde las {{time}}',
      other: '{{count}} elementos más desde las {{time}}',
    },
  },
  overflow: {
    title: {
      one: 'Más elementos superpuestos ({{count}})',
      other: 'Más elementos superpuestos ({{count}})',
    },
    empty: 'No hay más elementos.',
    tableLabel: 'Tabla de elementos superpuestos',
    close: 'Cerrar',
    closeIcon: 'Cerrar',
    viewDetails: 'Ver detalles',
    column: {
      time: 'Observado a las',
      level: 'Severidad',
      title: 'Título',
      description: 'Descripción',
      actions: 'Acciones',
    },
  },
  pagination: {
    label: 'Paginación',
    previous: 'Anterior',
    next: 'Siguiente',
    page: 'Página {{page}}',
  },
  levels: {
    critical: 'Crítico',
    watch: 'Vigilancia',
    monitoring: 'Supervisión',
    capacityWatch: 'Vigilancia de capacidad',
    ready: 'Listo',
    normal: 'Normal',
    onTarget: 'En objetivo',
    routine: 'Rutina',
    resolved: 'Resuelto',
  },
  tags: {
    impactsNextShift: 'Afecta al siguiente turno',
    carriedOver: 'Heredado',
  },
  pinnedStrip: {
    label: 'Elementos fijados',
    announcement: {
      one: '{{count}} elemento fijado',
      other: '{{count}} elementos fijados',
    },
  },
  now: {
    label: 'Ahora: {{time}}',
  },
  views: {
    list: 'Lista',
    timeline: 'Cronología',
  },
  detail: {
    close: 'Cerrar',
  },
  card: {
    description: '{{level}}, {{time}}',
  },
};
