// SPDX-License-Identifier: MIT
// Writes `src/content/changelog.json` from the package's own `CHANGELOG.md` (docs pack 03 §3.15).
// Changesets writes that file at release time, so before the first release there is nothing to read
// and the page says so. The entries themselves are never translated: they are written in English by
// whoever wrote the changeset, and translating them would make the site disagree with npm.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '..', '..', '..', '..', 'packages/react-scheduler/CHANGELOG.md');
const outDir = resolve(import.meta.dirname, '..', '..', 'src', 'content');

/** One release note: its first line, and the bullets Changesets indents beneath it. */
interface Entry {
  text: string;
  items: string[];
}

/** One released version: its heading, and the groups Changesets writes under it. */
interface Release {
  version: string;
  groups: { title: string; entries: Entry[] }[];
}

export function parse(markdown: string): Release[] {
  const releases: Release[] = [];
  let release: Release | undefined;
  let group: { title: string; entries: Entry[] } | undefined;
  let entry: Entry | undefined;

  for (const line of markdown.replaceAll('\r\n', '\n').split('\n')) {
    const version = /^## +(.+)$/.exec(line);
    const heading = /^### +(.+)$/.exec(line);
    const bullet = /^[-*] +(.+)$/.exec(line);
    const nested = /^\s+[-*] +(.+)$/.exec(line);

    if (version) {
      release = { version: (version[1] as string).trim(), groups: [] };
      releases.push(release);
      group = undefined;
      entry = undefined;
    } else if (heading && release) {
      group = { title: (heading[1] as string).trim(), entries: [] };
      release.groups.push(group);
      entry = undefined;
    } else if (bullet && release) {
      // A release note without a "### Patch Changes" heading above it still needs a group.
      group ??= release.groups[0] ??= { title: '', entries: [] };
      // Changesets starts each note with the commit that added it. On the site that hash links
      // nowhere, so the note starts with its own words; CHANGELOG.md keeps the hash.
      entry = { text: (bullet[1] as string).replace(/^[\da-f]{7,40}: +/, ''), items: [] };
      group.entries.push(entry);
    } else if (nested && entry) {
      entry.items.push((nested[1] as string).trim());
    } else if (entry && /^\s+\S/.test(line)) {
      // A wrapped line belongs to the bullet above it: the last nested one, or the note itself.
      const last = entry.items.length - 1;
      if (last >= 0) entry.items[last] = `${entry.items[last] as string} ${line.trim()}`;
      else entry.text = `${entry.text} ${line.trim()}`;
    }
  }
  return releases;
}

export function writeChangelog(): number {
  mkdirSync(outDir, { recursive: true });
  const releases = existsSync(source) ? parse(readFileSync(source, 'utf8')) : [];
  const contents = `${JSON.stringify({ releases }, null, 2)}\n`;
  const path = resolve(outDir, 'changelog.json');
  if (!existsSync(path) || readFileSync(path, 'utf8') !== contents) writeFileSync(path, contents);
  return releases.length;
}
