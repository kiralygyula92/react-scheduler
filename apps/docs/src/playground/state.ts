// SPDX-License-Identifier: MIT
// The Playground's configuration in the URL (docs pack 04 §4.2): `?p=` carries base64url JSON of the
// props that differ from their defaults, and nothing else, so a link reproduces exactly what the
// sender saw and an empty configuration has no query string at all.

/** The changed props, and the scenario Setup chose, as the strings the controls produce. */
export interface PlaygroundState {
  readonly props: Readonly<Record<string, string>>;
  readonly setup: Readonly<Record<string, string>>;
}

export const EMPTY: PlaygroundState = { props: {}, setup: {} };

const PARAM = 'p';

function toBase64Url(text: string): string {
  const binary = String.fromCharCode(...new TextEncoder().encode(text));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.codePointAt(0) ?? 0));
}

/** `""` when nothing has changed, so a fresh Playground keeps a clean URL. */
export function encode(state: PlaygroundState): string {
  const hasProps = Object.keys(state.props).length > 0;
  const hasSetup = Object.keys(state.setup).length > 0;
  if (!hasProps && !hasSetup) return '';
  return toBase64Url(JSON.stringify({ ...(hasProps && { p: state.props }), ...(hasSetup && { s: state.setup }) }));
}

/** Anything unreadable is treated as "nothing chosen": a bad link opens the default Playground. */
export function decode(search: string): PlaygroundState {
  const value = new URLSearchParams(search).get(PARAM);
  if (value === null || value === '') return EMPTY;
  try {
    const parsed = JSON.parse(fromBase64Url(value)) as { p?: unknown; s?: unknown };
    return { props: strings(parsed.p), setup: strings(parsed.s) };
  } catch {
    return EMPTY;
  }
}

function strings(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {};
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) if (typeof entry === 'string') out[key] = entry;
  return out;
}

/** The query string a state produces, ready to hand to `history.replaceState`. */
export function search(state: PlaygroundState): string {
  const encoded = encode(state);
  return encoded === '' ? '' : `?${PARAM}=${encoded}`;
}
