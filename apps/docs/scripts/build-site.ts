// SPDX-License-Identifier: MIT
// Runs `react-router build`, which prerenders every route through a local preview server.
//
// The prerender opens one connection per page to `localhost`. Node resolves that name to both the
// IPv6 and the IPv4 loopback address and races them; the preview server listens on IPv4 only, so on
// a machine where the IPv6 attempt neither connects nor refuses — Windows, in this repository — a
// page fails at random with `AggregateError [ETIMEDOUT]` and the build stops. Resolving IPv4 first
// removes the race. The flag has to be set before the process starts, hence this script.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import navigation from '../src/content/nav.json' with { type: 'json' };

const options = [process.env['NODE_OPTIONS'], '--dns-result-order=ipv4first'].filter(Boolean).join(' ');
const result = spawnSync('react-router', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_OPTIONS: options },
});

// A static host answers a path that matches no file with `404.html` from the output root, with
// status 404 (docs pack 10 §2: "unknown paths serve /{pluginId}/404/index.html with status 404").
// The prerender writes one 404 page per locale but none at the root, so without this copy the host
// would show its own generic page. It is the English one: without a catch-all rewrite, which the
// pack forbids, the host cannot pick the page by locale. `scripts/serve.ts` can, locally.
if (result.status === 0) {
  const client = resolve(import.meta.dirname, '..', 'build', 'client');
  const englishNotFound = resolve(client, navigation.pluginId, '404', 'index.html');
  if (!existsSync(englishNotFound)) {
    console.error('build-site: the prerendered 404 page is missing');
    process.exit(1);
  }
  copyFileSync(englishNotFound, resolve(client, '404.html'));
}

process.exit(result.status ?? 1);
