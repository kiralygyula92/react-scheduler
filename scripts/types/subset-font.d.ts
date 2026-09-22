// SPDX-License-Identifier: MIT
// Ambient types for subset-font 2.9.0, which ships none. Only the options `build-site-font.ts`
// uses are declared; see the package's README for the rest.
declare module 'subset-font' {
  interface VariationAxisRange {
    min?: number;
    max?: number;
    default?: number;
  }

  interface SubsetOptions {
    targetFormat?: 'sfnt' | 'woff' | 'woff2';
    preserveNameIds?: readonly number[];
    keepFeatures?: readonly string[];
    keepAllGlyphs?: boolean;
    variationAxes?: Readonly<Record<string, number | VariationAxisRange>>;
  }

  export default function subsetFont(
    font: Uint8Array,
    text: string | undefined,
    options?: SubsetOptions,
  ): Promise<Uint8Array>;
}
