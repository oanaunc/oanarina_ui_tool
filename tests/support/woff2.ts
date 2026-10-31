import {brotliCompressSync,constants} from 'node:zlib';

const KNOWN=['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak'];
const base128=(value:number)=>{const out=[value&127];for(value=Math.floor(value/128);value;value=Math.floor(value/128))out.unshift((value&127)|128);return out;};
/** A real WOFF2 with null transforms, which browsers load. Tests own this encoder so no font tool is needed. */
export function encodeWoff2(sfnt:ArrayBuffer,quality=9):Uint8Array{
 const v=new DataView(sfnt),count=v.getUint16(4),source=new Uint8Array(sfnt),tag=(o:number)=>String.fromCharCode(...source.subarray(o,o+4)),rows=Array.from({length:count},(_,i)=>{const r=12+i*16;return {tag:tag(r),offset:v.getUint32(r+8),length:v.getUint32(r+12)};});
 const directory:number[]=[],chunks:Uint8Array[]=[];for(const row of rows){const known=KNOWN.indexOf(row.tag),version=row.tag==='glyf'||row.tag==='loca'?3:0;directory.push((known<0?63:known)|(version<<6));if(known<0)for(let c=0;c<4;c++)directory.push(row.tag.charCodeAt(c));directory.push(...base128(row.length));chunks.push(source.subarray(row.offset,row.offset+row.length));}
 const joined=Buffer.concat(chunks),compressed=brotliCompressSync(joined,{params:{[constants.BROTLI_PARAM_QUALITY]:quality,[constants.BROTLI_PARAM_MODE]:constants.BROTLI_MODE_FONT,[constants.BROTLI_PARAM_SIZE_HINT]:joined.length}}),size=48+directory.length+compressed.length,padded=size+3&~3,out=new Uint8Array(padded),w=new DataView(out.buffer);
 w.setUint32(0,0x774f4632);w.setUint32(4,v.getUint32(0));w.setUint32(8,padded);w.setUint16(12,count);w.setUint32(16,sfnt.byteLength);w.setUint32(20,compressed.length);w.setUint16(24,1);out.set(directory,48);out.set(compressed,48+directory.length);return out;
}
