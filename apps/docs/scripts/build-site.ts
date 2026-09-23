// SPDX-License-Identifier: MIT
// Runs `react-router build`, which prerenders every route through a local preview server.
//
// The prerender opens one connection per page to `localhost`. Node resolves that name to both `::1`
// and `127.0.0.1` and races them; the preview server listens on IPv4 only, so on a machine where the
// IPv6 attempt neither connects nor refuses — Windows, in this repository — a page fails at random
// with `AggregateError [ETIMEDOUT]` and the build stops. Resolving IPv4 first removes the race. The
// flag has to be set before the process starts, which is why the build goes through this script.
import { spawnSync } from 'node:child_process';

const options = [process.env['NODE_OPTIONS'], '--dns-result-order=ipv4first'].filter(Boolean).join(' ');
const result = spawnSync('react-router', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_OPTIONS: options },
});

process.exit(result.status ?? 1);
