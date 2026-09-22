import { defineProject, type UserWorkspaceConfig } from 'vitest/config';

// Characterization conditions (Feature Dossier 09 §1.2): time zone UTC, locale en-US.
// The DST suites also run under other zones as separate projects (root vitest.config.ts).
const config: UserWorkspaceConfig = defineProject({
  test: {
    name: 'react-scheduler',
    root: import.meta.dirname,
    include: ['test/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'UTC' },
  },
});

export default config;
