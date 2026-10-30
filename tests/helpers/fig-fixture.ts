import { deflateSync, zipSync } from 'fflate';
import type { KiwiDefinition } from '../../src/fig-kiwi';

export class FigWriter {
  bytes: number[] = [];
  byte(n: number) { this.bytes.push(n & 255); }
  uint(n: number) { do { const b = n & 127; n = Math.floor(n / 128); this.byte(b | (n ? 128 : 0)); } while (n); }
  int(n: number) { this.uint(((n << 1) ^ (n >> 31)) >>> 0); }
  uint64(n: bigint) { for (let i = 0; i < 8 && n > 127n; i++) { this.byte(Number(n & 127n) | 128); n >>= 7n; } this.byte(Number(n)); }
  float(n: number) { const v = new DataView(new ArrayBuffer(4)); v.setFloat32(0, n, true); const b = v.getUint32(0, true); const rotated = (b >>> 23) | (b << 9); if (!(rotated & 255)) this.byte(0); else for (let i = 0; i < 4; i++) this.byte(rotated >>> (i * 8)); }
  string(s: string) { for (const b of new TextEncoder().encode(s)) this.byte(b); this.byte(0); }
  out() { return new Uint8Array(this.bytes); }
}
const field = (name: string, type: number, value: number, array = false) => ({ name, type, value, array });
export const fixtureSchema: KiwiDefinition[] = [
  { name: 'Kind', kind: 0, fields: [field('FRAME', 0, 0), field('TEXT', 0, 1)] },
  { name: 'GUID', kind: 1, fields: [field('sessionID', -4, 1), field('localID', -4, 2)] },
  { name: 'NodeChange', kind: 2, fields: [field('guid', 1, 1), field('type', 0, 2), field('name', -6, 3), field('opacity', -5, 4), field('visible', -1, 5), field('signed', -3, 6), field('unsigned64', -8, 7), field('signed64', -7, 8), field('bytes', -2, 9, true), field('children', 2, 10, true)] },
  { name: 'Message', kind: 2, fields: [field('nodeChanges', 2, 1, true), field('blobs', 4, 2, true)] },
  { name: 'Blob', kind: 1, fields: [field('bytes', -2, 1, true)] },
];
export function encodeSchema(definitions = fixtureSchema): Uint8Array {
  const w = new FigWriter(); w.uint(definitions.length);
  for (const d of definitions) { w.string(d.name); w.byte(d.kind); w.uint(d.fields.length); for (const f of d.fields) { w.string(f.name); w.int(f.type); w.byte(f.array ? 1 : 0); w.uint(f.value); } }
  return w.out();
}
export function encodeMessage(message: Record<string, unknown>, definitions = fixtureSchema): Uint8Array {
  const w = new FigWriter();
  const write = (type: number, value: any): void => {
    if (type < 0) {
      switch (type) {
        case -1: w.byte(value ? 1 : 0); return;
        case -2: w.byte(value); return;
        case -3: w.int(value); return;
        case -4: w.uint(value); return;
        case -5: w.float(value); return;
        case -6: w.string(value); return;
        case -7: { const n = BigInt(value); w.uint64(n >= 0 ? n << 1n : (~n << 1n) | 1n); return; }
        case -8: w.uint64(BigInt(value)); return;
      }
    }
    const d = definitions[type];
    if (d.kind === 0) { w.uint(d.fields.find(f => f.name === value)!.value); return; }
    for (const f of d.fields) {
      if (d.kind === 2 && value[f.name] === undefined) continue;
      if (d.kind === 2) w.uint(f.value);
      if (f.array) { w.uint(value[f.name].length); for (const child of value[f.name]) write(f.type, child); }
      else write(f.type, value[f.name]);
    }
    if (d.kind === 2) w.uint(0);
  };
  write(definitions.findIndex(d => d.name === 'Message'), message);
  return w.out();
}
export const fixtureMessage = () => ({ nodeChanges: [{ guid: { sessionID: 7, localID: 19 }, type: 'TEXT', name: 'Synthetic café ☕', opacity: .75, visible: true, signed: -123, unsigned64: '18446744073709551615', signed64: '-9223372036854775808', bytes: new Uint8Array([0, 128, 255]) }], blobs: [{ bytes: new Uint8Array([1, 2, 3, 4]) }] });
export function rawZstd(bytes: Uint8Array): Uint8Array {
  const out: number[] = [0x28, 0xb5, 0x2f, 0xfd, 0xa0];
  for (let i = 0; i < 4; i++) out.push(bytes.length >>> (i * 8) & 255);
  let at = 0;
  do { const n = Math.min(131072, bytes.length - at), last = at + n === bytes.length; const header = n * 8 + (last ? 1 : 0); out.push(header & 255, header >>> 8 & 255, header >>> 16 & 255); for (const b of bytes.subarray(at, at + n)) out.push(b); at += n; } while (at < bytes.length);
  return new Uint8Array(out);
}
export function figCanvas(options: { schema?: Uint8Array; message?: Uint8Array; zstd?: boolean; compressedSchema?: Uint8Array; compressedMessage?: Uint8Array } = {}): Uint8Array {
  const schema = options.compressedSchema ?? deflateSync(options.schema ?? encodeSchema());
  const raw = options.message ?? encodeMessage(fixtureMessage());
  const message = options.compressedMessage ?? (options.zstd ? rawZstd(raw) : deflateSync(raw));
  const out = new Uint8Array(12 + 8 + schema.length + message.length), v = new DataView(out.buffer);
  out.set(new TextEncoder().encode('fig-kiwi')); v.setUint32(8, 106, true); v.setUint32(12, schema.length, true); out.set(schema, 16); v.setUint32(16 + schema.length, message.length, true); out.set(message, 20 + schema.length);
  return out;
}
export function figZip(options: Parameters<typeof figCanvas>[0] = {}): Uint8Array {
  return zipSync({ 'canvas.fig': [figCanvas(options), { level: 0 }], 'meta.json': new TextEncoder().encode('{"document":{"width":640,"height":480}}'), 'thumbnail.png': new Uint8Array([137,80,78,71]), ['images/' + 'a'.repeat(40)]: new Uint8Array([1,2,3]) });
}
