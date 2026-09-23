// SPDX-License-Identifier: MIT
// Writes `src/content/changelog.json` from the package's own `CHANGELOG.md` (docs pack 03 §3.15).
// Changesets writes that file at release time, so before the first release there is nothing to read
// and the page says so. The entries themselves are never translated: they are written in English by
// whoever wrote the changeset, and translating them would make the site disagree with npm.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '..', '..', '..', '..', 'packages/react-scheduler/CHANGELOG.md');
const outDir = resolve(import.meta.dirname, '..', '..', 'src', 'content');

/** One released version: its heading, and the groups Changesets writes under it. */
interface Release {
  version: string;
  groups: { title: string; entries: string[] }[];
}

function parse(markdown: string): Release[] {
  const releases: Release[] = [];
  let release: Release | undefined;
  let group: { title: string; entries: string[] } | undefined;
  let entry = '';

  const flush = (): void => {
    if (entry.trim() !== '' && group) group.entries.push(entry.trim());
    entry = '';
  };

  for (const line of markdown.split('\n')) {
    const version = /^## +(.+)$/.exec(line);
    const heading = /^### +(.+)$/.exec(line);
    const bullet = /^[-*] +(.+)$/.exec(line);

    if (version) {
      flush();
      release = { version: version[1] as string, groups: [] };
      releases.push(release);
      group = undefined;
    } else if (heading && release) {
      flush();
      group = { title: heading[1] as string, entries: [] };
      release.groups.push(group);
    } else if (bullet && release) {
      flush();
      // A release note without a "### Patch Changes" heading above it still needs a group.
      group ??= release.groups[0] ??= { title: '', entries: [] };
      entry = bullet[1] as string;
    } else if (entry !== '' && line.trim() !== '') {
      entry += ` ${line.trim()}`;
    } else {
      flush();
    }
  }
  flush();
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
