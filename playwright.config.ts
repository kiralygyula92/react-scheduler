import { defineConfig, devices } from '@playwright/test';

// Browser layer (docs pack 07 §4, Feature Dossier 09 §1): the package's BR-* scenarios and the
// docs site's E2E journeys. Recording conditions follow the Dossier characterization README.
export default defineConfig({
  testDir: '.',
  testMatch: ['packages/*/test/browser/**/*.spec.ts', 'apps/docs/e2e/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    timezoneId: 'UTC',
    locale: 'en-US',
    deviceScaleFactor: 1,
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
    baseURL: 'http://localhost:4173',
  },
  // The site E2E runs against the built, statically served output — the same files the host
  // serves (10 §2). The package's browser specs do not need it, and an already-running server is
  // reused.
  webServer: {
    command: 'node apps/docs/scripts/serve.ts 4173',
    url: 'http://localhost:4173/react-scheduler/',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
});
