import {brotliDecode} from './brotli-decode';
import {MAX_FONT_BYTES} from './font-data';
import {viewOf} from './font-view';
import type {View} from './font-view';

/** The tables font inspection reads. Inspection never needs outlines; only `woff2Sfnt` rebuilds those. */
const WANTED=new Set(['name','fvar','GSUB','GPOS','cmap']);
const KNOWN_TAGS=['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];
const HEADER=48,MAX_TABLES=4096,MAX_SFNT_BYTES=64_000_000;
function invalid(why:string):never{throw Error('Invalid WOFF2 font: '+why+'.');}
/** A plain sfnt from loose tables, for the shared table parser. */
export function sfntFromTables(rows:readonly {tag:string;bytes:Uint8Array}[],flavor=0x10000):ArrayBuffer{const directory=12+rows.length*16,size=rows.reduce((sum,r)=>sum+r.bytes.length+3&~3,directory),out=new Uint8Array(size),view=new DataView(out.buffer);view.setUint32(0,flavor);view.setUint16(4,rows.length);let write=directory;rows.forEach((row,i)=>{const r=12+i*16;for(let c=0;c<4;c++)out[r+c]=row.tag.charCodeAt(c);view.setUint32(r+8,write);view.setUint32(r+12,row.bytes.length);out.set(row.bytes,write);write=write+row.bytes.length+3&~3;});return out.buffer;}
export const isWoff2=(bytes:ArrayBuffer)=>bytes.byteLength>=4&&new DataView(bytes).getUint32(0)===0x774f4632;
function woff2Tables(bytes:ArrayBuffer){
 if(!isWoff2(bytes))invalid('wrong signature');if(bytes.byteLength<HEADER)invalid('short header');
 const v=new DataView(bytes),data=new Uint8Array(bytes),flavor=v.getUint32(4),count=v.getUint16(12),compressed=v.getUint32(20);if(flavor===0x74746366)invalid('font collections are not read');if(!count||count>MAX_TABLES)invalid('table count');
 let at=HEADER;const u8=()=>{if(at>=data.length)invalid('short directory');return data[at++];},base128=()=>{let value=0;for(let i=0;i<5;i++){const byte=u8();if(i===0&&byte===0x80)invalid('leading zero');if(value>=2**25)invalid('number overflow');value=value*128+(byte&127);if(!(byte&128))return value;}return invalid('number too long');};
 const rows:{tag:string;version:number;offset:number;length:number}[]=[];let total=0;
 for(let i=0;i<count;i++){const flags=u8(),known=flags&63;let tag=KNOWN_TAGS[known]??'';if(known===63)tag=String.fromCharCode(u8(),u8(),u8(),u8());const version=flags>>>6,original=base128(),plain=tag==='glyf'||tag==='loca'?version===3:version===0,stored=plain?original:base128();if(tag==='loca'&&!plain&&stored)invalid('loca must transform to nothing');rows.push({tag,version,offset:total,length:stored});total+=stored;if(total>MAX_FONT_BYTES*4)invalid('tables exceed the inspection limit');}
 if(at+compressed>data.length)invalid('compressed data overruns the file');
 return {flavor,rows,tables:brotliDecode(data.subarray(at,at+compressed),total,total)};
}
/** Rebuilds a small sfnt holding only the layout and naming tables, so one parser serves every font format. */
export function woff2LayoutTables(bytes:ArrayBuffer):ArrayBuffer{const {rows,tables}=woff2Tables(bytes);return sfntFromTables(rows.filter(r=>WANTED.has(r.tag)).map(r=>({tag:r.tag,bytes:tables.subarray(r.offset,r.offset+r.length)})));}
interface Stream {view:View;at:number;}
const take8=(s:Stream)=>s.view.u8(s.at++),take16=(s:Stream)=>{const v=s.view.u16(s.at);s.at+=2;return v;},takeS16=(s:Stream)=>{const v=s.view.s16(s.at);s.at+=2;return v;};
/** WOFF2's variable-length count: one byte, or a marker byte and more. */
const take255=(s:Stream)=>{const code=take8(s);return code===253?take16(s):code===255?take8(s)+253:code===254?take8(s)+506:code;};
const signed=(flag:number,magnitude:number)=>flag&1?magnitude:-magnitude;
/** One point's step from the previous one, packed by its flag into one to four bytes. */
function takeStep(flag:number,s:Stream):[number,number]{if(flag<10)return [0,signed(flag,((flag&14)<<7)+take8(s))];if(flag<20)return [signed(flag,(((flag-10)&14)<<7)+take8(s)),0];if(flag<84){const a=flag-20,b=take8(s);return [signed(flag,1+(a&0x30)+(b>>4)),signed(flag>>1,1+((a&0x0c)<<2)+(b&0x0f))];}if(flag<120){const a=flag-84,x=take8(s),y=take8(s);return [signed(flag,1+(Math.floor(a/12)<<8)+x),signed(flag>>1,1+(((a%12)>>2)<<8)+y)];}if(flag<124){const x=take8(s),b=take8(s),y=take8(s);return [signed(flag,(x<<4)+(b>>4)),signed(flag>>1,((b&15)<<8)+y)];}const x=take16(s),y=take16(s);return [signed(flag,x),signed(flag>>1,y)];}
/** The glyf transform moves every field of every glyph into its own stream. This reassembles a plain glyf, written long and unpacked; the shared parser then reads it like any other font. */
function rebuildGlyf(table:Uint8Array){
 const v=viewOf(table),options=v.u16(2),count=v.u16(4);let start=36;const streams=Array.from({length:7},(_,i):Stream=>{const size=v.u32(8+i*4),stream={view:v.slice(start,size),at:0};start+=size;return stream;}),[contours,counts,flags,glyphs,composites,boxes,codes]=streams,bitmap=(count+31>>5)<<2;boxes.at=bitmap;boxes.view.check(0,bitmap);if(options&1)v.check(start,count+7>>3);
 let out=new Uint8Array(Math.min(MAX_SFNT_BYTES,Math.max(1<<16,table.length*3))),size=0;const room=(n:number)=>{if(size+n<=out.length)return;if(size+n>MAX_SFNT_BYTES)invalid('outlines exceed the size limit');const grown=new Uint8Array(Math.min(MAX_SFNT_BYTES,Math.max(size+n,out.length*2)));grown.set(out.subarray(0,size));out=grown;},put16=(n:number)=>{room(2);out[size++]=n>>8&255;out[size++]=n&255;},copy=(from:Stream,n:number)=>{from.view.check(from.at,n);room(n);out.set(table.subarray(from.view.start+from.at,from.view.start+from.at+n),size);size+=n;from.at+=n;};
 const loca=new Uint8Array((count+1)*4),offsets=new DataView(loca.buffer),xMins=new Int16Array(count);
 for(let id=0;id<count;id++){offsets.setUint32(id*4,size);const n=takeS16(contours),boxed=boxes.view.u8(id>>3)&(0x80>>(id&7));if(!n){if(boxed)invalid('an empty glyph has a box');continue;}if(n<-1)invalid('glyph contour count');
  if(n===-1){if(!boxed)invalid('a composite glyph has no box');put16(0xffff);const box=[takeS16(boxes),takeS16(boxes),takeS16(boxes),takeS16(boxes)];box.forEach(put16);xMins[id]=box[0];let more=0,coded=0;do{const part=composites.at;more=composites.view.u16(part);coded|=more&0x100;composites.at=part;copy(composites,4+(more&1?4:2)+(more&8?2:more&0x40?4:more&0x80?8:0));}while(more&0x20);if(coded){const length=take255(glyphs);put16(length);copy(codes,length);}}
  else{const ends:number[]=[];let total=0;for(let i=0;i<n;i++){total+=take255(counts);if(total>65535)invalid('glyph point count');ends.push(total-1);}if(n>8192||ends.some((e,i)=>e<(i?ends[i-1]+1:0)))invalid('glyph contour ends');const on:number[]=[],xs:number[]=[],ys:number[]=[];let x=0,y=0,left=32767,right=-32768,bottom=32767,top=-32768;for(let i=0;i<total;i++){const flag=take8(flags),[dx,dy]=takeStep(flag&127,glyphs);x+=dx;y+=dy;if(Math.abs(dx)>32767||Math.abs(dy)>32767||Math.abs(x)>32767||Math.abs(y)>32767)invalid('glyph coordinates');on.push(flag&128?0:1);xs.push(dx);ys.push(dy);left=Math.min(left,x);right=Math.max(right,x);bottom=Math.min(bottom,y);top=Math.max(top,y);}const length=take255(glyphs),box=boxed?[takeS16(boxes),takeS16(boxes),takeS16(boxes),takeS16(boxes)]:[left,bottom,right,top];put16(n);box.forEach(put16);xMins[id]=box[0];ends.forEach(put16);put16(length);copy(codes,length);room(total);out.set(on,size);size+=total;xs.forEach(put16);ys.forEach(put16);}
  const pad=-size&3;room(pad);size+=pad;}
 offsets.setUint32(count*4,size);return {glyf:out.slice(0,size),loca,xMins,count};
}
/** A transformed hmtx leaves out side bearings that equal each glyph's left edge. */
function rebuildHmtx(table:Uint8Array,count:number,metrics:number,xMins:Int16Array){const v=viewOf(table),flags=v.u8(0);if(flags&~3||!flags||metrics>count)invalid('hmtx transform');const out=new Uint8Array(metrics*4+(count-metrics)*2),w=new DataView(out.buffer);let at=1;for(let i=0;i<metrics;i++,at+=2)w.setUint16(i*4,v.u16(at));for(let i=0;i<count;i++){const place=i<metrics?i*4+2:metrics*4+(i-metrics)*2;if(flags&(i<metrics?1:2))w.setInt16(place,xMins[i]);else{w.setInt16(place,v.s16(at));at+=2;}}return out;}
/** The whole font as a plain sfnt, outlines included, for the outline decoder. Every stream read is bounded, and the rebuilt tables stop at a fixed size. */
export function woff2Sfnt(bytes:ArrayBuffer):ArrayBuffer{
 const {flavor,rows,tables}=woff2Tables(bytes),own=new Map<string,{tag:string;bytes:Uint8Array}>();for(const r of rows){if(own.has(r.tag))invalid('duplicate table');own.set(r.tag,{tag:r.tag,bytes:tables.subarray(r.offset,r.offset+r.length)});}
 const row=(tag:string)=>rows.find(r=>r.tag===tag),bad=rows.find(r=>r.tag==='glyf'||r.tag==='loca'?![0,3].includes(r.version):r.tag==='hmtx'?r.version>1:r.version!==0);if(bad)invalid('unknown table transform');const glyf=row('glyf'),loca=row('loca'),hmtx=row('hmtx');if(!!glyf!==!!loca||glyf&&glyf.version!==loca!.version)invalid('glyf and loca disagree');let xMins:Int16Array|undefined,count=0;
 if(glyf&&glyf.version===0){const rebuilt=rebuildGlyf(own.get('glyf')!.bytes),head=own.get('head')?.bytes.slice();xMins=rebuilt.xMins;count=rebuilt.count;if(!head||head.length<54)invalid('missing head');new DataView(head.buffer).setInt16(50,1);own.set('head',{tag:'head',bytes:head});own.set('glyf',{tag:'glyf',bytes:rebuilt.glyf});own.set('loca',{tag:'loca',bytes:rebuilt.loca});}
 if(hmtx?.version===1){if(!xMins)invalid('hmtx transform without a glyf transform');const hhea=own.get('hhea')?.bytes;if(!hhea||hhea.length<36)invalid('missing hhea');own.set('hmtx',{tag:'hmtx',bytes:rebuildHmtx(own.get('hmtx')!.bytes,count,viewOf(hhea).u16(34),xMins)});}
 const list=[...own.values()],size=list.reduce((sum,r)=>sum+r.bytes.length+3&~3,12+list.length*16);if(size>MAX_SFNT_BYTES)invalid('the font exceeds the size limit');return sfntFromTables(list,flavor);
}
/** What a table parser can read from a font data URL: a plain sfnt as it is, WOFF2 reduced to its layout tables. */
export function fontTableBytes(data:string):ArrayBuffer{
 const match=/^data:font\/(ttf|otf|woff2);base64,/.exec(data);if(!match)throw Error('This font file cannot be read.');const raw=data.slice(match[0].length);if(raw.length>14_000_000)throw Error('This font is too large to inspect.');
 const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0)).buffer;if(match[1]!=='woff2')return bytes;try{return woff2LayoutTables(bytes);}catch{throw Error('This compressed font could not be read.');}
}
