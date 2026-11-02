import {Out,buildSfnt,cmapTable,headTable,hheaTable,hmtxTable,maxpCff,nameTable,os2Table,postTable} from './font-builder';
/** A tiny original OpenType/CFF font built from code. Every glyph exists to reach a charstring path: each drawing operator, stems and masks, local and global subroutines, widths, and a seac composite.
 *  `cid` writes the same outlines as a CID-keyed font: two font dictionaries with different local subroutines, so a wrong selection draws the wrong shape. */
export const CFF_FONT_FAMILY='Forma Fixture CFF',CFF_CID_FONT_FAMILY='Forma Fixture CID';
const n=(v:number):number[]=>{if(v>=-107&&v<=107)return [v+139];if(v>=108&&v<=1131){const a=v-108;return [247+(a>>8),a&255];}if(v>=-1131&&v<=-108){const a=-v-108;return [251+(a>>8),a&255];}return [28,(v>>8)&255,v&255];};
const fixed=(v:number)=>{const o=new Out().u8(255).i32(Math.round(v*65536));return o.bytes;};
/** Numbers become operands; a one-item array is an operator; a two-item array an escaped one. */
const cs=(...items:(number|number[])[])=>items.flatMap(item=>typeof item==='number'?n(item):item);
const O={hstem:[1],vstem:[3],vmoveto:[4],rlineto:[5],hlineto:[6],vlineto:[7],rrcurveto:[8],callsubr:[10],ret:[11],endchar:[14],hstemhm:[18],hintmask:[19],cntrmask:[20],rmoveto:[21],hmoveto:[22],vstemhm:[23],rcurveline:[24],rlinecurve:[25],vvcurveto:[26],hhcurveto:[27],callgsubr:[29],vhcurveto:[30],hvcurveto:[31],hflex:[12,34],flex:[12,35],hflex1:[12,36],flex1:[12,37],div:[12,12],add:[12,10],sub:[12,11],mul:[12,24],neg:[12,14],abs:[12,9],drop:[12,18],dup:[12,27],exch:[12,28]};
const biased=(index:number,count:number)=>index-(count<1240?107:1131);
const globalSubrs=[cs(0,700,O.rlineto,O.ret),cs(biased(0,2),O.callgsubr,200,0,O.rlineto,O.ret)],localSubrs=[cs(O.endchar),cs(0,-700,O.rlineto,O.ret)],otherLocalSubrs=[cs(200,0,O.rlineto,O.endchar),cs(0,-300,O.rlineto,O.ret)];
const glyphs:{code?:number;sid:number;advance:number;data:number[]}[]=[
 {sid:0,advance:600,data:cs(O.endchar)},
 /* A: width on the moveto, a triangle with a counter wound the other way. */
 {code:0x41,sid:34,advance:640,data:cs(640,100,0,O.rmoveto,220,700,220,-700,O.rlineto,-180,80,O.rmoveto,-40,180,-40,-180,O.rlineto,O.endchar)},
 /* B: every curve form, odd and even operand counts. */
 {code:0x42,sid:35,advance:700,data:cs(100,0,O.rmoveto,0,120,0,180,80,100,O.rrcurveto,60,80,40,-20,O.hhcurveto,30,90,10,20,40,O.hhcurveto,60,40,30,80,O.vvcurveto,10,50,-20,20,60,O.vvcurveto,80,40,20,-60,20,O.hvcurveto,-80,-40,-30,-80,O.vhcurveto,-140,-180,-120,0,0,-20,O.rrcurveto,O.endchar)},
 /* C: alternating lines, then curves mixed with lines. */
 {code:0x43,sid:36,advance:700,data:cs(80,O.hmoveto,500,120,-340,460,O.hlineto,340,O.hlineto,120,-500,O.vlineto,O.endchar)},
 /* D: all four flex forms. */
 {code:0x44,sid:37,advance:760,data:cs(60,O.vmoveto,100,20,50,40,60,0,40,0,50,-30,100,-30,50,O.flex,60,40,50,30,60,70,80,O.hflex,0,300,O.rlineto,-100,10,-40,20,-60,-40,-50,-10,-60,O.hflex1,-60,10,-50,10,-40,0,-60,0,-50,-10,-60,O.flex1,O.endchar)},
 /* E: stems, implicit stems before a mask, and mask bytes that look like operators. */
 {code:0x45,sid:38,advance:600,data:cs(600,0,100,300,100,O.hstemhm,100,120,O.vstemhm,50,80,O.hintmask,[0xf8],100,0,O.rmoveto,O.cntrmask,[0x0e],400,700,-400,O.hlineto,O.endchar)},
 /* F: a local subroutine ending the glyph, reached through a global one that nests. */
 {code:0x46,sid:39,advance:600,data:cs(100,0,O.rmoveto,biased(1,2),O.callgsubr,biased(1,2),O.callsubr,biased(0,2),O.callsubr)},
 /* G: fractional operands, read as 16.16. */
 {code:0x47,sid:40,advance:600,data:cs(100,0,O.rmoveto,[...fixed(150.5),...fixed(699.25)],O.rlineto,[...fixed(249.5),...fixed(-699.25)],O.rlineto,O.endchar)},
 /* H: curves that end in a line, and lines that end in a curve. */
 {code:0x48,sid:41,advance:600,data:cs(100,0,O.rmoveto,0,100,50,150,100,50,200,0,O.rcurveline,100,100,0,100,-50,150,-100,50,O.rlinecurve,-250,0,O.rlineto,O.endchar)},
 /* I: the same calls as F, so in the CID font the second dictionary's subroutines show. */
 {code:0x49,sid:42,advance:600,data:cs(100,0,O.rmoveto,biased(1,2),O.callgsubr,biased(1,2),O.callsubr,biased(0,2),O.callsubr)},
 {code:0x65,sid:70,advance:520,data:cs(520,60,O.vmoveto,400,400,-400,O.hlineto,O.endchar)},
 {code:0xb4,sid:125,advance:300,data:cs(300,100,500,O.rmoveto,100,200,100,-200,O.rlineto,O.endchar)},
 /* é: e plus acute through endchar's four arguments. */
 {code:0xe9,sid:391,advance:520,data:cs(520,60,100,101,194,O.endchar)},
];
export const CFF_GLYPH_COUNT=glyphs.length;
function index(items:number[][]){const o=new Out().u16(items.length);if(!items.length)return o;o.u8(4);let at=1;o.u32(at);for(const item of items){at+=item.length;o.u32(at);}for(const item of items)o.raw(item);return o;}
const int5=(v:number)=>new Out().u8(29).i32(v).bytes;
const ops=(...rows:[number[],number[]][])=>rows.flatMap(([operands,op])=>[...operands,...op]);
function realNumber(text:string){const nibbles=[...text].map(c=>c==='.'?10:c==='-'?14:Number(c));nibbles.push(15);if(nibbles.length%2)nibbles.push(15);const out=[30];for(let i=0;i<nibbles.length;i+=2)out.push(nibbles[i]<<4|nibbles[i+1]);return out;}
function cffTable(cid:boolean,mutate?:(top:[number[],number[]][])=>void){
 const header=[1,0,4,4],names=index([[...Buffer.from(cid?'FormaFixtureCID':'FormaFixtureCFF')]]),strings=index(cid?[[...Buffer.from('Adobe')],[...Buffer.from('Identity')]]:[[...Buffer.from('eacute')]]),globals=index(globalSubrs);
 /* seac is not valid in a CID font. */const charStrings=index(glyphs.map(g=>cid&&g.sid===391?cs(O.endchar):g.data)),charset=new Out().u8(0);for(const [i,g] of glyphs.entries())if(i)charset.u16(cid?i:g.sid);
 const locals=[index(localSubrs),index(otherLocalSubrs)],privateDict=(subrsAt:number)=>ops([n(0),[20]],[n(0),[21]],[int5(subrsAt),[19]]),privates=[privateDict(0),privateDict(0)].map(p=>privateDict(p.length));
 /* Glyphs 1 to 7 use the first dictionary and later ones the second, so the F glyph needs the right local subroutines. */
 const fdSelect=new Out().u8(3).u16(2).u16(0).u8(0).u16(8).u8(1).u16(glyphs.length),fontDict=(privateAt:number,size:number)=>ops([[...int5(size),...int5(privateAt)],[18]]);
 const topFor=(at:{charset:number;charStrings:number;privateAt:number;privateSize:number;fdSelect:number;fdArray:number})=>{const rows:[number[],number[]][]=cid?[[[...n(391),...n(392),...n(0)],[12,30]],[int5(at.charset),[15]],[int5(at.charStrings),[17]],[int5(at.fdSelect),[12,37]],[int5(at.fdArray),[12,36]]]:[[int5(at.charset),[15]],[int5(at.charStrings),[17]],[[...int5(at.privateSize),...int5(at.privateAt)],[18]]];mutate?.(rows);return ops(...rows);};
 const size=topFor({charset:0,charStrings:0,privateAt:0,privateSize:0,fdSelect:0,fdArray:0}).length,prefix=header.length+names.bytes.length+index([new Array(size).fill(0)]).bytes.length+strings.bytes.length+globals.bytes.length;let at=prefix;const place=(length:number)=>{const value=at;at+=length;return value;},charsetAt=place(charset.bytes.length),selectAt=place(fdSelect.bytes.length),charStringsAt=place(charStrings.bytes.length),first=place(privates[0].length),firstLocal=place(locals[0].bytes.length),second=place(privates[1].length),secondLocal=place(locals[1].bytes.length),arrayAt=at,fonts=index([fontDict(first,privates[0].length),fontDict(second,privates[1].length)]);
 const top=topFor({charset:charsetAt,charStrings:charStringsAt,privateAt:first,privateSize:privates[0].length,fdSelect:selectAt,fdArray:arrayAt});if(firstLocal<first||secondLocal<second)throw Error('fixture layout');
 const o=new Out().raw(header).raw(names.bytes).raw(index([top]).bytes).raw(strings.bytes).raw(globals.bytes).raw(charset.bytes).raw(fdSelect.bytes).raw(charStrings.bytes).raw(privates[0]).raw(locals[0].bytes).raw(privates[1]).raw(locals[1].bytes);if(cid)o.raw(fonts.bytes);return o;
}
const hmtx=()=>hmtxTable(glyphs.map(g=>[g.advance,0]));
const cmap=()=>cmapTable(glyphs.flatMap((g,i):[number,number][]=>g.code?[[g.code,i]]:[]));
export function cffFontBytes(cid=false,table:Out=cffTable(cid)):ArrayBuffer{const family=cid?CFF_CID_FONT_FAMILY:CFF_FONT_FAMILY;return buildSfnt([['CFF ',table],['OS/2',os2Table(0x41,0xe9)],['cmap',cmap()],['head',headTable()],['hhea',hheaTable(glyphs.length)],['hmtx',hmtx()],['maxp',maxpCff(glyphs.length)],['name',nameTable([[1,family],[2,'Regular'],[3,family+' 1.0'],[4,family],[5,'Version 1.0'],[6,family.replaceAll(' ','')]])],['post',postTable()]],0x4f54544f);}
/** The same font with one Top DICT row added or changed, for refusal tests. */
export const cffFontWithTop=(mutate:(rows:[number[],number[]][])=>void,cid=false)=>cffFontBytes(cid,cffTable(cid,mutate));
export const cffMatrixRow=(values:string[]):[number[],number[]]=>[values.flatMap(realNumber),[12,7]];
/** One charstring replaced, for operator and budget tests. The other glyphs keep their bytes. */
export function cffFontWithGlyph(gid:number,data:number[]){const saved=glyphs[gid].data;glyphs[gid].data=data;try{return cffFontBytes(false);}finally{glyphs[gid].data=saved;}}
/** Global subroutines replaced, for recursion and work budget tests. */
export function cffFontWithGlobals(subrs:number[][],gid:number,data:number[]){const saved=[...globalSubrs];globalSubrs.length=0;globalSubrs.push(...subrs);try{return cffFontWithGlyph(gid,data);}finally{globalSubrs.length=0;globalSubrs.push(...saved);}}
export {cs as charstring,O as charstringOps,biased as subrIndex};
