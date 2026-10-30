export type PngColorProfile='srgb'|'none';
export function validatePngColorProfile(value:unknown):asserts value is PngColorProfile|undefined{if(value!==undefined&&value!=='srgb'&&value!=='none')throw Error('PNG color profile must be sRGB or untagged.');}
const signature=[137,80,78,71,13,10,26,10],colorChunks=new Set(['sRGB','gAMA','cHRM','iCCP','cICP','mDCV','cLLI']),limit=100_000_000;
const crcTable=Uint32Array.from({length:256},(_,i)=>{for(let bit=0;bit<8;bit++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc(bytes:Uint8Array,start:number,end:number){let value=0xffffffff;for(let i=start;i<end;i++)value=crcTable[(value^bytes[i])&255]^(value>>>8);return (value^0xffffffff)>>>0;}
function chunk(name:string,payload:Uint8Array){const out=new Uint8Array(payload.length+12),view=new DataView(out.buffer);view.setUint32(0,payload.length);out.set([...name].map(c=>c.charCodeAt(0)),4);out.set(payload,8);view.setUint32(out.length-4,crc(out,4,out.length-4));return out;}
function numbers(values:number[]){const out=new Uint8Array(values.length*4),view=new DataView(out.buffer);values.forEach((v,i)=>view.setUint32(i*4,v));return out;}
/** Tag only already-sRGB canvas output; no pixel conversion or custom ICC profile is performed. */
export function pngColorProfile(bytes:Uint8Array,profile:PngColorProfile){
 validatePngColorProfile(profile);if(profile===undefined)throw Error('Choose an explicit PNG profile.');if(!(bytes instanceof Uint8Array)||bytes.length>limit||signature.some((v,i)=>bytes[i]!==v))throw Error('Invalid or oversized PNG output.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),chunks:Uint8Array[]=[],seen=new Set<string>();let offset=8,count=0,ended=false,hasData=false;
 while(offset<bytes.length){if(offset+12>bytes.length||++count>10000)throw Error('Invalid PNG chunk boundaries.');const length=view.getUint32(offset),end=offset+12+length;if(end>bytes.length)throw Error('Invalid PNG chunk length.');const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));if(!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)||crc(bytes,offset+4,end-4)!==view.getUint32(end-4))throw Error('Invalid PNG chunk or checksum.');if(count===1&&(type!=='IHDR'||length!==13)||type==='IHDR'&&seen.has(type))throw Error('Invalid PNG header.');seen.add(type);if(type==='IDAT')hasData=true;
  if(type==='IEND'){if(length||end!==bytes.length||!hasData)throw Error('Invalid PNG end.');ended=true;}
  if(!colorChunks.has(type))chunks.push(bytes.subarray(offset,end));
  if(type==='IHDR'&&profile==='srgb')chunks.push(chunk('sRGB',new Uint8Array([0])),chunk('gAMA',numbers([45455])),chunk('cHRM',numbers([31270,32900,64000,33000,30000,60000,15000,6000])));
  offset=end;
 }
 if(!ended)throw Error('The PNG is incomplete.');const size=8+chunks.reduce((sum,c)=>sum+c.length,0);if(size>limit)throw Error('PNG output exceeds 100 MB.');const result=new Uint8Array(size);result.set(signature);offset=8;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result;
}
