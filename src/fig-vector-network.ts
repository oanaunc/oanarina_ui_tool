import type {VectorContour,VectorPoint} from './model';
import {contourPath,geometricArea,geometry} from './geometry';
import {node} from './model';
import type {ArrowheadStyle} from './arrowheads';
import {list,number,object,optional,string} from './fig-values';
import type {Raw} from './fig-values';
/** The stored vector network is optional source detail; `fillGeometry` stays the visual truth.
 * The reader accepts a blob only when every count and every byte is accounted for. Anything else
 * returns undefined, so the caller keeps the baked outline instead of guessing at a layout. */
export interface FigNetworkVertex {style:number;x:number;y:number;}
export interface FigNetworkSegment {style:number;start:number;end:number;startTangent:{x:number;y:number};endTangent:{x:number;y:number};}
export interface FigNetworkRegion {style:number;loops:number[][];}
export interface FigNetwork {vertices:FigNetworkVertex[];segments:FigNetworkSegment[];regions:FigNetworkRegion[];}
export interface FigContours {contours:VectorContour[];junctions:boolean;openEnds:{start:number;end:number}[];}
export const FIG_NETWORK_LIMITS={vertices:20000,segments:20000,regions:1000,loops:1000,points:100000} as const;
export function decodeFigVectorNetwork(data:Uint8Array):FigNetwork|undefined{
 if(!(data instanceof Uint8Array)||data.length<12||data.length>2_000_000||data.length%4)return;
 const view=new DataView(data.buffer,data.byteOffset,data.byteLength);let at=0;const u=()=>{const v=view.getUint32(at,true);at+=4;return v;},f=()=>{const v=view.getFloat32(at,true);at+=4;return v;};
 const vertexCount=u(),segmentCount=u(),regionCount=u();if(vertexCount>FIG_NETWORK_LIMITS.vertices||segmentCount>FIG_NETWORK_LIMITS.segments||regionCount>FIG_NETWORK_LIMITS.regions||12+vertexCount*12+segmentCount*28+regionCount*8>data.length)return;
 const vertices:FigNetworkVertex[]=[],segments:FigNetworkSegment[]=[],regions:FigNetworkRegion[]=[],finite=(...v:number[])=>v.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6);
 for(let i=0;i<vertexCount;i++){const style=u(),x=f(),y=f();if(!finite(x,y))return;vertices.push({style,x,y});}
 for(let i=0;i<segmentCount;i++){const style=u(),start=u(),sx=f(),sy=f(),end=u(),ex=f(),ey=f();if(start>=vertexCount||end>=vertexCount||!finite(sx,sy,ex,ey))return;segments.push({style,start,end,startTangent:{x:sx,y:sy},endTangent:{x:ex,y:ey}});}
 for(let i=0;i<regionCount;i++){if(at+8>data.length)return;const style=u(),loopCount=u();if(loopCount>FIG_NETWORK_LIMITS.loops)return;const loops:number[][]=[];for(let j=0;j<loopCount;j++){if(at+4>data.length)return;const count=u();if(count>segmentCount||at+count*4>data.length)return;const loop:number[]=[];for(let k=0;k<count;k++){const index=u();if(index>=segmentCount)return;loop.push(index);}loops.push(loop);}regions.push({style,loops});}
 return at===data.length?{vertices,segments,regions}:undefined;
}
type Options={scaleX:number;scaleY:number;mirroring?:(style:number)=>VectorPoint['mode']};
const hasHandle=(h:{x:number;y:number})=>Math.abs(h.x)>1e-9||Math.abs(h.y)>1e-9;
/** Loops become closed contours; remaining edges chain into open contours. A shared vertex is copied per contour. */
export function figNetworkContours(g:FigNetwork,{scaleX,scaleY,mirroring}:Options):FigContours|undefined{
 if(!g.segments.length)return;
 const scale=(h:{x:number;y:number})=>({x:h.x*scaleX,y:h.y*scaleY}),used=new Set<number>(),degree=new Map<number,number>(),contours:VectorContour[]=[],openEnds:FigContours['openEnds']=[];let points=0,junctions=false;
 for(const s of g.segments)for(const v of [s.start,s.end])degree.set(v,(degree.get(v)??0)+1);
 const point=(vertex:number):VectorPoint=>{const v=g.vertices[vertex],mode=mirroring?.(v.style);return {x:v.x*scaleX,y:v.y*scaleY,...(mode?{mode}:{})};};
 // Each step leaves `from` for `to`. A reversed segment swaps which stored tangent belongs to each end.
 const step=(s:FigNetworkSegment,reverse:boolean)=>reverse?{from:s.end,to:s.start,out:s.endTangent,in:s.startTangent}:{from:s.start,to:s.end,out:s.startTangent,in:s.endTangent};
 const emit=(steps:ReturnType<typeof step>[],closed:boolean)=>{const out:VectorPoint[]=[point(steps[0].from)];steps.forEach((s,i)=>{const a=out[out.length-1],last=closed&&i===steps.length-1,end=last?out[0]:point(s.to);if(hasHandle(s.out))a.out=scale(s.out);if(hasHandle(s.in))end.in=scale(s.in);if(!last)out.push(end);});points+=out.length;contours.push({closed,points:out});if(!closed)openEnds.push({start:steps[0].from,end:steps[steps.length-1].to});};
 for(const region of g.regions)for(const loop of region.loops){if(!loop.length)continue;const segments=loop.map(i=>g.segments[i]),steps:ReturnType<typeof step>[]=[];let at:number|undefined;
  for(let i=0;i<segments.length;i++){const s=segments[i],next=segments[(i+1)%segments.length];
   // The first edge's direction follows whichever end meets the next edge; a one-edge loop keeps its stored direction.
   if(at!==undefined&&s.start!==at&&s.end!==at)return;const reverse=at===undefined?segments.length>1&&s.end!==next.start&&s.end!==next.end:s.start!==at,current=step(s,reverse);steps.push(current);at=current.to;}
  if(at!==steps[0].from)return;if(loop.some(i=>used.has(i)))junctions=true;for(const i of loop)used.add(i);emit(steps,true);}
 const rest=g.segments.map((s,i)=>({s,i})).filter(e=>!used.has(e.i)),taken=new Set<number>(),incident=new Map<number,typeof rest>();for(const e of rest)for(const v of [e.s.start,e.s.end]){const a=incident.get(v)??[];a.push(e);incident.set(v,a);}
 const walk=(first:typeof rest[number],from:number)=>{const steps=[step(first.s,first.s.start!==from)];taken.add(first.i);let at=steps[0].to;for(;;){const open=(incident.get(at)??[]).filter(e=>!taken.has(e.i));if(degree.get(at)!==2||open.length!==1)break;const e=open[0];taken.add(e.i);const next=step(e.s,e.s.start!==at);steps.push(next);at=next.to;}emit(steps,at===steps[0].from&&steps.length>1&&degree.get(at)===2);};
 // Open ends first, so a chain starts at its end. What remains are stroke-only rings.
 for(const e of rest)if(!taken.has(e.i)){if(degree.get(e.s.start)!==2)walk(e,e.s.start);else if(degree.get(e.s.end)!==2)walk(e,e.s.end);}
 for(const e of rest)if(!taken.has(e.i))walk(e,e.s.start);
 for(const value of degree.values())if(value>2)junctions=true;
 return points>FIG_NETWORK_LIMITS.points||contours.length>1000?undefined:{contours,junctions,openEnds};
}
/** Rebuilt geometry must draw what the file already baked. Anything else keeps the baked outline. */
export function figSameArtwork(baked:string,rebuilt:string,fillRule?:'nonzero'|'evenodd'){
 const probe=(path:string)=>{const n=node('path',{path,width:1,height:1,x:0,y:0,fillRule}),g=geometry(n),b=g.bounds,box=[b.x,b.y,b.width,b.height];g.remove();return {box,area:geometricArea(n)};},a=probe(baked),b=probe(rebuilt);
 return a.box.every((v,i)=>Math.abs(v-b.box[i])<=.05)&&Math.abs(a.area-b.area)<=Math.max(.5,a.area*.01);
}
const arrowheads:Record<string,ArrowheadStyle>={ARROW_LINES:'open',ARROW_EQUILATERAL:'triangle',TRIANGLE_FILLED:'triangle',DIAMOND_FILLED:'diamond',CIRCLE_FILLED:'circle'};
/** A stroke end as a Forma arrowhead. Anything else, including the plain caps, draws no head. */
export const figArrowhead=(cap:string):ArrowheadStyle|undefined=>arrowheads[cap];
/** A stroke end's stored size: pixels as they are, the other units against the stroke weight. Nothing usable leaves the estimate to the caller. */
export function figCapSize(value:unknown,strokeWidth:number):number|undefined{const size=optional(value);if(size.value===undefined)return;const v=number(size.value,0),px=size.units==='PIXELS'?v:size.units==='PERCENT'?strokeWidth*v/100:strokeWidth*v;return px>=1&&px<=1000?px:undefined;}
/** How many layers a flattened vector needs to keep each region's own fill. Runs stay in stored order so regions keep their stacking. */
export const FIG_REGION_LIMIT=256;
export interface FigRegions {paints?:unknown;parts?:Raw[];}
export interface FigRun {first:number;styles:number[];total:number;shared:boolean;}
/** Which regions each fill layer of a split vector drew. Held beside the part, because the part is a record this importer wrote, not one the file holds. */
export const figPartRuns=new WeakMap<Raw,FigRun>();
/** The part of a network one run of fills came from. Fills line up with regions by position when both agree, and otherwise by style when each style belongs to one run. Anything else stays the baked outline. */
export function figRunNetwork(g:FigNetwork,run:FigRun):FigNetwork|undefined{
 const lined=run.total===g.regions.length?g.regions.slice(run.first,run.first+run.styles.length):[],regions=lined.length&&lined.every((r,i)=>r.style===run.styles[i])?lined:run.shared?[]:g.regions.filter(r=>run.styles.includes(r.style));if(!regions.length)return;
 const kept=[...new Set(regions.flatMap(r=>r.loops.flat()))].sort((a,b)=>a-b),at=new Map(kept.map((s,i)=>[s,i]));
 return {vertices:g.vertices,segments:kept.map(i=>g.segments[i]),regions:regions.map(r=>({style:r.style,loops:r.loops.map(loop=>loop.map(i=>at.get(i)!))}))};
}
export function figVectorRegions(raw:Raw,own:(style:Raw)=>unknown):FigRegions|undefined{
 const data=optional(raw.vectorData),fills=list(raw.fillGeometry,1000).map(object),table=new Map(list(data.styleOverrideTable,10000).map(object).map(s=>[number(s.styleID,0),s])),paintsOf=(id:number)=>{const style=table.get(id);return id&&style?.fillPaints!==undefined?own(style):raw.fillPaints;},runs:{paints:unknown;fills:Raw[]}[]=[];
 for(const fill of fills){const paints=paintsOf(number(fill.styleID,0)),last=runs[runs.length-1];if(last&&JSON.stringify(last.paints)===JSON.stringify(paints))last.fills.push(fill);else runs.push({paints,fills:[fill]});}
 if(!runs.length||runs.length===1&&JSON.stringify(runs[0].paints)===JSON.stringify(raw.fillPaints))return;if(runs.length===1)return {paints:runs[0].paints};if(runs.length>FIG_REGION_LIMIT)return;
 const owner=object(raw.guid),piece=(i:number,fields:Raw):Raw=>({guid:{sessionID:'9'+String(owner.sessionID),localID:String(owner.localID)+String(i).padStart(3,'0')},type:'VECTOR',name:string(raw.name,'Vector'),size:raw.size,visible:true,fillGeometry:[],...fields}),plain=(fill:Raw)=>({...fill,styleID:0}),strokes=list(raw.strokePaints,100).length?[piece(runs.length,{name:string(raw.name,'Vector')+' stroke',fillGeometry:fills.map(plain),fillPaints:[],strokePaints:raw.strokePaints,styleIdForStrokeFill:raw.styleIdForStrokeFill,strokeGeometry:raw.strokeGeometry,strokeWeight:raw.strokeWeight,strokeAlign:raw.strokeAlign,strokeCap:raw.strokeCap,strokeJoin:raw.strokeJoin,miterLimit:raw.miterLimit,dashPattern:raw.dashPattern,vectorData:{...data,styleOverrideTable:list(data.styleOverrideTable,10000).map(object).map(s=>{const {fillPaints:_,...rest}=s;return rest;})}})]:[];
 const owners=new Map<number,number>();runs.forEach((run,i)=>{for(const fill of run.fills){const style=number(fill.styleID,0);owners.set(style,owners.has(style)&&owners.get(style)!==i?-1:i);}});let seen=0;return {parts:[...runs.map((run,i)=>{const styles=run.fills.map(f=>number(f.styleID,0)),part=piece(i,{fillGeometry:run.fills.map(plain),fillPaints:run.paints,vectorData:{...data,styleOverrideTable:list(data.styleOverrideTable,10000).map(object).map(s=>{const {fillPaints:_,...rest}=s;return rest;})}});figPartRuns.set(part,{first:seen,styles,total:fills.length,shared:styles.some(s=>owners.get(s)===-1)});seen+=styles.length;return part;}),...strokes]};
}
export const figContourPath=(contours:VectorContour[])=>contours.map(c=>contourPath(c.points,c.closed)).join(' ');
