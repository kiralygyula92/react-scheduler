// SPDX-License-Identifier: MIT
// `t(key, vars?)` for plain strings — labels, attributes, document titles (docs pack 11 §9).
// Messages with inline markup go through `Trans` instead.
import { useMemo } from 'react';
import { format, type Vars } from './format';
import { useI18n } from './I18nProvider';
import { lookup } from './locales';

export interface TFunction {
  (key: string, vars?: Vars): string;
  /** Whether the key exists in this namespace; used where a label may come from two namespaces. */
  has(key: string): boolean;
  /** The raw message, for `Trans`, which parses the markup itself. */
  raw(key: string): string | undefined;
  /** An array key, for `List` and `Table`. */
  list(key: string): readonly string[];
}

/** What a key that no locale file defines looks like on the page. */
export function missingKey(namespace: string, key: string): string {
  return `⟦${namespace}:${key}⟧`;
}

export function useT(namespace: string): TFunction {
  const { locale, bundles } = useI18n();
  return useMemo(() => {
    const bundle = bundles[namespace];
    const raw = (key: string): string | undefined => {
      const value = lookup(bundle, key);
      return typeof value === 'string' ? value : undefined;
    };
    const t = (key: string, vars: Vars = {}): string => {
      const message = raw(key);
      if (message === undefined) return missingKey(namespace, key);
      return format(message, vars, locale);
    };
    return Object.assign(t, {
      has: (key: string) => raw(key) !== undefined,
      raw,
      list: (key: string): readonly string[] => {
        const value = lookup(bundle, key);
        return Array.isArray(value) ? (value as readonly string[]) : [];
      },
    });
  }, [bundles, namespace, locale]);
}
