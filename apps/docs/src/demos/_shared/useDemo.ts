// SPDX-License-Identifier: MIT
// What every demo needs and no demo should repeat (docs pack 04 §1): the package's locale pack for
// the language the page is in, the translated sample vocabulary, and one fixed day so that the
// prerendered demo, its hydrated copy and the screenshots all show the same schedule.
import { useMemo } from 'react';
import type { SchedulerItem, SchedulerLocalization } from '@react-schedulerkit/react-scheduler';
import { deDE, enUS, esES, frFR, huHU, ptPT, roRO } from '@react-schedulerkit/react-scheduler/locales';
import { useI18n } from '~/i18n/I18nProvider';
import { useT } from '~/i18n/useT';
import { createSampleItems, type SampleOptions } from './data';
import '@react-schedulerkit/react-scheduler/styles.css';

const PACKS: Readonly<Record<string, SchedulerLocalization>> = {
  en: enUS,
  ro: roRO,
  hu: huHU,
  es: esES,
  fr: frFR,
  de: deDE,
  pt: ptPT,
};

/**
 * The day every demo shows: a Tuesday, far enough away that no reader mistakes it for live data
 * (Feature Dossier 08: dates in 2031). Built from parts, so it is midnight where the reader is.
 */
const DEMO_DAY = new Date(2031, 2, 11);

/** What the demos treat as the current moment: inside the morning shift of that day. */
const DEMO_NOW = new Date(2031, 2, 11, 10, 20);

export interface Demo {
  /** The strings of `locales/{lng}/demos.json`. */
  readonly t: ReturnType<typeof useT>;
  readonly localization: SchedulerLocalization;
  /** Every pack by site language, for the one page that lets the reader switch it: the Playground. */
  readonly packs: Readonly<Record<string, SchedulerLocalization>>;
  /** The moment the scheduler shows: the shift that holds it is the one rendered. */
  readonly date: Date;
  readonly now: Date;
  /** The timestamp of an hour of the demo day: `at(6)` is 06:00, `at(22.5)` is 22:30. */
  readonly at: (hour: number) => number;
  /** `createSampleItems` with the translated vocabulary already filled in. */
  readonly items: (options: Omit<SampleOptions, 'titles' | 'describe'>) => SchedulerItem[];
}

export function useDemo(): Demo {
  const { locale } = useI18n();
  const t = useT('demos');
  return useMemo(
    () => ({
      t,
      localization: PACKS[locale] ?? enUS,
      packs: PACKS,
      date: DEMO_NOW,
      now: DEMO_NOW,
      at: (hour: number) => DEMO_DAY.getTime() + hour * 3_600_000,
      items: (options: Omit<SampleOptions, 'titles' | 'describe'>) =>
        createSampleItems({
          ...options,
          titles: t.list('sample.titles'),
          // The title keeps its own casing: lowercasing it would be wrong in German and Hungarian.
          describe: (title) => t('sample.description', { title }),
        }),
    }),
    [locale, t],
  );
}
