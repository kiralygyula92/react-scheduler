// A minimal PNG codec for the screenshot comparison (Node side of a browser command): decodes 8-bit,
// non-interlaced greyscale, RGB, palette and RGBA images to RGBA; encodes RGBA. No dependencies.
import { deflateSync, inflateSync } from 'node:zlib';

export interface Image {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, rows top to bottom. */
  data: Uint8Array;
}

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function decodePng(buffer: Uint8Array): Image {
  if (!SIGNATURE.every((byte, index) => buffer[index] === byte)) throw new Error('not a PNG file');
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  let palette: Uint8Array | undefined;
  let transparency: Uint8Array | undefined;
  const idat: Uint8Array[] = [];
  while (offset < buffer.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...buffer.subarray(offset + 4, offset + 8));
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      const bitDepth = chunk[8];
      colorType = chunk[9] as number;
      const interlace = chunk[12];
      if (bitDepth !== 8 || interlace !== 0 || CHANNELS[colorType] === undefined) {
        throw new Error(`unsupported PNG: bit depth ${bitDepth}, colour type ${colorType}, interlace ${interlace}`);
      }
    } else if (type === 'PLTE') palette = chunk;
    else if (type === 'tRNS') transparency = chunk;
    else if (type === 'IDAT') idat.push(chunk);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  const channels = CHANNELS[colorType] as number;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)] as number;
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? (pixels[y * stride + x - channels] as number) : 0;
      const up = y > 0 ? (pixels[(y - 1) * stride + x] as number) : 0;
      const upLeft = y > 0 && x >= channels ? (pixels[(y - 1) * stride + x - channels] as number) : 0;
      const value = line[x] as number;
      const predicted =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? (left + up) >> 1
                : paeth(left, up, upLeft);
      pixels[y * stride + x] = (value + predicted) & 0xff;
    }
  }
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    const source = index * channels;
    const target = index * 4;
    if (colorType === 6) data.set(pixels.subarray(source, source + 4), target);
    else if (colorType === 2) {
      data.set(pixels.subarray(source, source + 3), target);
      data[target + 3] = 255;
    } else if (colorType === 3) {
      const entry = pixels[source] as number;
      data.set((palette as Uint8Array).subarray(entry * 3, entry * 3 + 3), target);
      data[target + 3] = transparency?.[entry] ?? 255;
    } else {
      const grey = pixels[source] as number;
      data[target] = grey;
      data[target + 1] = grey;
      data[target + 2] = grey;
      data[target + 3] = colorType === 4 ? (pixels[source + 1] as number) : 255;
    }
  }
  return { width, height, data };
}

function chunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  out.set(
    [...type].map((char) => char.charCodeAt(0)),
    4,
  );
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
  return out;
}

export function encodePng(image: Image): Uint8Array {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, image.width);
  view.setUint32(4, image.height);
  header.set([8, 6, 0, 0, 0], 8);
  const stride = image.width * 4;
  const raw = new Uint8Array((stride + 1) * image.height);
  for (let y = 0; y < image.height; y++)
    raw.set(image.data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  return Buffer.concat([
    Buffer.from(SIGNATURE),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ]);
}
