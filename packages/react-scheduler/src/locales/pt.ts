// SPDX-License-Identifier: MIT
// Portuguese (Portugal) strings (Feature Dossier 06 §6.8). Draft: needs native review.
import type { SchedulerLocalization } from '../core/localization';

/**
 * The Portuguese (Portugal) locale pack, passed to `localization`.
 *
 * @category Localization
 * @since 1.0.0
 */
export const ptPT: SchedulerLocalization = {
  locale: 'pt-PT',
  emptyAll: 'Não há nada agendado para este dia.',
  emptyShift: 'Não existem itens neste turno.',
  loading: 'A carregar…',
  errorTitle: 'Não foi possível carregar os itens.',
  retry: 'Tentar novamente',
  shiftHeader: {
    previous: 'Turno anterior',
    current: 'Turno atual',
    next: 'Próximo turno',
    earlier: {
      one: '{{count}} turno antes',
      other: '{{count}} turnos antes',
    },
    later: {
      one: '{{count}} turno depois',
      other: '{{count}} turnos depois',
    },
  },
  nav: {
    viewPrevious: 'Ver turno anterior',
    viewCurrent: 'Ver turno atual',
    viewNext: 'Ver próximo turno',
    viewEarlier: 'Ver um turno antes',
    viewLater: 'Ver um turno depois',
    toPreviousHint: 'Ir para o início do turno anterior',
    toCurrentHint: 'Ir para o início do turno atual',
    toNextHint: 'Ir para o início do próximo turno',
    toEarlierHint: 'Ir para o início de um turno antes',
    toLaterHint: 'Ir para o início de um turno depois',
    noPrevious: 'Não existe turno anterior disponível.',
    noNext: 'Não existe próximo turno disponível.',
    carriedOverCount: {
      one: '({{count}} herdado)',
      other: '({{count}} herdados)',
    },
  },
  scrollTop: 'Voltar ao topo',
  timeLabel: {
    observed: 'Observado às:',
    since: 'Pronto desde:',
  },
  referenceLabel: 'Ref.:',
  more: {
    label: 'Mais',
    ariaLabel: {
      one: 'Mais {{count}} item a partir das {{time}}',
      other: 'Mais {{count}} itens a partir das {{time}}',
    },
  },
  overflow: {
    title: {
      one: 'Mais itens sobrepostos ({{count}})',
      other: 'Mais itens sobrepostos ({{count}})',
    },
    empty: 'Não existem mais itens.',
    tableLabel: 'Tabela de itens sobrepostos',
    close: 'Fechar',
    closeIcon: 'Fechar',
    viewDetails: 'Ver detalhes',
    column: {
      time: 'Observado às',
      level: 'Gravidade',
      title: 'Título',
      description: 'Descrição',
      actions: 'Ações',
    },
  },
  pagination: {
    label: 'Paginação',
    previous: 'Anterior',
    next: 'Seguinte',
    page: 'Página {{page}}',
  },
  levels: {
    critical: 'Crítico',
    watch: 'Vigilância',
    monitoring: 'Monitorização',
    capacityWatch: 'Vigilância de capacidade',
    ready: 'Pronto',
    normal: 'Normal',
    onTarget: 'No objetivo',
    routine: 'Rotina',
    resolved: 'Resolvido',
  },
  tags: {
    impactsNextShift: 'Afeta o próximo turno',
    carriedOver: 'Herdado',
  },
  pinnedStrip: {
    label: 'Itens fixados',
    announcement: {
      one: '{{count}} item fixado',
      other: '{{count}} itens fixados',
    },
  },
  now: {
    label: 'Agora: {{time}}',
  },
  views: {
    list: 'Lista',
    timeline: 'Cronologia',
  },
  detail: {
    close: 'Fechar',
  },
  card: {
    description: '{{level}}, {{time}}',
  },
};
