import { fileURLToPath } from 'node:url';
import { defineProject, type UserWorkspaceConfig } from 'vitest/config';

// Unit tests of the shell and the i18n core. `root` is the app, so `import.meta.glob('/src/…')`
// resolves the locale bundles exactly as the site does.
const config: UserWorkspaceConfig = defineProject({
  test: {
    name: 'docs',
    root: import.meta.dirname,
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    env: { TZ: 'UTC' },
  },
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});

export default config;
