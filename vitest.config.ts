import { defineConfig } from 'vitest/config';

// One Vitest run for the whole workspace. Package projects add their own vitest.config.ts
// (environment, setup files) as their tests arrive; the React 18/19 matrix is handled in CI.
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
    ],
    coverage: {
      provider: 'v8',
      include: ['scripts/lib/**', 'packages/*/src/**'],
      reporter: ['text', 'json-summary', 'html'],
    },
  },
});
