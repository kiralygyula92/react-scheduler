import { defineProject, type UserWorkspaceConfig } from 'vitest/config';

// Characterization conditions (Feature Dossier 09 §1.2): time zone UTC, locale en-US.
// The DST suites also run under other zones as separate projects (root vitest.config.ts).
const config: UserWorkspaceConfig = defineProject({
  test: {
    name: 'react-scheduler',
    root: import.meta.dirname,
    include: ['test/**/*.test.{ts,tsx}'],
    // Real-browser tests run in their own project (vitest.browser.config.ts), and the timing
    // budgets in the root config's `budgets` project, away from coverage instrumentation.
    exclude: ['test/browser/**', 'test/perf/**'],
    environment: 'node',
    env: { TZ: 'UTC' },
  },
});

export default config;
