/** Small helpers for original fonts built from code, so tests need no third-party font file. */
export class Out {
 bytes:number[]=[];
 u8(v:number){this.bytes.push(v&255);return this;}
 u16(v:number){return this.u8(v>>8).u8(v);}
 i16(v:number){return this.u16(v<0?v+65536:v);}
 u32(v:number){return this.u16(Math.floor(v/65536)).u16(v%65536);}
 i32(v:number){return this.u32(v<0?v+4294967296:v);}
 fixed(v:number){return this.i32(Math.round(v*65536));}
 f2(v:number){return this.i16(Math.round(v*16384));}
 tag(t:string){for(const c of t)this.u8(c.charCodeAt(0));return this;}
 raw(b:number[]){for(const v of b)this.bytes.push(v);return this;}
 fill(n:number){for(let i=0;i<n;i++)this.u8(0);return this;}
}
export const headTable=(units=1000,longLoca=true)=>new Out().u32(0x10000).u32(0x10000).u32(0).u32(0x5f0f3cf5).u16(3).u16(units).fill(16).i16(0).i16(-200).i16(1000).i16(1000).u16(0).u16(8).i16(2).i16(longLoca?1:0).i16(0);
export const hheaTable=(metrics:number)=>new Out().u32(0x10000).i16(800).i16(-200).i16(0).u16(1000).i16(0).i16(0).i16(1000).i16(1).i16(0).i16(0).fill(8).i16(0).u16(metrics);
export const hmtxTable=(rows:[number,number][])=>{const o=new Out();for(const [advance,side] of rows)o.u16(advance).i16(side);return o;};
export const maxpCff=(glyphs:number)=>new Out().u32(0x5000).u16(glyphs);
export const maxpGlyf=(glyphs:number)=>new Out().u32(0x10000).u16(glyphs).u16(64).u16(8).u16(64).u16(8).u16(2).u16(0).u16(0).u16(0).u16(0).u16(64).u16(0).u16(8).u16(2);
export const postTable=()=>new Out().u32(0x30000).fill(28);
export const os2Table=(first:number,last:number)=>new Out().u16(4).i16(600).u16(400).u16(5).u16(0).fill(20).i16(0).i16(0).fill(10).fill(16).tag('NONE').u16(0x40).u16(first).u16(last).i16(800).i16(-200).i16(0).u16(800).u16(200).fill(8).i16(500).i16(700).u16(0).u16(0x20).u16(0);
/** One cmap segment per character. */
export function cmapTable(map:[number,number][]){const rows=[...map].sort((a,b)=>a[0]-b[0]),segments=rows.length+1,selector=Math.floor(Math.log2(segments)),o=new Out().u16(0).u16(1).u16(3).u16(1).u32(12).u16(4).u16(16+segments*8).u16(0).u16(segments*2).u16(2*2**selector).u16(selector).u16(segments*2-2*2**selector);for(const [code] of rows)o.u16(code);o.u16(0xffff).u16(0);for(const [code] of rows)o.u16(code);o.u16(0xffff);for(const [code,glyph] of rows)o.i16(((glyph-code+32768)&65535)-32768);o.i16(1);for(let i=0;i<segments;i++)o.u16(0);return o;}
export function nameTable(rows:[number,string][]){const o=new Out(),store=new Out();o.u16(0).u16(rows.length).u16(6+rows.length*12);for(const [id,value] of rows){const at=store.bytes.length;for(const c of value)store.u16(c.charCodeAt(0));o.u16(3).u16(1).u16(0x409).u16(id).u16(value.length*2).u16(at);}return o.raw(store.bytes);}
export function buildSfnt(tables:[string,Out][],signature=0x10000):ArrayBuffer{const rows=[...tables].sort((a,b)=>a[0]<b[0]?-1:1),count=rows.length,search=2**Math.floor(Math.log2(count))*16,o=new Out().u32(signature).u16(count).u16(search).u16(Math.floor(Math.log2(count))).u16(count*16-search);let at=12+count*16;const body=new Out();for(const [tag,table] of rows){const padded=[...table.bytes];while(padded.length%4)padded.push(0);let sum=0;for(let i=0;i<padded.length;i+=4)sum=(sum+padded[i]*16777216+padded[i+1]*65536+padded[i+2]*256+padded[i+3])%4294967296;o.tag(tag).u32(sum).u32(at).u32(table.bytes.length);body.raw(padded);at+=padded.length;}o.raw(body.bytes);return new Uint8Array(o.bytes).buffer;}
export const dataUrl=(format:'ttf'|'otf'|'woff2',bytes:ArrayBuffer|Uint8Array)=>'data:font/'+format+';base64,'+Buffer.from(bytes instanceof Uint8Array?bytes:new Uint8Array(bytes)).toString('base64');
