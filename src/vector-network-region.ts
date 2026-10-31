import type {NetworkEdge,NetworkVertex,NetworkRegionBoundary,VectorNetwork} from './vector-network-geometry';
import type {Paint} from './paints';
import {deriveNetworkFaces,matchNetworkRegions,networkCycleRank} from './vector-network-faces';
import type {PriorRegion} from './vector-network-faces';

type Graph={vertices:NetworkVertex[];edges:NetworkEdge[]};
function fail(message:string):never{throw Error('Vector network region: '+message);}
const at=(p:{x:number;y:number})=>`${Math.round(p.x*100000)/100000} ${Math.round(p.y*100000)/100000}`;
/** One unambiguous cycle, with any number of acyclic bridge branches/components. No face inference. */
export function deriveNetworkRegionBoundary(g:Graph):NetworkRegionBoundary[] {
 const adjacency=new Map(g.vertices.map(v=>[v.id,[] as NetworkEdge[]]));
 for(const e of g.edges){adjacency.get(e.from)!.push(e);adjacency.get(e.to)!.push(e);}
 const degrees=new Map([...adjacency].map(([id,edges])=>[id,edges.length])),removed=new Set<string>(),queue=[...degrees].filter(([,d])=>d<=1).map(([id])=>id);
 for(let i=0;i<queue.length;i++){const id=queue[i];for(const e of adjacency.get(id)!){if(removed.has(e.id))continue;removed.add(e.id);const next=e.from===id?e.to:e.from,d=degrees.get(next)!-1;degrees.set(next,d);if(d===1)queue.push(next);}}
 const core=g.edges.filter(e=>!removed.has(e.id)),vertices=new Set(core.flatMap(e=>[e.from,e.to]));
 if(core.length<3||vertices.size!==core.length||[...vertices].some(id=>degrees.get(id)!==2))fail('exactly one simple cycle with at least three distinct vertices is supported.');
 const start=[...vertices].sort()[0],first=adjacency.get(start)!.filter(e=>!removed.has(e.id)).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)[0],boundary:NetworkRegionBoundary[]=[];
 let vertex=start,edge=first;
 for(let i=0;i<core.length;i++){const reverse=edge.to===vertex;boundary.push({edgeId:edge.id,reverse});vertex=reverse?edge.from:edge.to;const next=adjacency.get(vertex)!.find(e=>!removed.has(e.id)&&e.id!==edge.id);if(!next)fail('the cycle boundary is incomplete.');edge=next;}
 if(vertex!==start||edge.id!==first.id||new Set(boundary.map(b=>b.edgeId)).size!==core.length)fail('multiple independent cycles are not supported.');
 return boundary;
}
export function withNetworkRegion(g:Graph,id:string):VectorNetwork {return {version:2,vertices:g.vertices,edges:g.edges,regions:[{id,boundary:deriveNetworkRegionBoundary(g)}]};}
function priorRegions(g:VectorNetwork):PriorRegion<Paint[]>[]{return g.version===3?g.regions.map(r=>({id:r.id,loops:r.loops,value:r.paints})):g.version===2?[{id:g.regions[0].id,loops:[g.regions[0].boundary]}]:[];}
/** Every bounded face, carrying identity and paint from the previous graph. Faces are derived, never trusted from callers. */
export function withNetworkFaces(prev:VectorNetwork,g:Graph):Extract<VectorNetwork,{version:3}>{const faces=deriveNetworkFaces(g),matched=matchNetworkRegions(priorRegions(prev),faces,prev.version===2);return {version:3,vertices:g.vertices,edges:g.edges,regions:faces.map((f,i)=>({id:matched[i].id,loops:f.loops,...(matched[i].value?{paints:matched[i].value}:{})}))};}
/** The smallest graph version that represents this topology: a forest, one simple cycle, or general faces. Version 3 keeps paint on its regions, so it never regresses to version 2. */
export function refreshNetworkRegion(prev:VectorNetwork,g:Graph,region='region-1'):VectorNetwork{const rank=networkCycleRank(g);if(!rank)return {version:1,vertices:g.vertices,edges:g.edges};if(prev.version!==3&&rank===1)try{return withNetworkRegion(g,prev.version===2?prev.regions[0].id:region);}catch{/* a two-edge lens has one cycle but needs face geometry */}return withNetworkFaces(prev,g);}
/** Version 2 keeps its fill on the node. When that graph grows faces the paint moves to every face descended from the old region. */
export function inheritRegionPaints(prev:Extract<VectorNetwork,{version:2}>,paints:Paint[],g:Extract<VectorNetwork,{version:3}>):Extract<VectorNetwork,{version:3}>{const matched=matchNetworkRegions([{id:prev.regions[0].id,loops:[prev.regions[0].boundary],value:paints}],g.regions.map(r=>({key:r.id,loops:r.loops,area:0})),true);return {...g,regions:g.regions.map((r,i)=>matched[i].value?{...r,paints:matched[i].value}:r)};}
function writer(g:Graph){const vertices=new Map(g.vertices.map(v=>[v.id,v])),edges=new Map(g.edges.map(e=>[e.id,e]));return {vertices,edges,segment:(e:NetworkEdge,reverse=false)=>{const from=vertices.get(reverse?e.to:e.from)!,to=vertices.get(reverse?e.from:e.to)!,h1=reverse?e.toHandle:e.fromHandle,h2=reverse?e.fromHandle:e.toHandle;return e.fromHandle||e.toHandle?`C${at({x:from.x+(h1?.x??0),y:from.y+(h1?.y??0)})} ${at({x:to.x+(h2?.x??0),y:to.y+(h2?.y??0)})} ${at(to)}`:`L${at(to)}`;}};}
/** Authoritative fill consists only of this closed, oriented cycle. Bridge edges never enter its path. */
export function networkRegionPath(g:VectorNetwork){if(g.version!==2)return '';const {vertices,edges,segment}=writer(g),boundary=g.regions[0].boundary,first=boundary[0],edge=edges.get(first.edgeId)!,start=vertices.get(first.reverse?edge.to:edge.from)!;return 'M'+at(start)+boundary.map(b=>segment(edges.get(b.edgeId)!,b.reverse)).join('')+'Z';}
/**
 * Appearance-only fallback for ordinary pre-graph readers. Reversed bridges cancel mathematically,
 * but browser antialiasing can differ at boundaries. The current renderer NEVER fills this walk.
 */
export function networkRegionFallback(g:Extract<VectorNetwork,{version:2}>){
 const {vertices,edges,segment}=writer(g),boundary=g.regions[0].boundary,cycle=new Set(boundary.map(b=>b.edgeId)),adjacency=new Map(g.vertices.map(v=>[v.id,[] as NetworkEdge[]]));
 for(const e of g.edges)if(!cycle.has(e.id)){adjacency.get(e.from)!.push(e);adjacency.get(e.to)!.push(e);}for(const list of adjacency.values())list.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const used=new Set<string>(),touched=new Set<string>();
 const visit=(id:string):string=>{touched.add(id);let result='';for(const e of adjacency.get(id)!){if(used.has(e.id))continue;used.add(e.id);const reverse=e.to===id,next=reverse?e.from:e.to;result+=segment(e,reverse)+visit(next)+segment(e,!reverse);}return result;};
 const first=boundary[0],firstEdge=edges.get(first.edgeId)!,start=first.reverse?firstEdge.to:firstEdge.from;
 let result='M'+at(vertices.get(start)!);for(const b of boundary){const e=edges.get(b.edgeId)!,id=b.reverse?e.to:e.from;result+=visit(id)+segment(e,b.reverse);}result+='Z';
 for(const id of [...vertices.keys()].sort())if(!touched.has(id)&&adjacency.get(id)!.some(e=>!used.has(e.id)))result+=' M'+at(vertices.get(id)!)+visit(id);
 return result;
}
