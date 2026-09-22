import { defineConfig, type UserConfig } from 'tsdown';

// docs pack 09 §6. Option names verified against tsdown 0.23 (docs/adr/0001-toolchain.md):
// `external` is deprecated there in favor of `deps.neverBundle`.
// Locale entries are added with the locale packs (M3).
const config: UserConfig = defineConfig({
  entry: ['src/index.ts', 'src/core.ts', 'src/headless.ts', 'src/dom.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Chunk names without hashes, so the size budgets can name the lazy chunks (Dossier 09 §2).
  hash: false,
  platform: 'neutral',
  // Browser floor is Safari 16.4 (Dossier 09 §5); without this tsdown infers node20 from `engines`.
  target: 'es2022',
  deps: {
    neverBundle: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  copy: [{ from: 'src/styles/*.css', to: 'dist/styles' }],
});

export default config;
