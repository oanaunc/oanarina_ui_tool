import paper from 'paper/dist/paper-core.js';
import {deriveNetworkRegionBoundary,networkRegionPath,networkRegionFallback,refreshNetworkRegion} from './vector-network-region';
import {deriveNetworkFaces} from './vector-network-faces';
import {planarizeNetworkGraph} from './vector-network-planarize';
import type {VectorContour} from './model';
import type {Paint} from './paints';
export interface NetworkVertex {id:string;x:number;y:number;}
export interface NetworkEdge {id:string;from:string;to:string;fromHandle?:{x:number;y:number};toHandle?:{x:number;y:number};}
export interface NetworkRegionBoundary {edgeId:string;reverse:boolean;}
export interface NetworkRegion {id:string;boundary:NetworkRegionBoundary[];}
/** One bounded planar face; a hole is another loop of the same face. Optional paints exist only on version 3 graphs. */
export interface NetworkFaceRegion {id:string;loops:NetworkRegionBoundary[][];paints?:Paint[];}
export type VectorNetwork = {version:1;vertices:NetworkVertex[];edges:NetworkEdge[]} | {version:2;vertices:NetworkVertex[];edges:NetworkEdge[];regions:[NetworkRegion]} | {version:3;vertices:NetworkVertex[];edges:NetworkEdge[];regions:NetworkFaceRegion[]};
export const NETWORK_LIMITS={vertices:256,edges:256,degree:16,coordinate:995000,networks:64,totalVertices:8192,totalEdges:8192,pairTests:100000} as const;
const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
const fail=(text:string):never=>{throw Error('Vector network: '+text);};
const object=(value:unknown,keys:string[])=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))fail('invalid graph record.');};
const identity=(v:unknown)=>{if(typeof v!=='string'||!v.length||v.length>128)fail('graph identities must contain 1–128 characters.');};
function coordinate(v:unknown){if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>995000)fail('graph coordinates must be finite within ±995,000.');}
export function validateNetworkShape(value:unknown):asserts value is VectorNetwork {
 object(value,['version','vertices','edges','regions']);const g=value as VectorNetwork;
 if(![1,2,3].includes(g.version)||!Array.isArray(g.vertices)||g.vertices.length<2||g.vertices.length>256||!Array.isArray(g.edges)||!g.edges.length||g.edges.length>256)fail('use 2–256 vertices and 1–256 edges.');
 const vertices=new Map<string,NetworkVertex>(),degree=new Map<string,number>(),parents=new Map<string,string>();
 for(const v of g.vertices){object(v,['id','x','y']);identity(v.id);coordinate(v.x);coordinate(v.y);if(vertices.has(v.id))fail('vertex identities must be unique within their path.');vertices.set(v.id,v);parents.set(v.id,v.id);}
 let cycles=0;const root=(id:string)=>{let p=id;while(parents.get(p)!==p)p=parents.get(p)!;while(parents.get(id)!==id){const next=parents.get(id)!;parents.set(id,p);id=next;}return p;},ids=new Set<string>();
 for(const e of g.edges){object(e,['id','from','to','fromHandle','toHandle']);identity(e.id);identity(e.from);identity(e.to);if(ids.has(e.id)||!vertices.has(e.from)||!vertices.has(e.to)||e.from===e.to)fail('edges need unique identities and two existing distinct vertices.');ids.add(e.id);const a=root(e.from),b=root(e.to);if(a===b){if(g.version===1)fail('only acyclic stroke forests are supported; create a region explicitly to close a cycle.');if(++cycles>1&&g.version===2)fail('only one cycle region is supported in a version 2 graph.');}else parents.set(a,b);
  for(const id of [e.from,e.to]){const next=(degree.get(id)??0)+1;if(next>16)fail('a junction supports at most 16 incident edges.');degree.set(id,next);}
  for(const [id,h] of [[e.from,e.fromHandle],[e.to,e.toHandle]] as const)if(h!==undefined){object(h,['x','y']);coordinate(h.x);coordinate(h.y);const p=vertices.get(id)!;coordinate(p.x+h.x);coordinate(p.y+h.y);}
 }
 if(g.version===1){if('regions' in g)fail('version 1 forests cannot contain region metadata.');}else if(g.version===2){
  if(cycles!==1||!Array.isArray(g.regions)||g.regions.length!==1)fail('version 2 requires exactly one cycle region.');const region=g.regions[0];object(region,['id','boundary']);identity(region.id);if(!Array.isArray(region.boundary)||region.boundary.length<3||region.boundary.length>256)fail('invalid region boundary.');for(const b of region.boundary){object(b,['edgeId','reverse']);identity(b.edgeId);if(typeof b.reverse!=='boolean')fail('invalid region edge orientation.');}
  if(JSON.stringify(region.boundary)!==JSON.stringify(deriveNetworkRegionBoundary(g)))fail('the stored region boundary does not match its canonical cycle.');
 }
 if(g.vertices.some(v=>!degree.has(v.id)))fail('remove orphan vertices without incident edges.');
 for(let i=0;i<g.vertices.length;i++)for(let j=0;j<i;j++)if(Math.hypot(g.vertices[i].x-g.vertices[j].x,g.vertices[i].y-g.vertices[j].y)<1e-6)fail('distinct vertices cannot occupy the same position. Use an explicit shared junction.');
 if(g.version===3)validateFaceRegions(g,cycles);
}
function validateFaceRegions(g:Extract<VectorNetwork,{version:3}>,cycles:number){
 if(!cycles||!Array.isArray(g.regions)||!g.regions.length||g.regions.length>256)fail('version 3 requires its bounded face regions.');
 const faces=deriveNetworkFaces(g),ids=new Set<string>();if(faces.length!==g.regions.length)fail('the stored regions do not match the bounded faces of this graph.');
 g.regions.forEach((r,i)=>{object(r,['id','loops','paints']);identity(r.id);if(!/^[\w.~-]+$/.test(r.id)||ids.has(r.id))fail('region identities must be unique safe names.');ids.add(r.id);if(!Array.isArray(r.loops)||!r.loops.length||JSON.stringify(r.loops)!==JSON.stringify(faces[i].loops))fail('the stored region boundary does not match its canonical face.');if(r.paints!==undefined&&(!Array.isArray(r.paints)||!r.paints.length||r.paints.length>16))fail('a region supports 1–16 paints.');});
}
export function networkControls(g:VectorNetwork,e:NetworkEdge){const lookup=new Map(g.vertices.map(v=>[v.id,v]));return edgeControls(lookup,e);}
function edgeControls(lookup:Map<string,NetworkVertex>,e:NetworkEdge){const a=lookup.get(e.from)!,b=lookup.get(e.to)!;return [a,{x:a.x+(e.fromHandle?.x??0),y:a.y+(e.fromHandle?.y??0)},{x:b.x+(e.toHandle?.x??0),y:b.y+(e.toHandle?.y??0)},b] as const;}
export function networkContours(g:VectorNetwork):VectorContour[]{const lookup=new Map(g.vertices.map(v=>[v.id,v]));return g.edges.map(e=>{const a=lookup.get(e.from)!,b=lookup.get(e.to)!;return {closed:false,points:[{x:a.x,y:a.y,...(e.fromHandle?{out:{...e.fromHandle}}:{})},{x:b.x,y:b.y,...(e.toHandle?{in:{...e.toHandle}}:{})}]};});}
/** Same five-decimal presentation convention as ordinary contour paths; stored graph coordinates retain doubles. */
export function networkPath(g:VectorNetwork){const lookup=new Map(g.vertices.map(v=>[v.id,v])),at=(p:{x:number;y:number})=>`${Math.round(p.x*100000)/100000} ${Math.round(p.y*100000)/100000}`;return g.edges.map(e=>{const [a,h1,h2,b]=edgeControls(lookup,e);return `M${at(a)}${e.fromHandle||e.toHandle?`C${at(h1)} ${at(h2)} ${at(b)}`:`L${at(b)}`}`;}).join(' ');}
export function networkFallbackPath(g:VectorNetwork){return g.version===1?networkPath(g):g.version===2?networkRegionFallback(g):networkChainPath(g);}
/** Stroke geometry with edges chained through degree-2 vertices, so joins and dashes run through them. Closed chains end in Z. */
export function networkChainPath(g:VectorNetwork){
 const lookup=new Map(g.vertices.map(v=>[v.id,v])),at=(p:{x:number;y:number})=>`${Math.round(p.x*100000)/100000} ${Math.round(p.y*100000)/100000}`,incident=new Map(g.vertices.map(v=>[v.id,[] as NetworkEdge[]]));for(const e of g.edges){incident.get(e.from)!.push(e);incident.get(e.to)!.push(e);}
 const used=new Set<string>(),segment=(e:NetworkEdge,reverse:boolean)=>{const [a,h1,h2,b]=edgeControls(lookup,e),q=reverse?[b,h2,h1,a]:[a,h1,h2,b];return e.fromHandle||e.toHandle?`C${at(q[1])} ${at(q[2])} ${at(q[3])}`:`L${at(q[3])}`;};
 const chain=(start:string,first:NetworkEdge)=>{let d='M'+at(lookup.get(start)!),vertex=start,edge:NetworkEdge|undefined=first;while(edge){used.add(edge.id);const reverse=edge.to===vertex;d+=segment(edge,reverse);vertex=reverse?edge.from:edge.to;const list:NetworkEdge[]=incident.get(vertex)!;if(vertex===start&&list.length===2)return d+'Z';edge=list.length===2?list.find(e=>!used.has(e.id)):undefined;}return d;};
 const parts:string[]=[];for(const v of g.vertices){const list=incident.get(v.id)!;if(list.length!==2)for(const e of list)if(!used.has(e.id))parts.push(chain(v.id,e));}for(const e of g.edges)if(!used.has(e.id))parts.push(chain(e.from,e));return parts.join(' ');
}
export interface NetworkGeometryBudget {pairs:number;}
/** No inferred junctions: non-shared crossings/touches and interior re-crossings refuse. */
export function validateNetworkGeometry(g:VectorNetwork,budget:NetworkGeometryBudget={pairs:0}){
 validateNetworkShape(g);validateNetworkCurves(g,budget);if(g.version===1)return;
 // A v2 fill must also stay simple after the shared five-decimal path presentation quantization.
 const round=(v:number)=>Math.round(v*100000)/100000,vertices=g.vertices.map(v=>({...v,x:round(v.x),y:round(v.y)})),byId=new Map(g.vertices.map(v=>[v.id,v]));let changed=vertices.some((v,i)=>v.x!==g.vertices[i].x||v.y!==g.vertices[i].y);
 const edges=g.edges.map(e=>{const next={...e};for(const [side,id] of [['fromHandle',e.from],['toHandle',e.to]] as const){const h=e[side];if(!h)continue;const p=byId.get(id)!,x=p.x+h.x,y=p.y+h.y;if(round(x)!==x||round(y)!==y)changed=true;next[side]={x:round(x)-round(p.x),y:round(y)-round(p.y)};}return next;});
 if(changed){const rendered={...g,vertices,edges};validateNetworkShape(rendered);validateNetworkCurves(rendered,budget);}
}
function validateNetworkCurves(g:VectorNetwork,budget:NetworkGeometryBudget){scope.activate();const lookup=new Map(g.vertices.map(v=>[v.id,v])),paths:paper.Path[]=[];
 try{for(const e of g.edges){const [a,h1,h2,b]=edgeControls(lookup,e),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
   // Paper reports non-collinear self-intersections; collinear cubics need an explicit reversal check.
   if(Math.abs(dx*(h1.y-a.y)-dy*(h1.x-a.x))<=1e-8*length&&Math.abs(dx*(h2.y-a.y)-dy*(h2.x-a.x))<=1e-8*length){const u=((h1.x-a.x)*dx+(h1.y-a.y)*dy)/(length*length),v=((h2.x-a.x)*dx+(h2.y-a.y)*dy)/(length*length),qa=1-3*v+3*u,qb=2*v-4*u,t=qa>0?-qb/(2*qa):0,min=Math.min(u,1-v,...(t>0&&t<1?[qa*t*t+qb*t+u]:[]));if(min < -1e-10)fail('collinear cubic edges cannot reverse and overlap themselves.');}
   const p=new scope.Path({insert:false});p.moveTo(new scope.Point(a.x,a.y));p.cubicCurveTo(new scope.Point(h1.x,h1.y),new scope.Point(h2.x,h2.y),new scope.Point(b.x,b.y));paths.push(p);if(p.getIntersections().length)fail('self-crossing cubic edges are unsupported.');}
  for(let i=0;i<paths.length;i++)for(let j=0;j<i;j++){if(++budget.pairs>100000)fail('the project exceeds 100,000 graph edge-pair checks.');const bi=paths[i].bounds,bj=paths[j].bounds;if(bi.right<bj.left-1e-7||bj.right<bi.left-1e-7||bi.bottom<bj.top-1e-7||bj.bottom<bi.top-1e-7)continue;const a=g.edges[i],b=g.edges[j];for(const hit of paths[i].getIntersections(paths[j])){const endpoint=(e:NetworkEdge,t:number)=>Math.abs(t)<1e-7?e.from:Math.abs(t-1)<1e-7?e.to:undefined,one=endpoint(a,hit.time),two=endpoint(b,hit.intersection.time);if(!one||one!==two)fail('crossing, touching or overlapping geometry needs an explicit shared junction.');}}
  if(g.version===3)for(const f of deriveNetworkFaces(g)){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const b of f.loops.flat()){const p=lookup.get(g.edges.find(e=>e.id===b.edgeId)!.from)!;minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}if(!(Math.abs(f.area)>Math.max(1e-8,(maxX-minX)*(maxY-minY)*1e-10)))fail('every face must enclose a nonzero, stable region.');}
  if(g.version===2){const region=scope.PathItem.create(networkRegionPath(g));region.remove();try{region.translate(new scope.Point(-g.vertices[0].x,-g.vertices[0].y));const b=region.bounds;if(!Number.isFinite(region.area)||Math.abs(region.area)<=Math.max(1e-8,b.width*b.height*1e-10))fail('the cycle must enclose a nonzero, stable region.');}finally{region.remove();}}
 }finally{for(const p of paths)p.remove();}
}
const interpolate=(a:{x:number;y:number},b:{x:number;y:number},t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
/** Exact de Casteljau split; edge/vertex identities stay stable except explicit newly supplied records. */
export function branchNetwork(g:VectorNetwork,edgeId:string,t:number,end:{x:number;y:number},ids:{junction:string;tip:string;continuation:string;branch:string}){
 validateNetworkShape(g);if(!Number.isFinite(t)||t<=1e-5||t>=1-1e-5)fail('start a branch inside an edge; use the vertex branch action at an endpoint.');const found=g.edges.find(e=>e.id===edgeId);if(!found)throw Error('Vector network: the selected edge is missing.');const e=found;if(g.vertices.length+2>256||g.edges.length+2>256)fail('the new branch exceeds the graph budget.');coordinate(end.x);coordinate(end.y);const [a,b,c,d]=networkControls(g,e),ab=interpolate(a,b,t),bc=interpolate(b,c,t),cd=interpolate(c,d,t),abc=interpolate(ab,bc,t),bcd=interpolate(bc,cd,t),p=interpolate(abc,bcd,t),relative=(a:{x:number;y:number},b:{x:number;y:number})=>({x:a.x-b.x,y:a.y-b.y});
 let extra=0;const next=refreshNetworkRegion(g,planarizeNetworkGraph({vertices:[...g.vertices,{id:ids.junction,...p},{id:ids.tip,...end}],edges:g.edges.flatMap(edge=>edge.id!==e.id?[edge]:[{...e,to:ids.junction,fromHandle:relative(ab,a),toHandle:relative(abc,p)},{id:ids.continuation,from:ids.junction,to:e.to,fromHandle:relative(bcd,p),toHandle:relative(cd,d)},{id:ids.branch,from:ids.junction,to:ids.tip}])},()=>ids.branch+'-x'+(++extra)),ids.branch+'-region');validateNetworkGeometry(next);return next;
}
export function moveNetworkVertices(g:VectorNetwork,ids:readonly string[],delta:{x:number;y:number}){if(!Number.isFinite(delta.x)||!Number.isFinite(delta.y))fail('use a finite drag distance.');if(!delta.x&&!delta.y)return g;const selected=new Set(ids);if(!selected.size||ids.some(id=>!g.vertices.some(v=>v.id===id)))fail('select existing graph vertices.');const next=settled(g,{vertices:g.vertices.map(v=>selected.has(v.id)?{...v,x:v.x+delta.x,y:v.y+delta.y}:v),edges:g.edges});validateNetworkGeometry(next);return next;}
/** Geometry edits can move a nested component in or out of a face; only version 3 stores that topology. */
function settled(g:VectorNetwork,base:{vertices:NetworkVertex[];edges:NetworkEdge[]}):VectorNetwork{return g.version===3?refreshNetworkRegion(g,base):{...g,...base} as VectorNetwork;}
export function deleteNetworkEdges(g:VectorNetwork,ids:readonly string[]){const selected=new Set(ids);if(!selected.size)return g;if(ids.some(id=>!g.edges.some(e=>e.id===id)))fail('select existing graph edges.');const edges=g.edges.filter(e=>!selected.has(e.id));if(!edges.length)fail('delete the whole layer explicitly to remove its last edge.');const used=new Set(edges.flatMap(e=>[e.from,e.to])),vertices=g.vertices.filter(v=>used.has(v.id)),next=refreshNetworkRegion(g,{vertices,edges});validateNetworkGeometry(next);return next;}
/** Removes vertices with their incident edges; a vertex that keeps no edge goes too, as with edge deletion. */
export function deleteNetworkVertices(g:VectorNetwork,ids:readonly string[]){const selected=new Set(ids);if(!selected.size)return g;if(ids.some(id=>!g.vertices.some(v=>v.id===id)))fail('select existing graph vertices.');return deleteNetworkEdges(g,g.edges.filter(e=>selected.has(e.from)||selected.has(e.to)).map(e=>e.id));}

export function refuseNetworkConversion(n:{vectorNetwork?:VectorNetwork}){if(n.vectorNetwork)throw Error('Flatten this vector network to ordinary contours before using this geometry operation.');}
/** Independent edge handles belong to the edge, never to the shared junction vertex. */
export function setNetworkHandle(g:VectorNetwork,edgeId:string,side:'fromHandle'|'toHandle',value:{x:number;y:number}){const edge=g.edges.find(e=>e.id===edgeId);if(!edge)throw Error('Select an existing network edge.');coordinate(value.x);coordinate(value.y);const old=edge[side];if((old?.x??0)===value.x&&(old?.y??0)===value.y)return g;const next=settled(g,{vertices:g.vertices,edges:g.edges.map(e=>e===edge?{...e,[side]:{...value}}:e)});validateNetworkGeometry(next);return next;}
export function branchNetworkVertex(g:VectorNetwork,vertexId:string,end:{x:number;y:number},ids:{tip:string;branch:string}){validateNetworkShape(g);if(!g.vertices.some(v=>v.id===vertexId))throw Error('Select an existing network vertex.');if(g.vertices.length+1>256||g.edges.length+1>256)throw Error('The new branch exceeds the graph budget.');let extra=0;const next=refreshNetworkRegion(g,planarizeNetworkGraph({vertices:[...g.vertices,{id:ids.tip,...end}],edges:[...g.edges,{id:ids.branch,from:vertexId,to:ids.tip}]},()=>ids.branch+'-x'+(++extra)),ids.branch+'-region');validateNetworkGeometry(next);return next;}

/** Explicitly connect existing vertices; a first cycle mints one stable region identity. */
export function connectNetworkVertices(g:VectorNetwork,from:string,to:string,ids:{edge:string;region:string}){validateNetworkShape(g);if(!g.vertices.some(v=>v.id===from)||!g.vertices.some(v=>v.id===to)||from===to)fail('select two different existing vertices.');let extra=0;const next=refreshNetworkRegion(g,planarizeNetworkGraph({vertices:g.vertices,edges:[...g.edges,{id:ids.edge,from,to}]},()=>ids.edge+'-x'+(++extra)),ids.region);validateNetworkGeometry(next);return next;}
