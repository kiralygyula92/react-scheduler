import type { Config } from '@react-router/dev/config';
import { routePaths } from './src/routes';

// docs pack 01 §6: framework mode without server rendering, every route × every locale prerendered
// to static HTML. Routes carry the /react-scheduler/ prefix themselves, so there is no basename and
// Vite `base` stays '/' (10 §2).
export default {
  appDirectory: 'src',
  ssr: false,
  prerender: routePaths(),
} satisfies Config;
