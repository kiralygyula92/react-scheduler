// SPDX-License-Identifier: MIT
// Zero-reference scan (docs pack 09 §8, Feature Dossier 09 §7).
import { createHash } from 'node:crypto';

export interface ZeroReferenceConfig {
  salt: string;
  /** Lower-case hex SHA-256 digests of `salt + ":" + term`. */
  denylist: ReadonlySet<string>;
  allowedEmailDomains: readonly string[];
  allowedEmails: readonly string[];
  /** Host suffixes: `github.com` allows `github.com` and `api.github.com`. */
  allowedHosts: readonly string[];
  /** Ports this repository serves itself on, which are not a leaked address. */
  allowedLocalPorts: readonly number[];
}

type FindingKind = 'denylist' | 'email' | 'url' | 'ip' | 'localhost' | 'jwt' | 'secret' | 'absolute-path';

export interface Finding {
  kind: FindingKind;
  line: number;
  /** Denylist findings carry a hash prefix only; the term itself is never reported. */
  detail: string;
}

export function hashTerm(salt: string, term: string): string {
  return createHash('sha256').update(`${salt}:${term.trim().toLowerCase()}`).digest('hex');
}

/** Maps a character offset to a 1-based line number. */
function lineLocator(text: string): (offset: number) => number {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if ((starts[mid] ?? 0) <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

const RAW_TOKEN = /[^\s"'`()[\]{}<>,;|=]+/g;
const RAW_TRIM = /^[^a-z0-9_$@-]+|[^a-z0-9_$@-]+$/g;
const SUB_TOKEN_SPLIT = /[^a-z0-9_$-]+/;
const WORD = /[a-z0-9]+/g;

/**
 * Every candidate term of a text with the line it first appears on. The text is lower-cased.
 * Candidates are the union of the Dossier's rules (raw tokens, identifier sub-tokens, word
 * 1/2/3-grams) and the docs pack's (raw tokens kept whole, plus 2- and 3-token sequences).
 */
export function collectCandidates(input: string): Map<string, number> {
  const text = input.toLowerCase();
  const lineOf = lineLocator(text);
  const candidates = new Map<string, number>();
  const add = (term: string, line: number): void => {
    if (term.length > 0 && !candidates.has(term)) candidates.set(term, line);
  };

  const raw: { token: string; line: number }[] = [];
  for (const match of text.matchAll(RAW_TOKEN)) {
    const token = match[0].replace(RAW_TRIM, '');
    if (token.length === 0) continue;
    const line = lineOf(match.index);
    raw.push({ token, line });
    add(token, line);
    for (const sub of token.split(SUB_TOKEN_SPLIT)) add(sub, line);
  }
  for (let i = 0; i < raw.length; i++) {
    const first = raw[i];
    if (!first) continue;
    const second = raw[i + 1];
    const third = raw[i + 2];
    if (second) add(`${first.token} ${second.token}`, first.line);
    if (second && third) add(`${first.token} ${second.token} ${third.token}`, first.line);
  }

  const words: { word: string; line: number }[] = [];
  for (const match of text.matchAll(WORD)) words.push({ word: match[0], line: lineOf(match.index) });
  for (let i = 0; i < words.length; i++) {
    const first = words[i];
    if (!first) continue;
    const second = words[i + 1];
    const third = words[i + 2];
    add(first.word, first.line);
    if (second) add(`${first.word} ${second.word}`, first.line);
    if (second && third) add(`${first.word} ${second.word} ${third.word}`, first.line);
  }
  return candidates;
}

export function findDenylisted(text: string, config: Pick<ZeroReferenceConfig, 'salt' | 'denylist'>): Finding[] {
  const findings: Finding[] = [];
  for (const [term, line] of collectCandidates(text)) {
    const hash = hashTerm(config.salt, term);
    if (config.denylist.has(hash)) findings.push({ kind: 'denylist', line, detail: `hash ${hash.slice(0, 12)}…` });
  }
  return findings;
}

/** Printable ASCII runs of at least `minLength` characters, one per line (like `strings`). */
export function binaryStrings(content: Uint8Array, minLength = 4): string {
  const runs: string[] = [];
  let current = '';
  for (const byte of content) {
    if (byte >= 0x20 && byte <= 0x7e) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= minLength) runs.push(current);
      current = '';
    }
  }
  if (current.length >= minLength) runs.push(current);
  return runs.join('\n');
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/gi;
const URL = /\bhttps?:\/\/([^\s/"'`<>()[\]{}|\\^]+)/gi;
const IPV4 = /(?<![\w.-])(?:\d{1,3}\.){3}\d{1,3}(?![\w.-]*\d)/g;
const LOCALHOST_PORT = /\blocalhost:\d+/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const SECRETS: readonly RegExp[] = [
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
  /\bnpm_[A-Za-z0-9]{36}\b/g,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
];
const ABSOLUTE_PATHS: readonly RegExp[] = [
  /(?<![A-Za-z0-9])[A-Za-z]:\\[A-Za-z0-9._ -]+/g,
  /(?<![A-Za-z0-9])[A-Za-z]:\/[A-Za-z0-9._ -]+\//g,
  /(?<![\w.~-])\/(?:Users|home)\/[A-Za-z0-9._-]+/g,
];

function mask(value: string): string {
  return value.length <= 4 ? '…' : `${value.slice(0, 4)}…`;
}

function isIpv4(candidate: string): boolean {
  return candidate.split('.').every((octet) => Number(octet) <= 255);
}

function hostAllowed(host: string, allowedHosts: readonly string[]): boolean {
  // Sentence punctuation right after a bare domain (a URL ending a sentence) is not part of the host.
  const bare = host
    .toLowerCase()
    .replace(/[.,:;!?]+$/, '')
    .replace(/:\d+$/, '')
    .replace(/^[^@]*@/, '');
  return allowedHosts.some((allowed) => bare === allowed || bare.endsWith(`.${allowed}`));
}

/** Generic patterns: e-mails, URLs, IPs, local ports, tokens, keys and absolute user paths. */
export function findGenericPatterns(text: string, config: ZeroReferenceConfig): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split('\n');
  lines.forEach((content, index) => {
    const line = index + 1;
    for (const match of content.matchAll(EMAIL)) {
      const email = match[0].toLowerCase();
      const domain = email.slice(email.indexOf('@') + 1);
      const allowed =
        config.allowedEmails.includes(email) ||
        config.allowedEmailDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
      if (!allowed) findings.push({ kind: 'email', line, detail: mask(email) });
    }
    for (const match of content.matchAll(URL)) {
      const host = match[1] ?? '';
      // Template hosts (a dictionary key in braces), interpolated ones (`localhost:${port}`) and
      // elided ones (https://…) are not addresses.
      if (host.length === 0 || host.startsWith('…') || host.startsWith('$') || host.endsWith('$')) continue;
      if (!hostAllowed(host, config.allowedHosts)) findings.push({ kind: 'url', line, detail: mask(host) });
    }
    for (const match of content.matchAll(IPV4)) {
      if (isIpv4(match[0])) findings.push({ kind: 'ip', line, detail: mask(match[0]) });
    }
    for (const match of content.matchAll(LOCALHOST_PORT)) {
      const port = Number(match[0].split(':')[1]);
      if (config.allowedLocalPorts.includes(port)) continue;
      findings.push({ kind: 'localhost', line, detail: match[0].toLowerCase() });
    }
    for (const match of content.matchAll(JWT)) findings.push({ kind: 'jwt', line, detail: mask(match[0]) });
    for (const pattern of SECRETS) {
      for (const match of content.matchAll(pattern)) findings.push({ kind: 'secret', line, detail: mask(match[0]) });
    }
    for (const pattern of ABSOLUTE_PATHS) {
      for (const match of content.matchAll(pattern)) {
        findings.push({ kind: 'absolute-path', line, detail: mask(match[0]) });
      }
    }
  });
  return findings;
}

export interface ScanTarget {
  path: string;
  content: Uint8Array;
  binary: boolean;
}

export interface FileFinding extends Finding {
  path: string;
}

/**
 * Scans one file: its path (names are metadata too), then its content. Binary files are
 * reduced to their printable strings and checked against the denylist only.
 */
export function scanFile(target: ScanTarget, config: ZeroReferenceConfig): FileFinding[] {
  const findings: FileFinding[] = [];
  for (const finding of findDenylisted(target.path, config)) {
    findings.push({ ...finding, path: target.path, line: 0, detail: `${finding.detail} (file name)` });
  }
  if (target.binary) {
    for (const finding of findDenylisted(binaryStrings(target.content), config)) {
      findings.push({ ...finding, path: target.path, line: 0, detail: `${finding.detail} (binary strings)` });
    }
    return findings;
  }
  const text = new TextDecoder().decode(target.content);
  for (const finding of findDenylisted(text, config)) findings.push({ ...finding, path: target.path });
  for (const finding of findGenericPatterns(text, config)) findings.push({ ...finding, path: target.path });
  return findings;
}

export function parseDenylist(content: string): Set<string> {
  const hashes = new Set<string>();
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim().toLowerCase();
    if (line.length === 0 || line.startsWith('#')) continue;
    if (!/^[0-9a-f]{64}$/.test(line)) throw new Error(`Invalid denylist entry: ${line.slice(0, 16)}…`);
    hashes.add(line);
  }
  return hashes;
}
