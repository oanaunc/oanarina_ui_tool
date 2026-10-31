import {brotliDecode} from './brotli-decode';
import {MAX_FONT_BYTES} from './font-data';

/** The tables font inspection reads. Outlines stay compressed and are never rebuilt. */
const WANTED=new Set(['name','fvar','GSUB','GPOS','cmap']);
const KNOWN_TAGS=['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];
const HEADER=48,MAX_TABLES=4096;
const invalid=(why:string):never=>{throw Error('Invalid WOFF2 font: '+why+'.');};
/** A plain sfnt from loose tables, for the shared table parser. */
export function sfntFromTables(rows:readonly {tag:string;bytes:Uint8Array}[]):ArrayBuffer{const directory=12+rows.length*16,size=rows.reduce((sum,r)=>sum+r.bytes.length+3&~3,directory),out=new Uint8Array(size),view=new DataView(out.buffer);view.setUint32(0,0x10000);view.setUint16(4,rows.length);let write=directory;rows.forEach((row,i)=>{const r=12+i*16;for(let c=0;c<4;c++)out[r+c]=row.tag.charCodeAt(c);view.setUint32(r+8,write);view.setUint32(r+12,row.bytes.length);out.set(row.bytes,write);write=write+row.bytes.length+3&~3;});return out.buffer;}
export const isWoff2=(bytes:ArrayBuffer)=>bytes.byteLength>=4&&new DataView(bytes).getUint32(0)===0x774f4632;
/** Rebuilds a small sfnt holding only the layout and naming tables, so one parser serves every font format. */
export function woff2LayoutTables(bytes:ArrayBuffer):ArrayBuffer{
 if(!isWoff2(bytes))invalid('wrong signature');if(bytes.byteLength<HEADER)invalid('short header');
 const v=new DataView(bytes),data=new Uint8Array(bytes),count=v.getUint16(12),compressed=v.getUint32(20);if(v.getUint32(4)===0x74746366)invalid('font collections are not read');if(!count||count>MAX_TABLES)invalid('table count');
 let at=HEADER;const u8=()=>{if(at>=data.length)invalid('short directory');return data[at++];},base128=()=>{let value=0;for(let i=0;i<5;i++){const byte=u8();if(i===0&&byte===0x80)invalid('leading zero');if(value>=2**25)invalid('number overflow');value=value*128+(byte&127);if(!(byte&128))return value;}return invalid('number too long');};
 const rows:{tag:string;offset:number;length:number}[]=[];let total=0;
 for(let i=0;i<count;i++){const flags=u8(),known=flags&63;let tag=KNOWN_TAGS[known]??'';if(known===63)tag=String.fromCharCode(u8(),u8(),u8(),u8());const version=flags>>>6,original=base128(),plain=tag==='glyf'||tag==='loca'?version===3:version===0,stored=plain?original:base128();if(tag==='loca'&&!plain&&stored)invalid('loca must transform to nothing');rows.push({tag,offset:total,length:stored});total+=stored;if(total>MAX_FONT_BYTES*4)invalid('tables exceed the inspection limit');}
 if(at+compressed>data.length)invalid('compressed data overruns the file');
 const tables=brotliDecode(data.subarray(at,at+compressed),total,total);return sfntFromTables(rows.filter(r=>WANTED.has(r.tag)).map(r=>({tag:r.tag,bytes:tables.subarray(r.offset,r.offset+r.length)})));
}
/** What a table parser can read from a font data URL: a plain sfnt as it is, WOFF2 reduced to its layout tables. */
export function fontTableBytes(data:string):ArrayBuffer{
 const match=/^data:font\/(ttf|otf|woff2);base64,/.exec(data);if(!match)throw Error('This font file cannot be read.');const raw=data.slice(match[0].length);if(raw.length>14_000_000)throw Error('This font is too large to inspect.');
 const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0)).buffer;if(match[1]!=='woff2')return bytes;try{return woff2LayoutTables(bytes);}catch{throw Error('This compressed font could not be read.');}
}
