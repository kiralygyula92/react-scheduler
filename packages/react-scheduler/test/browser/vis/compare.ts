// Computed-style comparison against measured-styles.{light,dark}.json (scenarios VIS-light, VIS-dark).
// Values are normalised: colours to "#RRGGBB" or "#RRGGBB/a" as the Dossier writes them, transitions
// without their default easing and delay, numbers to at most two decimals.
//
// Equivalences (documented in docs/adr/0003-react-adapter.md, "Visual parity"): properties that do
// not paint, or that paint the same through a different mechanism, are not compared:
// - typography and colour on parts without their own text (inherited values paint nothing);
// - border colour and style on sides whose width is 0;
// - `text-align: left` and `start` (left-to-right), `gap: normal` and `0px`;
// - `position: relative` with zero offsets and `static`; offsets of static elements;
// - `min-width` / `min-height` of `auto` and `0px`; percentage min/max widths (the box is compared);
// - alignment on elements that are not flex or grid containers;
// - horizontal geometry (right, translate X) of parts whose width follows their text;
// - pixel sizes within 0.5 px.

export type Measured = Record<string, string | number | boolean>;

/** Properties that paint only through text: compared on text-bearing parts only. */
export const TEXT_PROPERTIES: ReadonlySet<string> = new Set([
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'letterSpacing',
  'textTransform',
  'whiteSpace',
]);

/** Recorded but not visual, or different by design: never compared. */
const IGNORED = new Set(['@tag', 'focusVisible']);

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;

function hex(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0').toUpperCase();
}

function colour(rgb: string): string {
  const match = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(rgb);
  if (!match) return rgb;
  const [, r, g, b, a] = match;
  const base = `#${hex(Number(r))}${hex(Number(g))}${hex(Number(b))}`;
  return a === undefined || Number(a) === 1 ? base : `${base}/${Number(Number(a).toFixed(3))}`;
}

function numbers(value: string): string {
  return value.replace(/-?\d+\.\d+/g, (number) => String(Number(Number(number).toFixed(2))));
}

/** Normalises a computed value to the Dossier's notation. */
export function normalise(property: string, value: string): string {
  let result = value.replace(/rgba?\([^)]*\)/g, colour);
  if (property === 'transition') {
    result = result
      .split(/,\s*(?![^(]*\))/)
      .map((part) =>
        part
          .replace(/\s+ease\s+0s$/, '')
          .replace(/\s+0s$/, '')
          .trim(),
      )
      .join(', ');
  }
  if (property === 'fontFamily') result = result.replace(/"/g, '');
  return numbers(result.trim());
}

function expected(property: string, value: string | number | boolean): string {
  const text = String(value);
  return property === 'fontFamily' ? text.replace(/"/g, '') : numbers(text);
}

const CSS_NAMES: Record<string, string> = { webkitLineClamp: '-webkit-line-clamp' };

function computed(style: CSSStyleDeclaration, property: string): string {
  const name = CSS_NAMES[property] ?? property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return style.getPropertyValue(name);
}

const EQUIVALENT: Record<string, readonly (readonly [string, string])[]> = {
  textAlign: [
    ['left', 'start'],
    ['right', 'end'],
  ],
  alignItems: [['stretch', 'normal']],
  gap: [['0px', 'normal']],
  minWidth: [['auto', '0px']],
  minHeight: [['auto', '0px']],
  maxWidth: [['100%', 'none']],
};

function equivalent(property: string, want: string, actual: string): boolean {
  if (want === actual) return true;
  if ((property === 'width' || property === 'height') && want.endsWith('px') && actual.endsWith('px')) {
    return Math.abs(Number.parseFloat(want) - Number.parseFloat(actual)) <= 0.5;
  }
  if (EQUIVALENT[property]?.some(([a, b]) => (a === want && b === actual) || (a === actual && b === want))) return true;
  if ((property === 'minWidth' || property === 'maxWidth') && want.endsWith('%') && actual.endsWith('%')) return true;
  return false;
}

export interface Difference {
  key: string;
  property: string;
  expected: string;
  actual: string;
}

export interface CompareOptions {
  /** A text-bearing part: typography and colour are compared. */
  text: boolean;
  /** Layout-driven dimensions to compare; text-driven ones follow the font. */
  sizes: readonly ('width' | 'height')[];
  pseudo?: string;
  tolerance?: number;
  /** Properties this part does not compare, with the reason recorded in the target table. */
  skip?: readonly string[];
}

export function compareElement(
  key: string,
  element: Element,
  measured: Measured,
  options: CompareOptions,
): Difference[] {
  const style = getComputedStyle(element, options.pseudo);
  const rect = element.getBoundingClientRect();
  const tolerance = options.tolerance ?? 0.5;
  const skip = new Set(options.skip);
  const zeroSides = new Set(
    SIDES.filter((side) => {
      const width = measured[`border${side}Width`] ?? computed(style, `border${side}Width`);
      return Number.parseFloat(String(width)) === 0 || computed(style, `border${side}Style`) === 'none';
    }),
  );
  const flexOrGrid = /flex|grid/.test(computed(style, 'display'));
  const staticLike =
    computed(style, 'position') === 'static' &&
    ['top', 'right', 'bottom', 'left'].every((side) =>
      [undefined, '0px', 'auto'].includes(measured[side] as string | undefined),
    );

  const differences: Difference[] = [];
  for (const [property, value] of Object.entries(measured)) {
    if (IGNORED.has(property) || skip.has(property)) continue;
    if (!options.text && TEXT_PROPERTIES.has(property)) continue;
    if (property === '@box') {
      const [width, height] = String(value).split('x').map(Number) as [number, number];
      for (const dimension of options.sizes) {
        const want = dimension === 'width' ? width : height;
        const actual = dimension === 'width' ? rect.width : rect.height;
        if (Math.abs(actual - want) > tolerance) {
          differences.push({
            key,
            property: `@box.${dimension}`,
            expected: String(want),
            actual: String(Number(actual.toFixed(2))),
          });
        }
      }
      continue;
    }
    if ((property === 'width' || property === 'height') && !options.sizes.includes(property)) continue;
    const side = /^border(Top|Right|Bottom|Left)(Color|Style)$/.exec(property)?.[1];
    if (side && zeroSides.has(side as (typeof SIDES)[number])) continue;
    if ((property === 'alignItems' || property === 'justifyContent') && !flexOrGrid) continue;
    if (property === 'position' && value === 'relative' && staticLike) continue;
    if (['top', 'right', 'bottom', 'left'].includes(property) && staticLike) continue;
    if (property === 'right' && !options.sizes.includes('width')) continue;
    const want = expected(property, value);
    let actual = normalise(property, computed(style, property));
    if (property === 'transform' && !options.sizes.includes('width')) {
      // Compare the vertical translation only: the horizontal one follows the text width.
      const y = (text: string): string => text.split(',').at(-1)?.replace(')', '').trim() ?? text;
      if (y(want) === y(actual)) continue;
      actual = `${actual} (translate Y ${y(actual)} vs ${y(want)})`;
    }
    if (!equivalent(property, want, actual)) differences.push({ key, property, expected: want, actual });
  }
  return differences;
}
