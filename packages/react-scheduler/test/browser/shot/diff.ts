// Pixel comparison (Feature Dossier 09 §4): two pixels differ when their perceptual color distance
// exceeds the threshold; the distance is the weighted YIQ difference of Kotsarenko and Ramos
// ("Measuring perceived color difference using YIQ NTSC transmission color space", 2010), with
// alpha blended over white. Masked rectangles are excluded.
import type { Image } from './png';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiffResult {
  width: number;
  height: number;
  compared: number;
  different: number;
  ratio: number;
  /** Differences in red over a faded copy of the reference; masks in blue. */
  image: Image;
}

/** The largest possible YIQ distance (black against white). */
const MAX_DELTA = 35215;

function blend(channel: number, alpha: number): number {
  return 255 + ((channel - 255) * alpha) / 255;
}

function yiq(data: Uint8Array, index: number): [number, number, number] {
  const alpha = data[index + 3] as number;
  const r = blend(data[index] as number, alpha);
  const g = blend(data[index + 1] as number, alpha);
  const b = blend(data[index + 2] as number, alpha);
  return [
    r * 0.29889531 + g * 0.58662247 + b * 0.11448223,
    r * 0.59597799 - g * 0.2741761 - b * 0.32180189,
    r * 0.21147017 - g * 0.52261711 + b * 0.31114694,
  ];
}

function colorDelta(a: Uint8Array, b: Uint8Array, index: number): number {
  const [y1, i1, q1] = yiq(a, index);
  const [y2, i2, q2] = yiq(b, index);
  const dy = y1 - y2;
  const di = i1 - i2;
  const dq = q1 - q2;
  return 0.5053 * dy * dy + 0.299 * di * di + 0.1957 * dq * dq;
}

export function diffImages(actual: Image, reference: Image, masks: readonly Rect[], threshold = 0.1): DiffResult {
  if (actual.width !== reference.width || actual.height !== reference.height) {
    throw new Error(
      `size ${actual.width}×${actual.height} differs from the reference ${reference.width}×${reference.height}`,
    );
  }
  const { width, height } = reference;
  const limit = MAX_DELTA * threshold * threshold;
  const masked = new Uint8Array(width * height);
  for (const rect of masks) {
    const x0 = Math.max(0, Math.floor(rect.x));
    const y0 = Math.max(0, Math.floor(rect.y));
    const x1 = Math.min(width, Math.ceil(rect.x + rect.width));
    const y1 = Math.min(height, Math.ceil(rect.y + rect.height));
    for (let y = y0; y < y1; y++) masked.fill(1, y * width + x0, y * width + x1);
  }
  const output = new Uint8Array(width * height * 4);
  let compared = 0;
  let different = 0;
  for (let pixel = 0; pixel < width * height; pixel++) {
    const index = pixel * 4;
    const gray = 255 - (255 - (yiq(reference.data, index)[0] ?? 255)) * 0.1;
    if (masked[pixel]) {
      output.set([0, 0, 255, 60], index);
      continue;
    }
    compared++;
    if (colorDelta(actual.data, reference.data, index) > limit) {
      different++;
      output.set([255, 0, 0, 255], index);
    } else {
      output.set([gray, gray, gray, 255], index);
    }
  }
  return {
    width,
    height,
    compared,
    different,
    ratio: compared === 0 ? 0 : different / compared,
    image: { width, height, data: output },
  };
}
