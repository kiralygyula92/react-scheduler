import { resolve } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineProject, type UserWorkspaceConfig } from 'vitest/config';
import { compareScreenshot, screenshotEnvironment } from './test/browser/shot/command';

// Browser layer (Feature Dossier 09 §1, §5): the BR-* scenarios, computed styles and accessibility in
// Chromium, Firefox and WebKit under the characterization conditions: time zone UTC, locale en-US,
// 1440 × 900, device pixel ratio 1. RS_BROWSERS narrows the engines (for example "chromium").
const repoRoot = resolve(import.meta.dirname, '../..');
const engines = (process.env['RS_BROWSERS'] ?? 'chromium,firefox,webkit').split(',') as (
  'chromium' | 'firefox' | 'webkit'
)[];

const config: UserWorkspaceConfig = defineProject({
  // The characterization fixtures and references live in spec/, outside the package.
  server: { fs: { allow: [repoRoot] } },
  // Pre-bundled up front: a dependency found mid-run reloads the page and fails the running file.
  optimizeDeps: { include: ['axe-core'] },
  test: {
    name: 'browser',
    root: import.meta.dirname,
    include: ['test/browser/**/*.browser.test.tsx'],
    testTimeout: 30_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: { timezoneId: 'UTC', locale: 'en-US', deviceScaleFactor: 1 },
      }),
      instances: engines.map((browser) => ({ browser })),
      viewport: { width: 1440, height: 900 },
      commands: { compareScreenshot, screenshotEnvironment },
    },
  },
});

export default config;
