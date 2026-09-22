import { resolve } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineProject, type UserWorkspaceConfig } from 'vitest/config';

// Performance budgets (Feature Dossier 09 §3, scenario PERF): Chromium without throttling, with
// React's production build. NODE_ENV is set before Vite resolves, so the pre-bundled React and the
// JSX transform are the production ones; they get a dependency cache of their own.
process.env['NODE_ENV'] = 'production';
const repoRoot = resolve(import.meta.dirname, '../..');

const config: UserWorkspaceConfig = defineProject({
  cacheDir: resolve(import.meta.dirname, 'node_modules/.vite-perf'),
  server: { fs: { allow: [repoRoot] } },
  test: {
    name: 'perf',
    root: import.meta.dirname,
    include: ['test/browser/perf/**/*.perf.test.tsx'],
    testTimeout: 60_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: { timezoneId: 'UTC', locale: 'en-US', deviceScaleFactor: 1 },
      }),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1440, height: 900 },
    },
  },
});

export default config;
