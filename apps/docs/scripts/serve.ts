// SPDX-License-Identifier: MIT
// Serves `build/client` the way the host does (docs pack 10 §2): trailing slashes, directory index
// files, the `/` → `/{pluginId}/` redirect, Markdown and text content types, and `404` answered
// with the prerendered 404 page of the locale. Used by the E2E suite; no dependency, so CI needs
// nothing beyond Node.
//
// It answers on the loopback interface only and never outside `build/client`: an encoded `../`
// used to reach any file on the disk, from any machine on the network.
//
// Usage: node scripts/serve.ts [port]
import { lookup } from 'node:dns/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { createGzip } from 'node:zlib';
import navigation from '../src/content/nav.json' with { type: 'json' };

const port = Number(process.argv[2] ?? process.env['PORT'] ?? 4173);
const root = resolve(import.meta.dirname, '..', 'build', 'client');
const pluginId = navigation.pluginId;

const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.data': 'text/x-script; charset=utf-8',
};

/** What the host compresses, and what it leaves alone because it is already compressed. */
const COMPRESSED = new Set(['.html', '.js', '.css', '.json', '.md', '.txt', '.svg', '.xml', '.data']);

/** Whether a resolved path is `build/client` itself or inside it. */
function inside(path: string): boolean {
  return path === root || path.startsWith(root + sep);
}

/** The file a URL path maps to, or null when nothing matches — including anything outside the root. */
function fileFor(pathname: string): string | null {
  const direct = resolve(root, `.${pathname}`);
  if (!inside(direct)) return null;
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const index = resolve(direct, 'index.html');
  return existsSync(index) ? index : null;
}

/** The 404 page of the locale the URL asked for, so the message is in the right language. */
function notFoundFor(pathname: string): string {
  const fallback = resolve(root, pluginId, '404', 'index.html');
  const segment = pathname.split('/').filter((part) => part !== '')[1] ?? '';
  const localised = resolve(root, pluginId, segment, '404', 'index.html');
  return inside(localised) && existsSync(localised) ? localised : fallback;
}

function handle(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url ?? '/', `http://localhost:${String(port)}`);
  // A malformed escape used to throw here and take the whole server down with one request.
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  if (url.pathname === '/') {
    response.writeHead(308, { Location: `/${pluginId}/` });
    response.end();
    return;
  }

  const file = fileFor(pathname);
  const target = file ?? notFoundFor(pathname);
  const status = file === null ? 404 : 200;
  const type = TYPES[extname(target)] ?? 'application/octet-stream';
  // The host serves text compressed, and a page measured against raw bytes is measured against a
  // transfer that never happens (docs pack 07 §1 is a gzipped budget).
  const gzip = COMPRESSED.has(extname(target)) && (request.headers['accept-encoding'] ?? '').includes('gzip');
  response.writeHead(status, {
    'Content-Type': type,
    ...(gzip && { 'Content-Encoding': 'gzip' }),
    // The hashed assets are immutable on the host (`vercel.json`), and a measurement taken without
    // that says more about this server than about the site.
    ...(url.pathname.startsWith('/assets/') && { 'Cache-Control': 'public, max-age=31536000, immutable' }),
    Vary: 'Accept-Encoding',
  });
  const stream = createReadStream(target);
  if (gzip) stream.pipe(createGzip()).pipe(response);
  else stream.pipe(response);
}

// `localhost` resolves to the IPv6 loopback for some clients and the IPv4 one for others, so every
// address it resolves to is served — and nothing else. A machine that resolves an IPv6 address it
// cannot bind simply skips it.
const hosts = new Map((await lookup('localhost', { all: true })).map((entry) => [entry.address, entry.family]));
for (const [host, family] of hosts) {
  const server = createServer(handle);
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (family === 6 && (error.code === 'EADDRNOTAVAIL' || error.code === 'EAFNOSUPPORT')) return;
    throw error;
  });
  server.listen(port, host);
}
console.log(`serve: http://localhost:${String(port)}/${pluginId}/`);
