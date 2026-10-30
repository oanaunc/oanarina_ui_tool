import { inflateSync } from 'fflate';
import { Decompress } from 'fzstd';
import { decodeKiwiMessage, decodeKiwiSchema, KIWI_LIMITS } from './fig-kiwi';
import type { FigValue } from './fig-kiwi';
import { FIG_LIMITS } from './fig-limits';
export { FIG_LIMITS } from './fig-limits';

export interface DecodedFig {
  version: number;
  message: { [key: string]: FigValue };
  images: Record<string, Uint8Array>;
  metadata?: unknown;
  thumbnail?: Uint8Array;
}

const utf8 = new TextDecoder('utf-8', { fatal: true });
const crcTable = Uint32Array.from({ length: 256 }, (_, i) => {
  let n = i;
  for (let j = 0; j < 8; j++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  return n >>> 0;
});
export function figCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function view(bytes: Uint8Array): DataView { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); }
function checkRange(start: number, size: number, end: number): void {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(size) || start < 0 || size < 0 || size > end - start) throw new Error('Truncated .fig container');
}
function extras(bytes: Uint8Array): void {
  const v = view(bytes);
  for (let at = 0; at < bytes.length;) {
    checkRange(at, 4, bytes.length);
    const tag = v.getUint16(at, true), size = v.getUint16(at + 2, true);
    if (tag === 1 || tag === 0x9901) throw new Error('ZIP64 or encrypted .fig archives are not supported');
    at += 4; checkRange(at, size, bytes.length); at += size;
  }
}
function entryLimit(name: string): number {
  if (name === 'canvas.fig') return FIG_LIMITS.canvasBytes;
  if (name === 'meta.json') return FIG_LIMITS.metadataBytes;
  if (name === 'thumbnail.png') return FIG_LIMITS.thumbnailBytes;
  if (name.length === 47 && /^images\/[a-fA-F0-9]{40}$/.test(name)) return FIG_LIMITS.imageBytes;
  if (name === 'images/') return 0;
  throw new Error('Unsupported entry path in .fig archive');
}

interface ZipEntry { name: string; method: number; crc: number; size: number; compressed: number; start: number; end: number; local: number }

/** Preflight every directory/local header and total before decompressing any entry. No paths are extracted. */
function readZip(bytes: Uint8Array): Map<string, Uint8Array> {
  const v = view(bytes);
  let eocd = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--) {
    if (v.getUint32(at, true) === 0x06054b50 && at + 22 + v.getUint16(at + 20, true) === bytes.length) { eocd = at; break; }
  }
  if (eocd < 0) throw new Error('Missing ZIP directory in .fig file');
  const count = v.getUint16(eocd + 10, true), centralSize = v.getUint32(eocd + 12, true), central = v.getUint32(eocd + 16, true);
  if (v.getUint16(eocd + 4, true) || v.getUint16(eocd + 6, true) || v.getUint16(eocd + 8, true) !== count || count === 65535 || central === 0xffffffff || centralSize === 0xffffffff) throw new Error('Multipart or ZIP64 .fig archives are not supported');
  if (!count || count > FIG_LIMITS.entries) throw new Error('.fig archive has too many entries');
  checkRange(central, centralSize, eocd);
  if (central + centralSize !== eocd) throw new Error('Ambiguous ZIP directory');
  const entries: ZipEntry[] = [], names = new Set<string>();
  let at = central, total = 0;
  for (let i = 0; i < count; i++) {
    checkRange(at, 46, eocd);
    if (v.getUint32(at, true) !== 0x02014b50) throw new Error('Invalid ZIP directory entry');
    const flags = v.getUint16(at + 8, true), method = v.getUint16(at + 10, true);
    const crc = v.getUint32(at + 16, true), compressed = v.getUint32(at + 20, true), size = v.getUint32(at + 24, true);
    const nameSize = v.getUint16(at + 28, true), extraSize = v.getUint16(at + 30, true), commentSize = v.getUint16(at + 32, true), local = v.getUint32(at + 42, true);
    if ((flags & ~0x080e) || (method !== 0 && method !== 8) || v.getUint16(at + 34, true) || [size, compressed, local].includes(0xffffffff)) throw new Error('Unsupported ZIP compression, encryption, or disk');
    if (method === 0 && flags & 6) throw new Error('Invalid stored ZIP flags');
    const unixType = (v.getUint32(at + 38, true) >>> 16) & 0xf000;
    if (unixType && unixType !== 0x8000 && unixType !== 0x4000) throw new Error('ZIP links and special files are not supported');
    checkRange(at + 46, nameSize + extraSize + commentSize, eocd);
    if (!nameSize || nameSize > 256) throw new Error('Invalid ZIP entry name');
    const nameBytes = bytes.subarray(at + 46, at + 46 + nameSize), name = utf8.decode(nameBytes);
    if (names.has(name)) throw new Error('Duplicate ZIP entry');
    names.add(name);
    const limit = entryLimit(name);
    if (size > limit || compressed > FIG_LIMITS.inputBytes || (method === 0 && compressed !== size)) throw new Error('.fig archive entry exceeds size limit');
    total += size;
    if (total > FIG_LIMITS.archiveBytes) throw new Error('.fig expanded archive exceeds size limit');
    extras(bytes.subarray(at + 46 + nameSize, at + 46 + nameSize + extraSize));
    checkRange(local, 30, central);
    if (v.getUint32(local, true) !== 0x04034b50 || v.getUint16(local + 6, true) !== flags || v.getUint16(local + 8, true) !== method) throw new Error('ZIP local header disagrees with directory');
    const ln = v.getUint16(local + 26, true), le = v.getUint16(local + 28, true);
    checkRange(local + 30, ln + le, central);
    if (ln !== nameSize || !nameBytes.every((b, j) => b === bytes[local + 30 + j])) throw new Error('ZIP local entry name disagrees with directory');
    extras(bytes.subarray(local + 30 + ln, local + 30 + ln + le));
    const localCrc = v.getUint32(local + 14, true), localCompressed = v.getUint32(local + 18, true), localSize = v.getUint32(local + 22, true);
    if (flags & 8 ? ((localCrc !== 0 && localCrc !== crc) || (localCompressed !== 0 && localCompressed !== compressed) || (localSize !== 0 && localSize !== size)) : (localCrc !== crc || localCompressed !== compressed || localSize !== size)) throw new Error('ZIP local sizes disagree with directory');
    const start = local + 30 + ln + le;
    checkRange(start, compressed, central);
    let end = start + compressed;
    if (flags & 8) {
      checkRange(end, 12, central);
      if (v.getUint32(end, true) === 0x08074b50) { end += 4; checkRange(end, 12, central); }
      if (v.getUint32(end, true) !== crc || v.getUint32(end + 4, true) !== compressed || v.getUint32(end + 8, true) !== size) throw new Error('Invalid ZIP data descriptor');
      end += 12;
    }
    entries.push({ name, method, crc, size, compressed, start, end, local });
    at += 46 + nameSize + extraSize + commentSize;
  }
  if (at !== central + centralSize || !names.has('canvas.fig')) throw new Error('Invalid .fig ZIP directory or missing canvas');
  const ranges = [...entries].sort((a, b) => a.local - b.local);
  for (let i = 0; i < ranges.length; i++) if (ranges[i].local !== (i ? ranges[i - 1].end : 0)) throw new Error('Overlapping or hidden ZIP entry data');
  if (ranges[ranges.length - 1].end !== central) throw new Error('Unaccounted ZIP entry data');
  const result = new Map<string, Uint8Array>();
  for (const entry of entries) {
    const compressed = bytes.subarray(entry.start, entry.start + entry.compressed);
    const out = entry.method === 0 ? compressed.slice() : inflateBounded(compressed, entry.size);
    if (out.length !== entry.size || figCrc32(out) !== entry.crc) throw new Error('ZIP size or CRC checksum mismatch');
    result.set(entry.name, out);
  }
  return result;
}

/** Fixed output buffer bounds allocation even for an incorrectly advertised deflate size. Worker bounds CPU. */
function inflateBounded(bytes: Uint8Array, limit: number): Uint8Array {
  const out = inflateSync(bytes, { out: new Uint8Array(limit + 1) });
  if (out.length > limit) throw new Error('Deflate output exceeds size limit');
  return out;
}

function zstdHeader(bytes: Uint8Array, limit: number): { size?: number; checksum?: number } {
  if (bytes.length < 6 || view(bytes).getUint32(0, true) !== 0xfd2fb528) throw new Error('Invalid Zstandard frame');
  const flags = bytes[4], single = !!(flags & 32), sizeFlag = flags >>> 6;
  if (flags & 0x18 || flags & 3) throw new Error('Zstandard reserved flags and dictionaries are not supported');
  let at = 5, window = 0;
  if (!single) {
    const descriptor = bytes[at++];
    const base = 2 ** (10 + (descriptor >>> 3));
    window = base + base / 8 * (descriptor & 7);
  }
  const sizeBytes = sizeFlag ? 1 << sizeFlag : single ? 1 : 0;
  checkRange(at, sizeBytes, bytes.length);
  let bigSize = 0n;
  for (let i = 0; i < sizeBytes; i++) bigSize |= BigInt(bytes[at++]) << BigInt(i * 8);
  if (sizeFlag === 1) bigSize += 256n;
  if (bigSize > BigInt(limit)) throw new Error('Zstandard content size exceeds limit');
  const size = sizeBytes ? Number(bigSize) : undefined;
  if (single) window = size!;
  if (window > FIG_LIMITS.zstdWindow) throw new Error('Zstandard window exceeds limit');
  let blocks = 0, last = false;
  while (!last) {
    if (++blocks > FIG_LIMITS.zstdBlocks) throw new Error('Too many Zstandard blocks');
    checkRange(at, 3, bytes.length);
    const header = bytes[at] | bytes[at + 1] << 8 | bytes[at + 2] << 16;
    at += 3; last = !!(header & 1);
    const type = (header >>> 1) & 3, blockSize = header >>> 3;
    if (type === 3 || blockSize > Math.min(131072, window)) throw new Error('Invalid Zstandard block size or type');
    const payload = type === 1 ? 1 : blockSize;
    checkRange(at, payload, bytes.length); at += payload;
  }
  let checksum: number | undefined;
  if (flags & 4) { checkRange(at, 4, bytes.length); checksum = view(bytes).getUint32(at, true); at += 4; }
  if (at !== bytes.length) throw new Error('Trailing or concatenated Zstandard frames are not supported');
  return { size, checksum };
}

// Zstandard's content checksum is the low 32 bits of XXH64(seed=0).
function xxhash64low(bytes: Uint8Array): number {
  const mask = (1n << 64n) - 1n;
  const p1 = 11400714785074694791n, p2 = 14029467366897019727n, p3 = 1609587929392839161n, p4 = 9650029242287828579n, p5 = 2870177450012600261n;
  const rot = (n: bigint, bits: bigint) => ((n << bits) | (n >> (64n - bits))) & mask;
  const round = (a: bigint, b: bigint) => rot((a + b * p2) & mask, 31n) * p1 & mask;
  const v = view(bytes);
  let at = 0, h: bigint;
  if (bytes.length >= 32) {
    const s = [(p1 + p2) & mask, p2, 0n, -p1 & mask];
    while (at <= bytes.length - 32) for (let i = 0; i < 4; i++, at += 8) s[i] = round(s[i], v.getBigUint64(at, true));
    h = (rot(s[0], 1n) + rot(s[1], 7n) + rot(s[2], 12n) + rot(s[3], 18n)) & mask;
    for (const n of s) h = ((h ^ round(0n, n)) * p1 + p4) & mask;
  } else h = p5;
  h = (h + BigInt(bytes.length)) & mask;
  while (at <= bytes.length - 8) { h = (rot(h ^ round(0n, v.getBigUint64(at, true)), 27n) * p1 + p4) & mask; at += 8; }
  if (at <= bytes.length - 4) { h = (rot(h ^ (BigInt(v.getUint32(at, true)) * p1 & mask), 23n) * p2 + p3) & mask; at += 4; }
  while (at < bytes.length) h = rot(h ^ (BigInt(bytes[at++]) * p5 & mask), 11n) * p1 & mask;
  h ^= h >> 33n; h = h * p2 & mask; h ^= h >> 29n; h = h * p3 & mask; h ^= h >> 32n;
  return Number(h & 0xffffffffn);
}

function zstdBounded(bytes: Uint8Array, limit: number): Uint8Array {
  const header = zstdHeader(bytes, limit);
  const chunks: Uint8Array[] = [];
  let size = 0;
  const decoder = new Decompress(chunk => {
    size += chunk.length;
    if (size > limit || (header.size !== undefined && size > header.size)) throw new Error('Zstandard output exceeds size limit');
    chunks.push(chunk.slice());
  });
  decoder.push(bytes, true);
  if (header.size !== undefined && size !== header.size) throw new Error('Zstandard content size mismatch');
  const result = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) { result.set(chunk, at); at += chunk.length; }
  if (header.checksum !== undefined && xxhash64low(result) !== header.checksum) throw new Error('Zstandard content checksum mismatch');
  return result;
}

function decompressChunk(bytes: Uint8Array, limit: number): Uint8Array {
  if (!bytes.length) throw new Error('Empty fig-kiwi compressed chunk');
  return bytes.length >= 4 && view(bytes).getUint32(0, true) === 0xfd2fb528 ? zstdBounded(bytes, limit) : inflateBounded(bytes, limit);
}

function metadata(bytes: Uint8Array): unknown {
  const result: unknown = JSON.parse(utf8.decode(bytes));
  let entries = 0;
  const visit = (value: unknown, depth: number): void => {
    if (++entries > 50000 || depth > 32) throw new Error('.fig metadata complexity exceeds limit');
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid .fig metadata number');
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new Error('Unsafe .fig metadata key');
      visit(child, depth + 1);
    }
  };
  visit(result, 0);
  return result;
}

/** Worker-only synchronous core. Untrusted input must enter through decodeFigFile's terminable worker. */
export function decodeFigContainerInWorker(bytes: Uint8Array): DecodedFig {
  if (!(bytes instanceof Uint8Array) || bytes.length > FIG_LIMITS.inputBytes) throw new Error('.fig input exceeds 50 MB limit');
  let files: Map<string, Uint8Array>;
  if (bytes.length >= 4 && view(bytes).getUint32(0, true) === 0x04034b50) files = readZip(bytes);
  else files = new Map([['canvas.fig', bytes]]);
  const canvas = files.get('canvas.fig')!;
  if (canvas.length > FIG_LIMITS.canvasBytes || canvas.length < 20 || utf8.decode(canvas.subarray(0, 8)) !== 'fig-kiwi') throw new Error('This is not a supported fig-kiwi file');
  const v = view(canvas), version = v.getUint32(8, true);
  if (!version || version > 1000) throw new Error('Unsupported fig-kiwi version');
  let at = 12;
  const chunks: Uint8Array[] = [];
  while (at < canvas.length) {
    if (chunks.length === 2) throw new Error('Unsupported additional fig-kiwi chunks');
    checkRange(at, 4, canvas.length);
    const size = v.getUint32(at, true); at += 4;
    checkRange(at, size, canvas.length);
    chunks.push(canvas.subarray(at, at + size)); at += size;
  }
  if (chunks.length !== 2) throw new Error('Missing fig-kiwi schema or message');
  const schema = decodeKiwiSchema(decompressChunk(chunks[0], KIWI_LIMITS.schemaBytes));
  const message = decodeKiwiMessage(schema, decompressChunk(chunks[1], KIWI_LIMITS.messageBytes));
  const images: Record<string, Uint8Array> = Object.create(null);
  for (const [name, data] of files) if (name.startsWith('images/') && name !== 'images/') images[name.slice(7).toLowerCase()] = data;
  if (Object.keys(images).length !== [...files.keys()].filter(n => n.startsWith('images/') && n !== 'images/').length) throw new Error('Ambiguous image hashes in .fig archive');
  return { version, message, images, ...(files.has('meta.json') ? { metadata: metadata(files.get('meta.json')!) } : {}), ...(files.has('thumbnail.png') ? { thumbnail: files.get('thumbnail.png') } : {}) };
}
