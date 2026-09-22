// Bundle budgets (Feature Dossier 09 §2), minified + gzip, measured on the built package as a
// consumer's bundler sees it: named imports, tree-shaking, the React peers left out. The eager
// part leaves the lazy chunks out; each lazy chunk counts only the files it loads on demand.
import { readdirSync } from 'node:fs';

const peers = ['react', 'react-dom', 'react/jsx-runtime'];
const chunks = readdirSync(new URL('./dist', import.meta.url)).filter((file) => file.endsWith('.js'));

/** Marks the given built files external: they are loaded, but counted elsewhere. */
const without = (files) => (config) => ({
  ...config,
  external: [...(config.external ?? []), ...files.map((file) => `*/${file}`)],
});

/** Everything except `own` is external: the check counts only its own files. */
const only = (...own) => without(chunks.filter((file) => !own.includes(file)));

const checks = [
  { name: 'core', path: 'dist/core.js', import: '*', limit: '6 kB' },
  { name: 'dom', path: 'dist/dom.js', import: '*', limit: '4 kB' },
  { name: 'headless (no budget)', path: 'dist/headless.js', import: '*' },
  {
    name: 'main entry, eager part',
    path: 'dist/index.js',
    import: '{ Scheduler, ListView, TimelineView }',
    ignore: peers,
    modifyEsbuildConfig: without(['overflow-dialog.js', 'detail-dialog.js']),
    limit: '24 kB',
  },
  {
    name: 'lazy chunk: overflow dialog, table and pagination',
    path: 'dist/overflow-dialog.js',
    import: '*',
    ignore: peers,
    modifyEsbuildConfig: only('overflow-dialog.js', 'overflow-columns.js', 'modal.js'),
    limit: '5 kB',
  },
  {
    name: 'lazy chunk: default detail dialog',
    path: 'dist/detail-dialog.js',
    import: '*',
    ignore: peers,
    modifyEsbuildConfig: only('detail-dialog.js', 'modal.js'),
    limit: '3 kB',
  },
  { name: 'styles.css', path: 'dist/styles/index.css', limit: '8 kB' },
];

// The Dossier budgets are gzip sizes (size-limit reports brotli by default).
export default checks.map((check) => ({ ...check, gzip: true }));
