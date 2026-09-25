// SPDX-License-Identifier: MIT
// The Changelog page is built from what Changesets writes into CHANGELOG.md. The shapes below are the
// ones its default changelog produces: a commit hash before each note, and every further line of the
// changeset indented under it — including a nested list after a blank line.
import { describe, expect, it } from 'vitest';
import { parse } from '../../scripts/lib/changelog.ts';

const RELEASE = `# @react-schedulerkit/react-scheduler

## 1.1.0

### Minor Changes

- 1a2b3c4: Adds a thing.

  - **First**: one part,
    wrapped onto a second line.
  - **Second**: another part.

### Patch Changes

- 5d6e7f8: Fixes a thing
  that was described on two lines.

## 1.0.0

### Major Changes

- e79e564: First stable release.
`;

describe('parse', () => {
  it('reads every version, newest first, with its groups', () => {
    const releases = parse(RELEASE);
    expect(releases.map((release) => release.version)).toEqual(['1.1.0', '1.0.0']);
    expect(releases[0]?.groups.map((group) => group.title)).toEqual(['Minor Changes', 'Patch Changes']);
  });

  it('keeps the nested bullets of a note, joined across wrapped lines', () => {
    const [entry] = parse(RELEASE)[0]?.groups[0]?.entries ?? [];
    expect(entry).toEqual({
      text: 'Adds a thing.',
      items: ['**First**: one part, wrapped onto a second line.', '**Second**: another part.'],
    });
  });

  it('joins a note written on several lines and drops the commit hash', () => {
    expect(parse(RELEASE)[0]?.groups[1]?.entries).toEqual([
      { text: 'Fixes a thing that was described on two lines.', items: [] },
    ]);
    expect(parse(RELEASE)[1]?.groups[0]?.entries[0]?.text).toBe('First stable release.');
  });

  it('reads Windows line endings the same way', () => {
    expect(parse(RELEASE.replaceAll('\n', '\r\n'))).toEqual(parse(RELEASE));
  });

  it('gives a note with no group heading a group of its own', () => {
    expect(parse('## 0.1.0\n\n- A note.\n')).toEqual([
      { version: '0.1.0', groups: [{ title: '', entries: [{ text: 'A note.', items: [] }] }] },
    ]);
  });

  it('is empty before the first release', () => {
    expect(parse('')).toEqual([]);
  });
});
