// SPDX-License-Identifier: MIT
// Locale bundles (docs pack 11 §9). Every namespace is a JSON file under `src/locales/{lng}/`,
// imported lazily so a route's loader fetches only what that route renders — during the prerender
// this fills the static HTML, and on a client navigation it is one small request.
import type { Locale } from './paths';

/** A namespace's messages: nested objects, addressed with dotted keys. */
export type Bundle = Readonly<Record<string, unknown>>;

const modules = import.meta.glob('/src/locales/*/**/*.json') as Readonly<
  Record<string, () => Promise<{ default: Bundle }>>
>;

function key(locale: Locale, namespace: string): string {
  return `/src/locales/${locale}/${namespace}.json`;
}

export function hasBundle(locale: Locale, namespace: string): boolean {
  return key(locale, namespace) in modules;
}

export async function loadBundle(locale: Locale, namespace: string): Promise<Bundle> {
  const load = modules[key(locale, namespace)];
  if (load === undefined) throw new Error(`Missing locale file: ${key(locale, namespace)}`);
  return (await load()).default;
}

/** Loads several namespaces at once; the result is what `I18nProvider` takes. */
export async function loadBundles(locale: Locale, namespaces: readonly string[]): Promise<Record<string, Bundle>> {
  const loaded = await Promise.all(namespaces.map((namespace) => loadBundle(locale, namespace)));
  return Object.fromEntries(namespaces.map((namespace, index) => [namespace, loaded[index] as Bundle]));
}

/** Resolves a dotted key inside a bundle. */
export function lookup(bundle: Bundle | undefined, path: string): unknown {
  let current: unknown = bundle;
  for (const part of path.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
