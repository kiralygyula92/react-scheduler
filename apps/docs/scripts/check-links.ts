// SPDX-License-Identifier: MIT
// Every internal link and anchor resolves, in every locale (docs pack 07 §4). It reads the
// prerendered HTML rather than the source, so it sees the links the components build, the ones the
// generated reference builds and the ones a translation writes into a `<link>` tag of `Trans`.
//
// External links are not fetched: a check that reaches the network would fail on someone else's
// outage. Anchors are compared against the ids the same page prerendered.
//
// Usage: node scripts/check-links.ts   (after `pnpm --filter docs build`)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const app = resolve(import.meta.dirname, '..');
const client = resolve(app, 'build', 'client');

interface Page {
  /** `/react-scheduler/hu/api/scheduler/` */
  readonly url: string;
  readonly html: string;
}

function pages(): Page[] {
  const found: Page[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = resolve(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry === 'index.html') {
        const url = `/${path
          .slice(client.length + 1)
          .replaceAll('\\', '/')
          .replace(/index\.html$/, '')}`;
        found.push({ url, html: readFileSync(path, 'utf8') });
      }
    }
  };
  walk(client);
  return found;
}

/** `href="/react-scheduler/api/"` and `href="#props"`, but not `href="https://…"` or `mailto:`. */
function internalLinks(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1] as string)
    .filter((href) => href.startsWith('/') || href.startsWith('#'))
    .filter((href) => !href.startsWith('//'));
}

function idsOf(html: string): Set<string> {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1] as string));
}

function main(): number {
  if (!existsSync(client)) {
    console.error('links: run `pnpm --filter docs build` first');
    return 1;
  }
  const all = pages();
  const known = new Map(all.map((page) => [page.url, page]));
  // Assets the pages link to but that are not pages: the font, the icons, the machine surface.
  const assets = new Set<string>();
  const collect = (dir: string, prefix: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const path = resolve(dir, entry);
      if (statSync(path).isDirectory()) collect(path, `${prefix}${entry}/`);
      else assets.add(`${prefix}${entry}`);
    }
  };
  collect(client, '/');

  const problems: string[] = [];
  for (const page of all) {
    for (const href of internalLinks(page.html)) {
      const [target, anchor] = href.split('#');
      const path = target === '' || target === undefined ? page.url : target;
      const destination = known.get(path);
      if (destination === undefined && !assets.has(path.replace(/\/$/, ''))) {
        problems.push(`${page.url} → ${href} (no such page)`);
        continue;
      }
      if (anchor !== undefined && anchor !== '' && destination !== undefined && !idsOf(destination.html).has(anchor)) {
        problems.push(`${page.url} → ${href} (no such anchor)`);
      }
    }
  }

  const sample = problems.slice(0, 20);
  for (const problem of sample) console.log(`  ${problem}`);
  if (problems.length > sample.length) console.log(`  … and ${String(problems.length - sample.length)} more`);
  console.log(
    problems.length === 0
      ? `links: OK — ${String(all.length)} pages`
      : `links: ${String(problems.length)} broken link(s) in ${String(all.length)} pages`,
  );
  return problems.length === 0 ? 0 : 1;
}

process.exitCode = main();
