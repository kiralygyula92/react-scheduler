// SPDX-License-Identifier: MIT
// Holds the locale and the namespaces the current route loaded (docs pack 11 §9). Nothing here
// falls back to English: a missing key stays visible as `⟦ns:key⟧` so `check-i18n` can fail on it.
import { createContext, use } from 'react';
import type { Bundle } from './locales';
import type { Locale } from './paths';

export interface I18n {
  readonly locale: Locale;
  readonly bundles: Readonly<Record<string, Bundle>>;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ value, children }: { value: I18n; children: React.ReactNode }): React.ReactElement {
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18n {
  const value = use(I18nContext);
  if (value === null) throw new Error('useI18n was called outside I18nProvider');
  return value;
}
