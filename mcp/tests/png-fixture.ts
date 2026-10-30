import {deflateSync} from 'node:zlib';
export function pngChunk(type:string,data=Buffer.alloc(0)){
 const chunk=Buffer.alloc(data.length+12);chunk.writeUInt32BE(data.length);chunk.write(type,4,4,'latin1');data.copy(chunk,8);let crc=0xffffffff;
 for(const byte of chunk.subarray(4,chunk.length-4)){crc^=byte;for(let bit=0;bit<8;bit++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;}chunk.writeUInt32BE((crc^0xffffffff)>>>0,chunk.length-4);return chunk;
}
export const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
export function pngHeader(width=2,height=2,color=6){const h=Buffer.alloc(13);h.writeUInt32BE(width);h.writeUInt32BE(height,4);h[8]=8;h[9]=color;return h;}
export const pngDataUrl=(bytes:Buffer)=>'data:image/png;base64,'+bytes.toString('base64');
export function fixturePng(){return Buffer.concat([pngSignature,pngChunk('IHDR',pngHeader()),pngChunk('IDAT',deflateSync(Buffer.from([0,255,0,0,255,0,255,0,255,0,0,0,255,255,255,255,0,128]))),pngChunk('IEND')]);}
