// SPDX-License-Identifier: MIT
// The configuration in the URL (docs pack 04 §4.2). A shared link has to reproduce what its sender
// saw, and a mangled one has to open the Playground rather than break it.
import { describe, expect, it } from 'vitest';
import { decode, EMPTY, encode, search } from '../../src/playground/state';

describe('encode and decode', () => {
  it('round-trips the changed props and the scenario', () => {
    const state = { props: { view: 'timeline', overflowPageSize: '25' }, setup: { dataset: 'crowded' } };
    expect(decode(search(state))).toEqual(state);
  });

  it('writes nothing when nothing has changed', () => {
    expect(encode(EMPTY)).toBe('');
    expect(search(EMPTY)).toBe('');
  });

  it('carries values a query string would otherwise mangle', () => {
    const state = { props: { 'aria-label': 'Tuesday & Wednesday — 08:00' }, setup: {} };
    expect(decode(search(state))).toEqual(state);
  });

  it('opens on the defaults when the parameter is not ours', () => {
    expect(decode('?p=not-base64!!')).toEqual(EMPTY);
    expect(decode('?p=' + Buffer.from('[1,2,3]').toString('base64url'))).toEqual(EMPTY);
    expect(decode('?other=1')).toEqual(EMPTY);
    expect(decode('')).toEqual(EMPTY);
  });

  it('keeps only the strings a control could have produced', () => {
    const encoded = Buffer.from(JSON.stringify({ p: { view: 'list', rogue: { deep: true } } })).toString('base64url');
    expect(decode(`?p=${encoded}`)).toEqual({ props: { view: 'list' }, setup: {} });
  });
});
