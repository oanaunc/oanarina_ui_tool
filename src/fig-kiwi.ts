/** Bounded, non-executable interpreter for Kiwi's embedded binary schema. */
export type FigValue = null | boolean | number | string | Uint8Array | FigValue[] | { [key: string]: FigValue };
export interface KiwiField { name: string; type: number; array: boolean; value: number }
export interface KiwiDefinition { name: string; kind: number; fields: KiwiField[] }
export interface KiwiSchema { definitions: KiwiDefinition[] }

export const KIWI_LIMITS = Object.freeze({
  schemaBytes: 2 * 1024 * 1024,
  messageBytes: 64 * 1024 * 1024,
  definitions: 2048,
  fields: 40000,
  fieldsPerDefinition: 2048,
  depth: 64,
  values: 64_000_000,
  arrayLength: 1_000_000,
  byteVectors: 64 * 1024 * 1024,
  stringBytes: 16 * 1024 * 1024,
  stringLength: 1024 * 1024,
  nodeChanges: 400_000,
});

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
function identifier(name: string): void {
  if (!/^[A-Za-z_]/.test(name) || /[^A-Za-z0-9_]/.test(name) || forbidden.has(name)) throw new Error('Unsafe Kiwi schema identifier');
}
const utf8 = new TextDecoder('utf-8', { fatal: true });

class Reader {
  at = 0;
  strings = 0;
  constructor(readonly bytes: Uint8Array) {}
  byte(): number {
    if (this.at >= this.bytes.length) throw new Error('Truncated Kiwi data');
    return this.bytes[this.at++];
  }
  uint(): number {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const b = this.byte();
      if (i === 4 && (b & 0xf0)) throw new Error('Kiwi integer exceeds 32 bits');
      value += (b & 127) * 2 ** (i * 7);
      if (!(b & 128)) return value;
    }
    throw new Error('Invalid Kiwi integer');
  }
  int(): number { const v = this.uint(); return v & 1 ? ~(v >>> 1) : v >>> 1; }
  uint64(): bigint {
    let value = 0n;
    for (let i = 0; i < 9; i++) {
      const b = this.byte();
      value |= BigInt(i === 8 ? b : b & 127) << BigInt(i * 7);
      if (i === 8 || !(b & 128)) return value;
    }
    throw new Error('Invalid Kiwi 64-bit integer');
  }
  float(): number {
    if (this.at >= this.bytes.length) throw new Error('Truncated Kiwi float');
    if (this.bytes[this.at] === 0) { this.at++; return 0; }
    if (this.at + 4 > this.bytes.length) throw new Error('Truncated Kiwi float');
    const view = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.at, 4);
    const bits = view.getUint32(0, true);
    this.at += 4;
    const out = new DataView(new ArrayBuffer(4));
    out.setUint32(0, (bits << 23) | (bits >>> 9), true);
    const result = out.getFloat32(0, true);
    if (Number.isNaN(result)) throw new Error('Non-finite Kiwi float'); // Infinity is real: it marks an axis with no maximum.
    return result;
  }
  string(maxLength = KIWI_LIMITS.stringLength): string {
    const start = this.at;
    while (this.at < this.bytes.length && this.bytes[this.at] !== 0) {
      if (this.at - start >= maxLength) throw new Error('Kiwi string exceeds limit');
      this.at++;
    }
    if (this.at === this.bytes.length) throw new Error('Unterminated Kiwi string');
    const size = this.at - start;
    this.strings += size;
    if (this.strings > KIWI_LIMITS.stringBytes) throw new Error('Kiwi strings exceed total limit');
    const value = utf8.decode(this.bytes.subarray(start, this.at));
    this.at++;
    return value;
  }
  end(): void { if (this.at !== this.bytes.length) throw new Error('Trailing Kiwi data'); }
}

export function decodeKiwiSchema(bytes: Uint8Array): KiwiSchema {
  if (bytes.length > KIWI_LIMITS.schemaBytes) throw new Error('Kiwi schema exceeds size limit');
  const r = new Reader(bytes);
  const count = r.uint();
  if (!count || count > KIWI_LIMITS.definitions) throw new Error('Kiwi definition count exceeds limit');
  const definitions: KiwiDefinition[] = [];
  const names = new Set<string>();
  let fields = 0;
  for (let i = 0; i < count; i++) {
    const name = r.string(256); identifier(name);
    if (names.has(name)) throw new Error('Duplicate Kiwi definition');
    names.add(name);
    const kind = r.byte();
    if (kind > 2) throw new Error('Unsupported Kiwi definition kind');
    const size = r.uint();
    fields += size;
    if (size > KIWI_LIMITS.fieldsPerDefinition || fields > KIWI_LIMITS.fields) throw new Error('Kiwi field count exceeds limit');
    const entries: KiwiField[] = [];
    const fieldNames = new Set<string>(), fieldIds = new Set<number>();
    for (let j = 0; j < size; j++) {
      const fieldName = r.string(256); identifier(fieldName);
      const type = r.int(), flags = r.byte(), value = r.uint();
      if (flags > 1 || (kind !== 0 && (type < -8 || type >= count))) throw new Error('Invalid Kiwi field type');
      if (fieldNames.has(fieldName) || fieldIds.has(value) || (kind === 2 && value === 0)) throw new Error('Duplicate or invalid Kiwi field');
      fieldNames.add(fieldName); fieldIds.add(value);
      entries.push({ name: fieldName, type, array: flags === 1, value });
    }
    definitions.push({ name, kind, fields: entries });
  }
  r.end();
  // A required struct cycle can never consume a finite valid value. Reject it up front.
  const visiting = new Set<number>(), visited = new Set<number>();
  const visit = (id: number, depth: number) => {
    if (depth > KIWI_LIMITS.depth) throw new Error('Kiwi struct nesting exceeds limit');
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('Recursive required Kiwi struct');
    visiting.add(id);
    for (const f of definitions[id].fields) if (!f.array && f.type >= 0 && definitions[f.type].kind === 1) visit(f.type, depth + 1);
    visiting.delete(id); visited.add(id);
  };
  definitions.forEach((d, i) => { if (d.kind === 1) visit(i, 0); });
  return { definitions };
}

export function decodeKiwiMessage(schema: KiwiSchema, bytes: Uint8Array, rootName = 'Message'): { [key: string]: FigValue } {
  if (bytes.length > KIWI_LIMITS.messageBytes) throw new Error('Kiwi message exceeds size limit');
  const root = schema.definitions.findIndex(d => d.name === rootName && d.kind === 2);
  if (root < 0) throw new Error('Kiwi Message definition is missing');
  const r = new Reader(bytes);
  let values = 0, byteVectors = 0;
  const fields = schema.definitions.map(d => new Map(d.fields.map(f => [f.value, f])));
  const reserve = (n: number) => { values += n; if (values > KIWI_LIMITS.values) throw new Error('Kiwi value count exceeds limit'); };
  const readType = (type: number, depth: number): FigValue => {
    if (depth > KIWI_LIMITS.depth) throw new Error('Kiwi message nesting exceeds limit');
    reserve(1);
    if (type < 0) {
      switch (type) {
        case -1: { const b = r.byte(); if (b > 1) throw new Error('Invalid Kiwi boolean'); return !!b; }
        case -2: return r.byte();
        case -3: return r.int();
        case -4: return r.uint();
        case -5: return r.float();
        case -6: return r.string();
        case -7: { const v = r.uint64(); return (v & 1n ? ~(v >> 1n) : v >> 1n).toString(); }
        case -8: return r.uint64().toString();
      }
      throw new Error('Invalid Kiwi primitive');
    }
    const definition = schema.definitions[type];
    if (!definition) throw new Error('Invalid Kiwi type reference');
    if (definition.kind === 0) {
      const field = fields[type].get(r.uint());
      if (!field) throw new Error('Unknown Kiwi enum value');
      return field.name;
    }
    const object: { [key: string]: FigValue } = Object.create(null);
    const readField = (f: KiwiField) => {
      if (!f.array) { object[f.name] = readType(f.type, depth + 1); return; }
      const n = r.uint();
      if (f.name === 'nodeChanges' && n > KIWI_LIMITS.nodeChanges) throw new Error('Design file node count exceeds limit');
      if (f.type === -2) {
        byteVectors += n;
        if (byteVectors > KIWI_LIMITS.byteVectors || n > bytes.length - r.at) throw new Error('Invalid or oversized Kiwi byte vector');
        object[f.name] = bytes.slice(r.at, r.at + n); r.at += n;
      } else {
        if (n > KIWI_LIMITS.arrayLength) throw new Error('Kiwi array exceeds limit');
        reserve(n);
        const list: FigValue[] = [];
        for (let i = 0; i < n; i++) list.push(readType(f.type, depth + 1));
        object[f.name] = list;
      }
    };
    if (definition.kind === 1) for (const f of definition.fields) readField(f);
    else {
      const seen = new Set<number>();
      while (true) {
        const id = r.uint();
        if (id === 0) break;
        const f = fields[type].get(id);
        if (!f || seen.has(id)) throw new Error('Unknown or repeated Kiwi message field');
        seen.add(id); readField(f);
      }
    }
    return object;
  };
  const result = readType(root, 0) as { [key: string]: FigValue };
  r.end();
  return result;
}
