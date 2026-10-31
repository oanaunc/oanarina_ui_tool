import type {VectorContour,VectorPoint} from './model';
import {contourPath} from './geometry';
/** The stored vector network is optional source detail; `fillGeometry` stays the visual truth.
 * The reader accepts a blob only when every count and every byte is accounted for. Anything else
 * returns undefined, so the caller keeps the baked outline instead of guessing at a layout. */
export interface FigNetworkVertex {style:number;x:number;y:number;}
export interface FigNetworkSegment {style:number;start:number;end:number;startTangent:{x:number;y:number};endTangent:{x:number;y:number};}
export interface FigNetworkRegion {style:number;loops:number[][];}
export interface FigNetwork {vertices:FigNetworkVertex[];segments:FigNetworkSegment[];regions:FigNetworkRegion[];}
export interface FigContours {contours:VectorContour[];junctions:boolean;}
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
 const scale=(h:{x:number;y:number})=>({x:h.x*scaleX,y:h.y*scaleY}),used=new Set<number>(),degree=new Map<number,number>(),contours:VectorContour[]=[];let points=0,junctions=false;
 for(const s of g.segments)for(const v of [s.start,s.end])degree.set(v,(degree.get(v)??0)+1);
 const point=(vertex:number):VectorPoint=>{const v=g.vertices[vertex],mode=mirroring?.(v.style);return {x:v.x*scaleX,y:v.y*scaleY,...(mode?{mode}:{})};};
 // Each step leaves `from` for `to`. A reversed segment swaps which stored tangent belongs to each end.
 const step=(s:FigNetworkSegment,reverse:boolean)=>reverse?{from:s.end,to:s.start,out:s.endTangent,in:s.startTangent}:{from:s.start,to:s.end,out:s.startTangent,in:s.endTangent};
 const emit=(steps:ReturnType<typeof step>[],closed:boolean)=>{const out:VectorPoint[]=[point(steps[0].from)];steps.forEach((s,i)=>{const a=out[out.length-1],last=closed&&i===steps.length-1,end=last?out[0]:point(s.to);if(hasHandle(s.out))a.out=scale(s.out);if(hasHandle(s.in))end.in=scale(s.in);if(!last)out.push(end);});points+=out.length;contours.push({closed,points:out});};
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
 return points>FIG_NETWORK_LIMITS.points||contours.length>1000?undefined:{contours,junctions};
}
export const figContourPath=(contours:VectorContour[])=>contours.map(c=>contourPath(c.points,c.closed)).join(' ');
