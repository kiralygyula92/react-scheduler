// SPDX-License-Identifier: MIT
// Serves `build/client` the way the host does (docs pack 10 §2): trailing slashes, directory index
// files, the `/` → `/{pluginId}/` redirect, Markdown and text content types, and `404` answered
// with the prerendered 404 page of the locale. Used by the E2E suite; no dependency, so CI needs
// nothing beyond Node.
//
// Usage: node scripts/serve.ts [port]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
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

/** The file a URL path maps to, or null when nothing matches. */
function fileFor(pathname: string): string | null {
  const decoded = decodeURIComponent(pathname);
  const direct = resolve(root, `.${decoded}`);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const index = resolve(direct, 'index.html');
  return existsSync(index) ? index : null;
}

/** The 404 page of the locale the URL asked for, so the message is in the right language. */
function notFoundFor(pathname: string): string {
  const segment = pathname.split('/').filter((part) => part !== '')[1] ?? '';
  const localised = resolve(root, pluginId, segment, '404', 'index.html');
  return existsSync(localised) ? localised : resolve(root, pluginId, '404', 'index.html');
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${String(port)}`);

  if (url.pathname === '/') {
    response.writeHead(308, { Location: `/${pluginId}/` });
    response.end();
    return;
  }

  const file = fileFor(url.pathname);
  const target = file ?? notFoundFor(url.pathname);
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
});

server.listen(port, () => {
  console.log(`serve: http://localhost:${String(port)}/${pluginId}/`);
});
