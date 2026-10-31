/** A tiny original TrueType variable font built from code, so tests need no third-party font file.
 *  A, B and C are rectangles. wght widens them through real gvar deltas. wdth is declared with no deltas, and PRIV is a hidden axis.
 *  GSUB: liga A B -> glyph 4; salt B -> three alternates; ss01 C -> glyph 5, named "Tall terminals". */
export const VARIABLE_FONT_FAMILY='Forma Fixture Variable';
class Out {
 bytes:number[]=[];
 u8(v:number){this.bytes.push(v&255);return this;}
 u16(v:number){return this.u8(v>>8).u8(v);}
 i16(v:number){return this.u16(v<0?v+65536:v);}
 u32(v:number){return this.u16(Math.floor(v/65536)).u16(v%65536);}
 fixed(v:number){const n=Math.round(v*65536);return this.u32(n<0?n+4294967296:n);}
 tag(t:string){for(const c of t)this.u8(c.charCodeAt(0));return this;}
 raw(b:number[]){this.bytes.push(...b);return this;}
 fill(n:number){for(let i=0;i<n;i++)this.u8(0);return this;}
}
function glyph(right:number,top=700){const o=new Out();o.i16(1).i16(100).i16(0).i16(right).i16(top).u16(3).u16(0).raw([1,1,1,1]);const xs=[100,100,right,right],ys=[0,top,top,0];let last=0;for(const x of xs){o.i16(x-last);last=x;}last=0;for(const y of ys){o.i16(y-last);last=y;}return o.bytes.length%2?o.u8(0).bytes:o.bytes;}
const rights=[0,400,420,440,700,300,320,340];
const tops=[0,700,700,700,700,900,500,300];
function glyf(){const o=new Out(),offsets=[0];for(let i=0;i<rights.length;i++){if(i)o.raw(glyph(rights[i],tops[i]));while(o.bytes.length%4)o.u8(0);offsets.push(o.bytes.length);}return {glyf:o,offsets};}
function loca(offsets:number[]){const o=new Out();for(const v of offsets)o.u32(v);return o;}
const head=()=>new Out().u32(0x10000).u32(0x10000).u32(0).u32(0x5f0f3cf5).u16(3).u16(1000).fill(16).i16(0).i16(0).i16(1000).i16(1000).u16(0).u16(8).i16(2).i16(1).i16(0);
const hhea=()=>new Out().u32(0x10000).i16(800).i16(-200).i16(0).u16(1000).i16(0).i16(0).i16(1000).i16(1).i16(0).i16(0).fill(8).i16(0).u16(rights.length);
const maxp=()=>new Out().u32(0x10000).u16(rights.length).u16(4).u16(1).u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(64).u16(0).u16(0).u16(0);
const hmtx=()=>{const o=new Out();for(let i=0;i<rights.length;i++)o.u16(i?Math.max(600,rights[i]+100):500).i16(i?100:0);return o;};
const post=()=>new Out().u32(0x30000).fill(28);
const os2=()=>new Out().u16(4).i16(600).u16(400).u16(5).u16(0).fill(20).i16(0).i16(0).fill(10).fill(16).tag('NONE').u16(0x40).u16(0x41).u16(0x43).i16(800).i16(-200).i16(0).u16(800).u16(200).fill(8).i16(500).i16(700).u16(0).u16(0x20).u16(0);
function cmap(){const o=new Out();o.u16(0).u16(1).u16(3).u16(1).u32(12);const segments=2;o.u16(4).u16(16+segments*8).u16(0).u16(segments*2).u16(4).u16(1).u16(0);o.u16(0x43).u16(0xffff).u16(0);o.u16(0x41).u16(0xffff);o.i16(1-0x41).i16(1);o.u16(0).u16(0);return o;}
const names:[number,string][]=[[1,VARIABLE_FONT_FAMILY],[2,'Regular'],[3,'Forma Fixture 1.0'],[4,VARIABLE_FONT_FAMILY],[5,'Version 1.0'],[6,'FormaFixtureVariable'],[256,'Weight'],[257,'Width'],[258,'Light'],[259,'Regular'],[260,'Bold Wide'],[261,'Private'],[262,'Tall terminals']];
function name(){const o=new Out(),store=new Out();o.u16(0).u16(names.length).u16(6+names.length*12);for(const [id,value] of names){const at=store.bytes.length;for(const c of value)store.u16(c.charCodeAt(0));o.u16(3).u16(1).u16(0x409).u16(id).u16(value.length*2).u16(at);}return o.raw(store.bytes);}
const axes:[string,number,number,number,number,number][]=[['wght',100,400,900,0,256],['wdth',50,100,200,0,257],['PRIV',0,0,1,1,261]];
const instances:[number,number[]][]=[[258,[100,100,0]],[259,[400,100,0]],[260,[900,200,0]]];
function fvar(){const o=new Out().u16(1).u16(0).u16(16).u16(2).u16(axes.length).u16(20).u16(instances.length).u16(4+axes.length*4);for(const [tag,min,value,max,flags,id] of axes)o.tag(tag).fixed(min).fixed(value).fixed(max).u16(flags).u16(id);for(const [id,coordinates] of instances){o.u16(id).u16(0);for(const v of coordinates)o.fixed(v);}return o;}
/** One tuple at wght max: the two right-hand points move 300 units; phantom points stay. No point numbers are stored, so it covers every point. */
function gvar(){const data=new Out().u8(0x47);for(const d of [0,0,300,300,0,0,0,0])data.i16(d);data.u8(0x87);if(data.bytes.length%2)data.u8(0);const entry=new Out().u16(1).u16(4+4+axes.length*2).u16(data.bytes.length).u16(0x8000).i16(0x4000);for(let i=1;i<axes.length;i++)entry.i16(0);entry.raw(data.bytes);const offsets=[0];const body=new Out();for(let i=0;i<rights.length;i++){if(i>=1&&i<=3)body.raw(entry.bytes);offsets.push(body.bytes.length);}const o=new Out().u16(1).u16(0).u16(axes.length).u16(0).u32(0).u16(rights.length).u16(0);const headerSize=20+(rights.length+1)*2;o.u32(headerSize);for(const v of offsets)o.u16(v/2);return o.raw(body.bytes);}
function gsub(){
 const coverage=(glyphs:number[])=>{const o=new Out().u16(1).u16(glyphs.length);for(const g of glyphs)o.u16(g);return o.bytes;};
 const ligature=new Out().u16(1).u16(20).u16(1).u16(8).u16(1).u16(4).u16(4).u16(2).u16(2).u16(0).raw(coverage([1]));
 const alternates=new Out().u16(1).u16(16).u16(1).u16(8).u16(3).u16(5).u16(6).u16(7).raw(coverage([2]));
 const single=new Out().u16(2).u16(8).u16(1).u16(5).raw(coverage([3]));
 const lookups=[[4,ligature.bytes],[3,alternates.bytes],[1,single.bytes]] as const,list=new Out().u16(lookups.length);let at=2+lookups.length*2;const tables=lookups.map(([type,table])=>{const o=new Out().u16(type).u16(0).u16(1).u16(8).raw(table);return o.bytes;});for(const t of tables){list.u16(at);at+=t.length;}for(const t of tables)list.raw(t);
 const featureTags=['liga','salt','ss01'],features=new Out().u16(3),headerSize=2+3*6,tableSizes=[6,6,6];let offset=headerSize;const body=new Out();for(let i=0;i<3;i++){features.tag(featureTags[i]).u16(offset);offset+=tableSizes[i];}body.u16(0).u16(1).u16(0);body.u16(0).u16(1).u16(1);body.u16(6).u16(1).u16(2);body.u16(0).u16(262);features.raw(body.bytes);
 const scripts=new Out().u16(1).tag('latn').u16(8).u16(4).u16(0).u16(0).u16(0xffff).u16(3).u16(0).u16(1).u16(2);
 const o=new Out().u32(0x10000).u16(10).u16(10+scripts.bytes.length).u16(10+scripts.bytes.length+features.bytes.length);return o.raw(scripts.bytes).raw(features.bytes).raw(list.bytes);}
export function variableFontBytes():ArrayBuffer{const {glyf:glyphs,offsets}=glyf(),tables:[string,Out][]=[['GSUB',gsub()],['OS/2',os2()],['cmap',cmap()],['fvar',fvar()],['glyf',glyphs],['gvar',gvar()],['head',head()],['hhea',hhea()],['hmtx',hmtx()],['loca',loca(offsets)],['maxp',maxp()],['name',name()],['post',post()]];const count=tables.length,search=2**Math.floor(Math.log2(count))*16,o=new Out().u32(0x10000).u16(count).u16(search).u16(Math.floor(Math.log2(count))).u16(count*16-search);let at=12+count*16;const body=new Out();for(const [tag,table] of tables){const padded=[...table.bytes];while(padded.length%4)padded.push(0);let sum=0;for(let i=0;i<padded.length;i+=4)sum=(sum+padded[i]*16777216+padded[i+1]*65536+padded[i+2]*256+padded[i+3])%4294967296;o.tag(tag).u32(sum).u32(at).u32(table.bytes.length);body.raw(padded);at+=padded.length;}o.raw(body.bytes);return new Uint8Array(o.bytes).buffer;}
export const variableFontData=()=>'data:font/ttf;base64,'+Buffer.from(variableFontBytes()).toString('base64');
