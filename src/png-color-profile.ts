import {zlibSync} from 'fflate';
import {displayP3IccProfile} from './display-p3-icc';
export type PngColorProfile='srgb'|'none'|'display-p3'|`icc:${string}`;
export function validatePngColorProfile(value:unknown):asserts value is PngColorProfile|undefined{if(value!==undefined&&value!=='srgb'&&value!=='none'&&value!=='display-p3'&&!(typeof value==='string'&&/^icc:[\w-]{1,64}$/.test(value)))throw Error('PNG color profile must be sRGB, Display P3, a stored ICC profile or untagged.');}
const signature=[137,80,78,71,13,10,26,10],colorChunks=new Set(['sRGB','gAMA','cHRM','iCCP','cICP','mDCV','cLLI']),limit=100_000_000;
const crcTable=Uint32Array.from({length:256},(_,i)=>{for(let bit=0;bit<8;bit++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc(bytes:Uint8Array,start:number,end:number){let value=0xffffffff;for(let i=start;i<end;i++)value=crcTable[(value^bytes[i])&255]^(value>>>8);return (value^0xffffffff)>>>0;}
function chunk(name:string,payload:Uint8Array){const out=new Uint8Array(payload.length+12),view=new DataView(out.buffer);view.setUint32(0,payload.length);out.set([...name].map(c=>c.charCodeAt(0)),4);out.set(payload,8);view.setUint32(out.length-4,crc(out,4,out.length-4));return out;}
function numbers(values:number[]){const out=new Uint8Array(values.length*4),view=new DataView(out.buffer);values.forEach((v,i)=>view.setUint32(i*4,v));return out;}
const p3Chunks=()=>{const name=[...'Display P3'].map(c=>c.charCodeAt(0));return [chunk('cICP',new Uint8Array([12,13,0,1])),chunk('iCCP',new Uint8Array([...name,0,0,...zlibSync(displayP3IccProfile(),{level:9})])),chunk('gAMA',numbers([45455])),chunk('cHRM',numbers([31270,32900,68000,32000,26500,69000,15000,6000]))];};
/** Tag canvas output already holding that profile's coordinates; pixels are never converted here. cICP leads and iCCP serves older decoders. */
/** Data-URL form for generated PNGs embedded in SVG markup. */
export function tagPngDataUrl(url:string,profile:PngColorProfile){const raw=atob(url.slice(url.indexOf(',')+1)),tagged=pngColorProfile(Uint8Array.from(raw,c=>c.charCodeAt(0)),profile);let out='';for(let i=0;i<tagged.length;i+=8192)out+=String.fromCharCode(...tagged.subarray(i,i+8192));return 'data:image/png;base64,'+btoa(out);}
/** An embedded ICC profile for pixels already converted into it. Names are Latin-1 in PNG, so anything else becomes a plain label. */
const iccChunk=(name:string,icc:Uint8Array)=>{const label=[...name.replace(/[^\x20-\x7e]/g,'').slice(0,79).trim()||'Custom'].map(c=>c.charCodeAt(0));return chunk('iCCP',new Uint8Array([...label,0,0,...zlibSync(icc,{level:9})]));};
export function pngColorProfile(bytes:Uint8Array,profile:PngColorProfile,custom?:{name:string;bytes:Uint8Array}){
 validatePngColorProfile(profile);if(profile===undefined)throw Error('Choose an explicit PNG profile.');if(!(bytes instanceof Uint8Array)||bytes.length>limit||signature.some((v,i)=>bytes[i]!==v))throw Error('Invalid or oversized PNG output.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),chunks:Uint8Array[]=[],seen=new Set<string>();let offset=8,count=0,ended=false,hasData=false;
 while(offset<bytes.length){if(offset+12>bytes.length||++count>10000)throw Error('Invalid PNG chunk boundaries.');const length=view.getUint32(offset),end=offset+12+length;if(end>bytes.length)throw Error('Invalid PNG chunk length.');const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));if(!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)||crc(bytes,offset+4,end-4)!==view.getUint32(end-4))throw Error('Invalid PNG chunk or checksum.');if(count===1&&(type!=='IHDR'||length!==13)||type==='IHDR'&&seen.has(type))throw Error('Invalid PNG header.');seen.add(type);if(type==='IDAT')hasData=true;
  if(type==='IEND'){if(length||end!==bytes.length||!hasData)throw Error('Invalid PNG end.');ended=true;}
  if(!colorChunks.has(type))chunks.push(bytes.subarray(offset,end));
  if(type==='IHDR'&&profile==='srgb')chunks.push(chunk('sRGB',new Uint8Array([0])),chunk('gAMA',numbers([45455])),chunk('cHRM',numbers([31270,32900,64000,33000,30000,60000,15000,6000])));
  if(type==='IHDR'&&profile==='display-p3')chunks.push(...p3Chunks());
  if(type==='IHDR'&&custom)chunks.push(iccChunk(custom.name,custom.bytes));
  offset=end;
 }
 if(!ended)throw Error('The PNG is incomplete.');const size=8+chunks.reduce((sum,c)=>sum+c.length,0);if(size>limit)throw Error('PNG output exceeds 100 MB.');const result=new Uint8Array(size);result.set(signature);offset=8;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result;
}
