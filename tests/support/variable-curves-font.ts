import {Out,buildSfnt,cmapTable,headTable,hheaTable,hmtxTable,maxpGlyf,nameTable,os2Table,postTable} from './font-builder';
/** A tiny original variable TrueType font built from code, reaching the paths a rectangle cannot.
 *  A is a curved ring whose deltas are sparse, so untouched points must be inferred. B is a bar whose tuples share one point list. C is a composite whose component offset varies. D moves its left phantom point. avar bends the weight axis, and one tuple is an intermediate region. */
export const VARIABLE_CURVES_FAMILY='Forma Fixture Curves';
type Point=[number,number,boolean];
const ring:Point[][]=[[[300,0,true],[50,0,false],[50,350,true],[50,700,false],[300,700,true],[550,700,false],[550,350,true],[550,0,false]],[[300,150,true],[400,150,false],[400,350,true],[400,550,false],[300,550,true],[200,550,false],[200,350,true],[200,150,false]]];
const bar:Point[][]=[[[100,0,true],[100,200,true],[500,200,true],[500,0,true]]];
const wedge:Point[][]=[[[100,0,true],[300,700,true],[500,0,true]]];
function simple(contours:Point[][]){const all=contours.flat(),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),o=new Out().i16(contours.length).i16(Math.min(...xs)).i16(Math.min(...ys)).i16(Math.max(...xs)).i16(Math.max(...ys));let end=-1;for(const c of contours){end+=c.length;o.u16(end);}o.u16(0);for(const p of all)o.u8(p[2]?1:0);let last=0;for(const x of xs){o.i16(x-last);last=x;}last=0;for(const y of ys){o.i16(y-last);last=y;}return o.bytes;}
/** Ring below, bar above it at (0,720). */
const composite=()=>new Out().i16(-1).i16(50).i16(0).i16(550).i16(920).u16(0x23).u16(1).i16(0).i16(0).u16(0x03).u16(2).i16(0).i16(720).bytes;
const outlines=[[],simple(ring),simple(bar),composite(),simple(wedge)];
const sides=[0,50,100,50,100],advances=[600,620,620,620,620];
function glyf(){const o=new Out(),offsets=[0];for(const g of outlines){o.raw(g);while(o.bytes.length%4)o.u8(0);offsets.push(o.bytes.length);}return {glyf:o,offsets};}
function loca(offsets:number[]){const o=new Out();for(const v of offsets)o.u32(v);return o;}
/** Size follows the text in a browser, so this axis shows whether an outline did the same. */
const axes:[string,number,number,number,number][]=[['wght',100,400,900,256],['wdth',75,100,125,257],['opsz',8,14,144,259]];
function fvar(){const o=new Out().u16(1).u16(0).u16(16).u16(2).u16(axes.length).u16(20).u16(1).u16(4+axes.length*4);for(const [tag,min,value,max,id] of axes)o.tag(tag).fixed(min).fixed(value).fixed(max).u16(0).u16(id);o.u16(258).u16(0).fixed(400).fixed(100).fixed(14);return o;}
/** Weight is bent so its upper half starts slowly: 650 is halfway in the file but only 0.2 of the way once mapped. */
function avar(){const o=new Out().u16(1).u16(0).u16(0).u16(axes.length),maps=[[[-1,-1],[-.5,-.7],[0,0],[.5,.2],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[0,0],[1,1]]];for(const map of maps){o.u16(map.length);for(const [from,to] of map)o.f2(from).f2(to);}return o;}
/** Point numbers as deltas from the previous one; word runs when `words`. */
function packedPoints(points:number[]|null,words=false){if(!points)return [0];const o=new Out().u8(points.length);o.u8((points.length-1)|(words?0x80:0));let last=0;for(const p of points){if(words)o.u16(p-last);else o.u8(p-last);last=p;}return o.bytes;}
/** The three forms: zero runs, byte runs and word runs. */
function packedDeltas(values:number[]){const o=new Out();let i=0;while(i<values.length){let run=1;if(values[i]===0){while(i+run<values.length&&values[i+run]===0&&run<64)run++;o.u8(0x80|(run-1));}else{const wide=(v:number)=>v<-128||v>127,word=wide(values[i]);while(i+run<values.length&&values[i+run]!==0&&wide(values[i+run])===word&&run<64)run++;o.u8((word?0x40:0)|(run-1));for(let k=0;k<run;k++){if(word)o.i16(values[i+k]);else o.u8(values[i+k]);}}i+=run;}return o.bytes;}
const padded=(list:number[])=>[...list,...new Array(axes.length-list.length).fill(0)];
interface Tuple {shared?:number;peak?:number[];start?:number[];end?:number[];points?:number[]|null;words?:boolean;x:number[];y:number[];}
function glyphData(tuples:Tuple[],sharedPoints?:number[]){const head=new Out(),body=new Out();if(sharedPoints)body.raw(packedPoints(sharedPoints));const serialized=tuples.map(t=>new Out().raw(t.points!==undefined?packedPoints(t.points,t.words):[]).raw(packedDeltas(t.x)).raw(packedDeltas(t.y)).bytes);tuples.forEach((t,i)=>{let index=t.shared??0;if(t.peak)index|=0x8000;if(t.start)index|=0x4000;if(t.points!==undefined)index|=0x2000;head.u16(serialized[i].length).u16(index);for(const list of [t.peak,t.start,t.end])if(list)for(const v of padded(list))head.f2(v);body.raw(serialized[i]);});const size=4+head.bytes.length;return new Out().u16(tuples.length|(sharedPoints?0x8000:0)).u16(size).raw(head.bytes).raw(body.bytes).bytes;}
const everywhere=(count:number,at:Record<number,number>)=>Array.from({length:count},(_,i)=>at[i]??0);
const variations=[[],glyphData([
  {shared:0,points:[0,2,4,6,8,12],words:true,x:[0,-30,0,30,0,0],y:[-20,0,20,0,30,-30]},
  {shared:1,points:null,x:everywhere(20,{2:40,6:-40,10:-30,14:30}),y:everywhere(20,{})},
  {peak:[.5,0],start:[.2,0],end:[1,0],points:[1,3,5,7],x:[-60,-60,60,60],y:[-60,60,60,-60]},
  {peak:[0,1],points:null,x:everywhere(20,{1:-300,2:-300,3:-300,5:300,6:300,7:300}),y:everywhere(20,{})},
 ]),glyphData([{shared:0,x:[150,150],y:[0,0]},{peak:[0,-1],x:[-60,-60],y:[20,20]},{peak:[0,0,1],x:[0,0],y:[300,300]}],[2,3]),glyphData([{shared:0,points:null,x:[0,30,0,0,0,0],y:[0,40,0,0,0,0]}]),glyphData([{shared:0,points:[0,1,2,3],x:[40,40,40,40],y:[0,0,0,0]}])];
function gvar(){const shared=[padded([1,0]),padded([-1,0])],count=outlines.length,sharedAt=20+(count+1)*4,dataAt=sharedAt+shared.length*axes.length*2,offsets=[0],body=new Out();for(const data of variations){body.raw(data);while(body.bytes.length%2)body.u8(0);offsets.push(body.bytes.length);}const o=new Out().u16(1).u16(0).u16(axes.length).u16(shared.length).u32(sharedAt).u16(count).u16(1).u32(dataAt);for(const v of offsets)o.u32(v);for(const t of shared)for(const v of t)o.f2(v);return o.raw(body.bytes);}
/** WebKit treats an fvar font with no STAT table as legacy GX and rescales font-weight, so a real variable font always has one. */
function stat(){const o=new Out().u16(1).u16(1).u16(8).u16(axes.length).u32(20).u16(0).u32(0).u16(2);axes.forEach(([tag,,,,id],i)=>o.tag(tag).u16(id).u16(i));return o;}
export function variableCurvesBytes():ArrayBuffer{const {glyf:glyphs,offsets}=glyf(),hmtx=hmtxTable(outlines.map((_,i)=>[advances[i],sides[i]]));return buildSfnt([['OS/2',os2Table(0x41,0x44)],['STAT',stat()],['avar',avar()],['cmap',cmapTable([[0x41,1],[0x42,2],[0x43,3],[0x44,4]])],['fvar',fvar()],['glyf',glyphs],['gvar',gvar()],['head',headTable()],['hhea',hheaTable(outlines.length)],['hmtx',hmtx],['loca',loca(offsets)],['maxp',maxpGlyf(outlines.length)],['name',nameTable([[1,VARIABLE_CURVES_FAMILY],[2,'Regular'],[3,VARIABLE_CURVES_FAMILY+' 1.0'],[4,VARIABLE_CURVES_FAMILY],[5,'Version 1.0'],[6,'FormaFixtureCurves'],[256,'Weight'],[257,'Width'],[258,'Regular'],[259,'Optical size']])],['post',postTable()]]);}
