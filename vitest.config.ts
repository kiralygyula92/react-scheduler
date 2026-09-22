import { defineConfig } from 'vitest/config';

// The package's DST suites run again under a northern and a southern DST zone
// (Feature Dossier 09 §1.2). Defined without `extends`, which would concatenate `include`.
const dstProject = (timeZone: string) => ({
  test: {
    name: `react-scheduler (${timeZone})`,
    root: './packages/react-scheduler',
    include: ['test/**/*.dst.test.ts'],
    environment: 'node',
    env: { TZ: timeZone },
  },
});

// One Vitest run for the whole workspace; the React 18/19 matrix is handled in CI.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'scripts',
          include: ['scripts/test/**/*.test.ts'],
          environment: 'node',
        },
      },
      'packages/*/vitest.config.ts',
      dstProject('Europe/Helsinki'),
      dstProject('Australia/Sydney'),
    ],
    coverage: {
      provider: 'v8',
      include: ['scripts/lib/**', 'packages/*/src/**'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        // Docs pack 09 §9: core ≥ 90 % lines / 85 % branches, react ≥ 80 % (lines).
        'packages/*/src/core/**': { lines: 90, branches: 85 },
        'packages/*/src/react/**': { lines: 80 },
      },
    },
  },
});
