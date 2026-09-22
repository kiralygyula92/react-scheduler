import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

// docs pack 10 §2: base stays '/', because the routes carry the plugin prefix. The canonical origin
// comes from the environment (production domain, preview URL) and never from a hard-coded string.
const siteUrl =
  process.env['VITE_SITE_URL'] ??
  (process.env['VERCEL_URL'] === undefined
    ? 'https://react-schedulerkit.vercel.app'
    : `https://${process.env['VERCEL_URL']}`);

export default defineConfig({
  base: '/',
  plugins: [reactRouter()],
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
  },
});
