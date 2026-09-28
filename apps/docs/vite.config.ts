import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { siteOrigin } from './scripts/lib/site-url.ts';

// docs pack 10 §2: base stays '/', because the routes carry the plugin prefix. The canonical origin
// comes from the environment (production domain, preview URL), by the same rule as the sitemap.
const siteUrl = siteOrigin();

// The version the navbar and the footer show is the package's own (O14), read from its manifest so
// the two cannot drift apart.
const manifest = new URL('../../packages/react-scheduler/package.json', import.meta.url);
const packageVersion = (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string }).version;

export default defineConfig({
  base: '/',
  plugins: [reactRouter()],
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    'import.meta.env.VITE_PACKAGE_VERSION': JSON.stringify(packageVersion),
    // Vercel serves the analytics scripts only to a project that has them switched on, and only in
    // its deployments: elsewhere every page would log two 404s. Production builds on Vercel load them.
    'import.meta.env.VITE_ANALYTICS': JSON.stringify(process.env['VERCEL_ENV'] === 'production'),
  },
});
