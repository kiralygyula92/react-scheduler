// SPDX-License-Identifier: MIT
// Downloads the two OFL fonts the characterization references were rendered with (Feature Dossier 09
// §4: "fonts installed from the OFL sources") into .cache/fonts/, for the browser suite's visual
// checks. The files are pinned to a commit of the Google Fonts repository and verified by SHA-256
// (see lib/fonts.ts); they are never committed.
//
// Usage: node scripts/fetch-fonts.ts
import { ensureFile, FONTS } from './lib/fonts.ts';

async function main(): Promise<number> {
  for (const font of FONTS) {
    try {
      const { downloaded } = await ensureFile(font);
      if (downloaded) console.log(`fonts: ${font.file} downloaded and verified`);
    } catch (error) {
      console.error(`fonts: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }
  console.log(`fonts: ${FONTS.length} font(s) ready in .cache/fonts`);
  return 0;
}

process.exitCode = await main();
