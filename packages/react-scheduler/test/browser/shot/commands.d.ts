import type { Rect } from './diff';
import type { ScreenshotComparison } from './command';

declare module 'vitest/browser' {
  interface BrowserCommands {
    compareScreenshot: (args: { name: string; base64: string; masks: Rect[] }) => Promise<ScreenshotComparison>;
    compareMirrored: (args: { name: string; ltr: string; rtl: string }) => Promise<ScreenshotComparison>;
    screenshotEnvironment: () => Promise<{ platform: string; enforce: boolean }>;
  }
}
