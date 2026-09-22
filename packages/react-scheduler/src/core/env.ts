// SPDX-License-Identifier: MIT
// Development-only diagnostics (docs pack 09 §4.5). Bundlers replace `process.env.NODE_ENV`;
// where `process` does not exist (a plain browser module), no warning is emitted.

declare const process: { env: { NODE_ENV?: string } } | undefined;

export function isDev(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
}

const warned = new Set<string>();

/** Logs `message` once per `key` in development builds. */
export function devWarnOnce(key: string, message: string): void {
  if (!isDev() || warned.has(key)) return;
  warned.add(key);
  // eslint-disable-next-line no-console -- development warnings are allowed (09 §4.5)
  console.warn(`[react-scheduler] ${message}`);
}
