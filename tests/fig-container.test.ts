import { describe, expect, it } from 'vitest';
import { zipSync, deflateSync } from 'fflate';
import { constants, zstdCompressSync } from 'node:zlib';
import { decodeFigContainerInWorker, figCrc32, FIG_LIMITS } from '../src/fig-container-core';
import { decodeKiwiSchema, decodeKiwiMessage, KIWI_LIMITS } from '../src/fig-kiwi';
import { FigWriter, encodeSchema, encodeMessage, fixtureSchema, fixtureMessage, figCanvas, figZip, rawZstd } from './helpers/fig-fixture';

describe('offline fig-kiwi container', () => {
  it('decodes raw-deflate and zstd messages, exact 64-bit values, UTF-8, floats, blobs, images and metadata', () => {
    for (const zstd of [false, true]) {
      const result = decodeFigContainerInWorker(figZip({ zstd }));
      expect(result.version).toBe(106);
      expect(result.message).toEqual(fixtureMessage());
      expect(result.images['a'.repeat(40)]).toEqual(new Uint8Array([1,2,3]));
      expect(result.metadata).toEqual({ document: { width:640,height:480 } });
      expect(result.thumbnail).toEqual(new Uint8Array([137,80,78,71]));
      expect(Object.getPrototypeOf(result.message)).toBeNull();
    }
  });
  it('handles real compressed multi-block Zstandard and validates its optional XXH64 checksum', () => {
    const message = encodeMessage({ nodeChanges: [{ name: 'hello '.repeat(40000) }], blobs: [] });
    const compressed = new Uint8Array(zstdCompressSync(message, { params: { [constants.ZSTD_c_checksumFlag]: 1 } }));
    expect(decodeFigContainerInWorker(figCanvas({ compressedMessage: compressed })).message.nodeChanges).toEqual([{ name:'hello '.repeat(40000) }]);
    compressed[compressed.length - 1] ^= 1;
    expect(() => decodeFigContainerInWorker(figCanvas({ compressedMessage: compressed }))).toThrow(/checksum/);
  });
  it('validates ZIP CRC even for stored canvas data and rejects directory/local disagreement', () => {
    const bytes = figZip(), v = new DataView(bytes.buffer), eocd = bytes.length - 22, cd = v.getUint32(eocd + 16,true);
    const wrongCrc = bytes.slice(); wrongCrc[14] ^= 1;
    expect(() => decodeFigContainerInWorker(wrongCrc)).toThrow(/disagree/);
    const corrupt = bytes.slice(); corrupt[30 + v.getUint16(26,true) + v.getUint16(28,true)] ^= 1;
    expect(() => decodeFigContainerInWorker(corrupt)).toThrow(/CRC/);
    const wrongName = bytes.slice(); wrongName[cd+46] ^= 1;
    expect(() => decodeFigContainerInWorker(wrongName)).toThrow(/path|name/);
    expect(figCrc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
  it('rejects traversal, duplicate/case-colliding assets, links, unsupported entries and encryption before extraction', () => {
    for (const name of ['../canvas.fig','/canvas.fig','images/../../x','x\\canvas.fig','unknown.js','images/'+'a'.repeat(40)+'\n']) {
      expect(() => decodeFigContainerInWorker(zipSync({ 'canvas.fig': figCanvas(), [name]: new Uint8Array() }))).toThrow(/path/);
    }
    expect(() => decodeFigContainerInWorker(zipSync({ 'canvas.fig':figCanvas(), ['images/'+'a'.repeat(40)]:new Uint8Array(), ['images/'+'A'.repeat(40)]:new Uint8Array() }))).toThrow(/Ambiguous/);
    const bytes = figZip(), v = new DataView(bytes.buffer), cd = v.getUint32(bytes.length-6,true);
    const link = bytes.slice(); new DataView(link.buffer).setUint32(cd+38,0xa0000000,true);
    expect(() => decodeFigContainerInWorker(link)).toThrow(/links/);
    const encrypted = bytes.slice(); new DataView(encrypted.buffer).setUint16(cd+8,1,true);
    expect(() => decodeFigContainerInWorker(encrypted)).toThrow(/encryption/);
  });
  it('preflights size, entry count, overlapping offsets and ZIP64 without expanding advertised data', () => {
    const bytes=figZip(), cd=new DataView(bytes.buffer).getUint32(bytes.length-6,true);
    const huge=bytes.slice();new DataView(huge.buffer).setUint32(cd+24,FIG_LIMITS.canvasBytes+1,true);
    expect(()=>decodeFigContainerInWorker(huge)).toThrow(/size limit/);
    const many=bytes.slice();new DataView(many.buffer).setUint16(many.length-12,FIG_LIMITS.entries+1,true);new DataView(many.buffer).setUint16(many.length-14,FIG_LIMITS.entries+1,true);
    expect(()=>decodeFigContainerInWorker(many)).toThrow(/too many/);
    const zip64=bytes.slice();new DataView(zip64.buffer).setUint32(cd+20,0xffffffff,true);
    expect(()=>decodeFigContainerInWorker(zip64)).toThrow(/Unsupported/);
    const overlap=bytes.slice();const next=cd+46+new DataView(bytes.buffer).getUint16(cd+28,true);new DataView(overlap.buffer).setUint32(next+42,0,true);
    expect(()=>decodeFigContainerInWorker(overlap)).toThrow(/header|name|Overlapping/);
  });
  it('rejects truncated/overlong chunks, invalid metadata and excess deflate output', () => {
    const canvas=figCanvas();
    for (const n of [0,8,12,19,canvas.length-1]) expect(()=>decodeFigContainerInWorker(canvas.subarray(0,n))).toThrow();
    expect(()=>decodeFigContainerInWorker(new Uint8Array([...canvas,0,0,0,0]))).toThrow(/additional/);
    expect(()=>decodeFigContainerInWorker(zipSync({'canvas.fig':canvas,'meta.json':new TextEncoder().encode('{"__proto__":{"polluted":true}}')}))).toThrow(/Unsafe/);
    expect(()=>decodeFigContainerInWorker(figCanvas({compressedSchema:deflateSync(new Uint8Array(KIWI_LIMITS.schemaBytes+1))}))).toThrow(/Deflate output/);
    expect(({} as any).polluted).toBeUndefined();
  });
  it('rejects oversized zstd windows/content, reserved flags/blocks, dictionaries, truncation and concatenated frames', () => {
    const data=rawZstd(encodeMessage(fixtureMessage()));
    const dictionary=data.slice();dictionary[4]|=1;
    const reserved=data.slice();reserved[4]|=8;
    const huge=data.slice();new DataView(huge.buffer).setUint32(5,KIWI_LIMITS.messageBytes+1,true);
    const block=data.slice();block[9]|=6;
    const window=new Uint8Array([0x28,0xb5,0x2f,0xfd,0,0xff,1,0,0]);
    for (const invalid of [dictionary,reserved,huge,block,window,data.subarray(0,data.length-1),new Uint8Array([...data,...data])]) expect(()=>decodeFigContainerInWorker(figCanvas({compressedMessage:invalid}))).toThrow();
  });
});

describe('bounded interpreted Kiwi schema', () => {
  it('rejects executable/prototype identifiers, duplicate IDs, bad type indexes, required cycles and trailing schema bytes', () => {
    for (const name of ['__proto__','constructor','prototype','x;globalThis.hacked=1','Type\n']) {
      const definitions=structuredClone(fixtureSchema);definitions[0].name=name;
      expect(()=>decodeKiwiSchema(encodeSchema(definitions))).toThrow(/identifier/);
      definitions[0].name='Kind';definitions[2].fields[0].name=name;
      expect(()=>decodeKiwiSchema(encodeSchema(definitions))).toThrow(/identifier/);
    }
    const duplicate=structuredClone(fixtureSchema);duplicate[2].fields[1].value=1;
    expect(()=>decodeKiwiSchema(encodeSchema(duplicate))).toThrow(/Duplicate/);
    const bad=structuredClone(fixtureSchema);bad[2].fields[0].type=99;
    expect(()=>decodeKiwiSchema(encodeSchema(bad))).toThrow(/type/);
    expect(()=>decodeKiwiSchema(encodeSchema([{name:'Loop',kind:1,fields:[{name:'loop',type:0,value:1,array:false}]}]))).toThrow(/Recursive/);
    expect(()=>decodeKiwiSchema(new Uint8Array([...encodeSchema(),0]))).toThrow(/Trailing/);
    expect((globalThis as any).hacked).toBeUndefined();
  });
  it('rejects unknown/repeated fields, invalid enums, overflow integers, invalid UTF-8 and non-finite floats', () => {
    const s=decodeKiwiSchema(encodeSchema());
    for (const data of [new Uint8Array([99,0]),new Uint8Array([1,0,1,0,0]),new Uint8Array([1,1,2,99,0,0]),new Uint8Array([0xff,0xff,0xff,0xff,0x10])]) expect(()=>decodeKiwiMessage(s,data)).toThrow();
    expect(()=>decodeKiwiMessage(s,new Uint8Array([1,1,3,0xff,0,0,0]))).toThrow();
    expect(()=>decodeKiwiMessage(s,encodeMessage({nodeChanges:[{opacity:Infinity}]}))).toThrow(/Non-finite/);
    expect(()=>decodeKiwiMessage(s,new Uint8Array([...encodeMessage(fixtureMessage()),0]))).toThrow(/Trailing/);
  });
  it('refuses huge node/array lengths, byte vector lengths and recursive message depth before allocating', () => {
    const s=decodeKiwiSchema(encodeSchema()), huge=new FigWriter();huge.uint(1);huge.uint(KIWI_LIMITS.nodeChanges+1);
    expect(()=>decodeKiwiMessage(s,huge.out())).toThrow(/node count/);
    const vectors=new FigWriter();vectors.uint(2);vectors.uint(1);vectors.uint(0xffffffff);
    expect(()=>decodeKiwiMessage(s,vectors.out())).toThrow(/byte vector/);
    let node:any={name:'leaf'};for(let i=0;i<80;i++)node={children:[node]};
    expect(()=>decodeKiwiMessage(s,encodeMessage({nodeChanges:[node]}))).toThrow(/nesting/);
  });
});
