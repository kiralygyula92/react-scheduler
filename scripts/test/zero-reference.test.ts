import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  binaryStrings,
  collectCandidates,
  findDenylisted,
  findGenericPatterns,
  hashTerm,
  parseDenylist,
  scanFile,
  type ZeroReferenceConfig,
} from '../lib/zero-reference.ts';

// Every sample below is assembled at runtime so this file never contains a literal finding.
const SALT = 'unit-salt';
const TERM = ['acme', 'widget'].join(' ');
const config: ZeroReferenceConfig = {
  salt: SALT,
  denylist: new Set([hashTerm(SALT, TERM), hashTerm(SALT, 'zyx-corp')]),
  allowedEmailDomains: ['example.com'],
  allowedEmails: [['noreply', 'anthropic.com'].join('@')],
  allowedHosts: ['github.com', 'vercel.app'],
  allowedLocalPorts: [4173],
};
const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('hashTerm', () => {
  it('hashes sha256("<salt>:" + trimmed, lower-cased term)', () => {
    const expected = createHash('sha256').update(`${SALT}:acme widget`).digest('hex');
    expect(hashTerm(SALT, '  Acme Widget ')).toBe(expected);
  });
});

describe('collectCandidates', () => {
  it('collects raw tokens, identifier sub-tokens and word n-grams up to three words', () => {
    const candidates = collectCandidates('Call foo.bar-baz_qux(now) please');
    for (const term of [
      'foo.bar-baz_qux',
      'bar-baz_qux',
      'foo',
      'baz',
      'qux',
      'foo bar baz',
      'call foo',
      'now please',
    ]) {
      expect(candidates.has(term)).toBe(true);
    }
  });

  it('keeps hyphenated and dotted tokens whole and adds raw 2- and 3-token sequences', () => {
    const candidates = collectCandidates('see docs.acme-tools.test now');
    expect(candidates.has('docs.acme-tools.test')).toBe(true);
    expect(candidates.has('see docs.acme-tools.test now')).toBe(true);
  });

  it('records the first line of each candidate', () => {
    const candidates = collectCandidates('alpha\nbeta\n\ngamma beta');
    expect(candidates.get('beta')).toBe(2);
    expect(candidates.get('gamma')).toBe(4);
  });
});

describe('findDenylisted', () => {
  it('matches multi-word terms across punctuation and case, and reports only a hash prefix', () => {
    const findings = findDenylisted(`intro\nThe ${TERM.toUpperCase().replace(' ', '-')} line`, config);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(2);
    expect(findings[0]?.detail).not.toContain('acme');
    expect(findings[0]?.detail).toMatch(/^hash [0-9a-f]{12}…$/);
  });

  it('matches hyphenated single tokens', () => {
    expect(findDenylisted(`import "${['zyx', 'corp'].join('-')}/lib"`, config)).toHaveLength(1);
  });

  it('reports nothing for clean text', () => {
    expect(findDenylisted('A generic shift scheduler.', config)).toEqual([]);
  });
});

describe('findGenericPatterns', () => {
  const kinds = (text: string): string[] => findGenericPatterns(text, config).map((f) => f.kind);

  it('flags e-mails outside the allowlist', () => {
    expect(kinds(['someone', 'corp.test'].join('@'))).toEqual(['email']);
    expect(kinds(['team', 'example.com'].join('@'))).toEqual([]);
    expect(kinds(`Co-Authored-By: Bot <${['noreply', 'anthropic.com'].join('@')}>`)).toEqual([]);
  });

  it('does not mistake package specifiers for e-mails', () => {
    expect(kinds('typescript@6.0.3 and @types/node@24.13.6')).toEqual([]);
  });

  it('flags URLs whose host is not allowlisted, matching allowed hosts by domain suffix', () => {
    expect(kinds('https:' + '//intranet.corp.test/page')).toEqual(['url']);
    expect(kinds('https:' + '//evilgithub.com/x')).toEqual(['url']);
    expect(kinds('https:' + '//api.github.com/repos and https:' + '//my-site.vercel.app/')).toEqual([]);
  });

  it('ignores sentence punctuation after a bare host', () => {
    expect(kinds('Read the docs at https:' + '//github.com.')).toEqual([]);
    expect(kinds('See https:' + '//intranet.corp.test, then')).toEqual(['url']);
  });

  it('skips template and elided hosts', () => {
    expect(kinds('https:' + '//' + '{{' + 'SITE_DOMAIN' + '}}' + '/x')).toEqual([]);
    expect(kinds('https:' + '//…')).toEqual([]);
  });

  it('flags IPv4 addresses and local ports but not version numbers', () => {
    expect(kinds(`host ${[10, 20, 30, 40].join('.')}`)).toEqual(['ip']);
    expect(kinds(`open ${'localhost'}:${8080}`)).toEqual(['localhost']);
    expect(kinds('version 1.2.3 and 7.0.0-dev.20260421.2 and 1.2.3.4.5')).toEqual([]);
  });

  it('flags JWT-like and key-like strings', () => {
    const jwt = ['eyJ' + 'a'.repeat(12), 'eyJ' + 'b'.repeat(12), 'c'.repeat(12)].join('.');
    expect(kinds(jwt)).toEqual(['jwt']);
    expect(kinds('AKIA' + 'B'.repeat(16))).toEqual(['secret']);
    expect(kinds('ghp' + '_' + 'x'.repeat(36))).toEqual(['secret']);
    expect(kinds('-----BEGIN ' + 'PRIVATE KEY-----')).toEqual(['secret']);
  });

  it('flags absolute user paths', () => {
    expect(kinds(['C:', 'Users', 'someone'].join('\\'))).toEqual(['absolute-path']);
    expect(kinds(['', 'home', 'someone', 'repo'].join('/'))).toEqual(['absolute-path']);
    expect(kinds('import x from "~/shell/doc" and ./home/readme')).toEqual([]);
  });
});

describe('binaryStrings', () => {
  it('extracts printable runs of at least four characters', () => {
    const bytes = new Uint8Array([0, 0x41, 0x42, 1, ...encode('Author acme widget'), 0xff, 0x43]);
    expect(binaryStrings(bytes)).toBe('Author acme widget');
  });
});

describe('scanFile', () => {
  it('scans file names, text content and generic patterns', () => {
    const findings = scanFile({ path: 'docs/zyx-corp/notes.md', content: encode(`x\n${TERM}`), binary: false }, config);
    expect(findings.map((f) => [f.kind, f.line])).toEqual([
      ['denylist', 0],
      ['denylist', 2],
    ]);
  });

  it('checks binary files through their printable strings only', () => {
    const content = new Uint8Array([0x89, 0x50, 0, ...encode(`tEXtAuthor\u0000${TERM}`), 0]);
    const findings = scanFile({ path: 'image.png', content, binary: true }, config);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.detail).toContain('binary strings');
  });
});

describe('parseDenylist', () => {
  it('reads one hex digest per line and ignores blanks and comments', () => {
    const digest = hashTerm(SALT, TERM);
    expect(parseDenylist(`# comment\n${digest.toUpperCase()}\r\n\n`)).toEqual(new Set([digest]));
  });

  it('rejects malformed entries', () => {
    expect(() => parseDenylist('not-a-hash')).toThrow(/Invalid denylist entry/);
  });
});
