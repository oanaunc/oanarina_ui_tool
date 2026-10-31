import {inflateSync} from 'fflate';
import {SKETCH_LIMITS} from './sketch-limits';
const utf8 = new TextDecoder('utf-8', { fatal: true });
const crcTable = Uint32Array.from({ length: 256 }, (_, i) => {
  let n = i;
  for (let j = 0; j < 8; j++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  return n >>> 0;
});
export function sketchCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function view(bytes: Uint8Array): DataView { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); }
function checkRange(start: number, size: number, end: number): void {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(size) || start < 0 || size < 0 || size > end - start) throw new Error('Truncated Sketch container');
}
function extras(bytes: Uint8Array): void {
  const v = view(bytes);
  for (let at = 0; at < bytes.length;) {
    checkRange(at, 4, bytes.length);
    const tag = v.getUint16(at, true), size = v.getUint16(at + 2, true);
    if (tag === 1 || tag === 0x9901) throw new Error('ZIP64 or encrypted Sketch archives are not supported');
    at += 4; checkRange(at, size, bytes.length); at += size;
  }
}
function entryLimit(name:string){
 if(!name||name.length>512||name.includes('\\')||name.startsWith('/')||name.split('/').some(p=>p==='.'||p==='..')||!/^[A-Za-z0-9_. /-]+$/.test(name))throw Error('Invalid archive path');
 if(name.endsWith('/'))return 0;
 return name.endsWith('.json')?SKETCH_LIMITS.jsonBytes:SKETCH_LIMITS.assetBytes;
}

interface ZipEntry { name: string; method: number; crc: number; size: number; compressed: number; start: number; end: number; local: number }

/** Preflight every directory/local header and total before decompressing any entry. No paths are extracted. */
export function readSketchZip(bytes: Uint8Array,onEntry?:(entry:number,total:number)=>void): Map<string, Uint8Array> {
  if(!(bytes instanceof Uint8Array)||bytes.length>SKETCH_LIMITS.inputBytes||bytes.length<22)throw Error('Invalid archive size');
  const v = view(bytes);
  let eocd = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--) {
    if (v.getUint32(at, true) === 0x06054b50 && at + 22 + v.getUint16(at + 20, true) === bytes.length) { eocd = at; break; }
  }
  if (eocd < 0) throw new Error('Missing ZIP directory in Sketch file');
  const count = v.getUint16(eocd + 10, true), centralSize = v.getUint32(eocd + 12, true), central = v.getUint32(eocd + 16, true);
  if (v.getUint16(eocd + 4, true) || v.getUint16(eocd + 6, true) || v.getUint16(eocd + 8, true) !== count || count === 65535 || central === 0xffffffff || centralSize === 0xffffffff) throw new Error('Multipart or ZIP64 Sketch archives are not supported');
  if (!count || count > SKETCH_LIMITS.entries) throw new Error('Sketch archive has too many entries');
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
    if (size > limit || compressed > SKETCH_LIMITS.inputBytes || (method === 0 && compressed !== size)) throw new Error('Sketch archive entry exceeds size limit');
    total += size;
    if (total > SKETCH_LIMITS.archiveBytes) throw new Error('Sketch expanded archive exceeds size limit');
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
  if (at !== central + centralSize || !names.has('document.json')) throw new Error('Invalid Sketch ZIP directory or missing canvas');
  const ranges = [...entries].sort((a, b) => a.local - b.local);
  for (let i = 0; i < ranges.length; i++) if (ranges[i].local !== (i ? ranges[i - 1].end : 0)) throw new Error('Overlapping or hidden ZIP entry data');
  if (ranges[ranges.length - 1].end !== central) throw new Error('Unaccounted ZIP entry data');
  const result = new Map<string, Uint8Array>();
  for (const entry of entries) {
    const compressed = bytes.subarray(entry.start, entry.start + entry.compressed);
    const out = entry.method === 0 ? compressed.slice() : inflateBounded(compressed, entry.size);
    if (out.length !== entry.size || sketchCrc32(out) !== entry.crc) throw new Error('ZIP size or CRC checksum mismatch');
    result.set(entry.name, out);onEntry?.(result.size,entries.length);
  }
  return result;
}

/** Fixed output buffer bounds allocation even for an incorrectly advertised deflate size. Worker bounds CPU. */
function inflateBounded(bytes: Uint8Array, limit: number): Uint8Array {
  const out = inflateSync(bytes, { out: new Uint8Array(limit + 1) });
  if (out.length > limit) throw new Error('Deflate output exceeds size limit');
  return out;
}
