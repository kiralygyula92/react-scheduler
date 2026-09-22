/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Canonical origin without a trailing slash; set by `vite.config.ts` (docs pack 10 §2). */
  readonly VITE_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
