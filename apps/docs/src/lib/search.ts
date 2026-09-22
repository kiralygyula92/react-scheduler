// SPDX-License-Identifier: MIT
// Search index shape and scoring (docs pack 11 §10). The index itself is generated per locale by
// `scripts/build-search-index.ts`; this module is what the dialog runs against it. No third-party
// search library: the corpus is a few dozen pages per locale, and the rules below are the spec's.
import type { Locale } from '~/i18n/paths';
import { DEFAULT_LOCALE } from '~/i18n/paths';

export interface IndexHeading {
  readonly id: string;
  readonly text: string;
}

export interface IndexRecord {
  readonly id: string;
  /** Full path inside the site, ready for the router. */
  readonly url: string;
  readonly title: string;
  /** Section label, for grouping results. */
  readonly section: string;
  /** Breadcrumb shown under the title. */
  readonly crumb: string;
  readonly headings: readonly IndexHeading[];
  /** Page prose, truncated when the index is built. */
  readonly text: string;
  /** API symbols and prop names the page documents. */
  readonly symbols?: readonly string[];
}

export interface SearchResult {
  readonly record: IndexRecord;
  /** The page itself, or the heading the match sits under. */
  readonly url: string;
  readonly score: number;
  readonly snippet: string;
  readonly heading?: string;
}

export const MAX_RESULTS = 20;

/** Case- and diacritic-insensitive comparison (11 §10). */
export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function indexUrl(locale: Locale, pluginId: string): string {
  return locale === DEFAULT_LOCALE ? `/${pluginId}/search-index.json` : `/${pluginId}/${locale}/search-index.json`;
}

function words(query: string): string[] {
  return fold(query)
    .split(/\s+/)
    .filter((word) => word !== '');
}

/** ~140 characters around the first match, so a result shows why it matched. */
function snippetOf(text: string, needle: string): string {
  const at = fold(text).indexOf(needle);
  if (at === -1) return text.slice(0, 140);
  const from = Math.max(0, at - 40);
  const slice = text.slice(from, from + 140).trim();
  return from === 0 ? slice : `…${slice}`;
}

/**
 * Exact title match beats a title prefix, which beats a heading, which beats an API name, which
 * beats body text. Every word of a multi-word query has to appear somewhere in the record.
 */
export function search(query: string, records: readonly IndexRecord[]): readonly SearchResult[] {
  const terms = words(query);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];
  for (const record of records) {
    const title = fold(record.title);
    const text = fold(record.text);
    const symbols = (record.symbols ?? []).map(fold);
    const headings = record.headings.map((heading) => ({ ...heading, folded: fold(heading.text) }));
    const haystack = [title, text, ...symbols, ...headings.map((heading) => heading.folded)].join(' ');
    if (!terms.every((term) => haystack.includes(term))) continue;

    const first = terms[0] as string;
    const whole = terms.join(' ');
    const heading = headings.find((candidate) => candidate.folded.includes(first));
    const score =
      title === whole
        ? 100
        : title.startsWith(whole)
          ? 80
          : title.includes(whole)
            ? 60
            : heading !== undefined
              ? 40
              : symbols.some((symbol) => symbol.includes(first))
                ? 30
                : 10;

    results.push({
      record,
      score,
      url: score === 40 && heading !== undefined ? `${record.url}#${heading.id}` : record.url,
      snippet: snippetOf(record.text, first),
      ...(score === 40 && heading !== undefined && { heading: heading.text }),
    });
  }

  return results
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, MAX_RESULTS);
}

/** Splits a text into the runs a result should mark, so the dialog needs no HTML from the index. */
export function marks(text: string, query: string): readonly { text: string; match: boolean }[] {
  const terms = words(query).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return [{ text, match: false }];
  const folded = fold(text);
  const hits: { start: number; end: number }[] = [];
  for (const term of terms) {
    let from = folded.indexOf(term);
    while (from !== -1) {
      if (!hits.some((hit) => from < hit.end && from + term.length > hit.start)) {
        hits.push({ start: from, end: from + term.length });
      }
      from = folded.indexOf(term, from + term.length);
    }
  }
  hits.sort((a, b) => a.start - b.start);

  const runs: { text: string; match: boolean }[] = [];
  let at = 0;
  for (const hit of hits) {
    if (hit.start > at) runs.push({ text: text.slice(at, hit.start), match: false });
    runs.push({ text: text.slice(hit.start, hit.end), match: true });
    at = hit.end;
  }
  if (at < text.length) runs.push({ text: text.slice(at), match: false });
  return runs;
}
