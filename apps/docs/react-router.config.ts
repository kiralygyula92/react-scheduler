import type { Config } from '@react-router/dev/config';

// docs pack 01 §6: framework mode without server rendering, every route and locale prerendered to
// static HTML. Routes carry the /react-scheduler/ prefix themselves, so there is no basename (10 §2).
export default {
  appDirectory: 'src',
  ssr: false,
  prerender: ['/react-scheduler/'],
} satisfies Config;
