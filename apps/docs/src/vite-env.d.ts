/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Canonical origin without a trailing slash; set by `vite.config.ts` (docs pack 10 §2). */
  readonly VITE_SITE_URL: string;
  /** Whether Vercel Analytics and Speed Insights load: production builds on Vercel only. */
  readonly VITE_ANALYTICS: boolean;
  /** The documented package's version, read from its manifest at build time (O14). */
  readonly VITE_PACKAGE_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
