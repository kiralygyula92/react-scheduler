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
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
});
