import { defineConfig, type UserConfig } from 'tsdown';

// docs pack 09 §6. Option names verified against tsdown 0.23 (docs/adr/0001-toolchain.md):
// `external` is deprecated there in favour of `deps.neverBundle`.
// Locale entries and the stylesheet copy are added when those sources exist (M2, M3).
const config: UserConfig = defineConfig({
  entry: ['src/index.ts', 'src/core.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: 'neutral',
  // Browser floor is Safari 16.4 (Dossier 09 §5); without this tsdown infers node20 from `engines`.
  target: 'es2022',
  deps: {
    neverBundle: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});

export default config;
