import paper from 'paper/dist/paper-core.js';
import type {NetworkEdge,NetworkRegionBoundary,NetworkVertex} from './vector-network-geometry';

type Graph={vertices:NetworkVertex[];edges:NetworkEdge[]};
type P={x:number;y:number};
export type NetworkLoop=NetworkRegionBoundary[];
/** One bounded planar face. `loops[0]` is canonical order only; holes are distinguished by evenodd paint, not position. */
export interface NetworkFace {key:string;loops:NetworkLoop[];area:number;}
const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
const TAU=Math.PI*2;
const number=(v:number)=>Math.round(v*100000)/100000,at=(p:P)=>`${number(p.x)} ${number(p.y)}`;
function fail(message:string):never{throw Error('Vector network region: '+message);}
function cross(a:P,b:P){return a.x*b.y-b.x*a.y;}
/** Half-edge h is edge h>>1, reversed when h&1. Its twin is therefore h^1. */
function controls(vertices:Map<string,NetworkVertex>,e:NetworkEdge,reverse:boolean):[P,P,P,P]{const a=vertices.get(e.from)!,b=vertices.get(e.to)!,c=[a,{x:a.x+(e.fromHandle?.x??0),y:a.y+(e.fromHandle?.y??0)},{x:b.x+(e.toHandle?.x??0),y:b.y+(e.toHandle?.y??0)},b] as [P,P,P,P];return reverse?[c[3],c[2],c[1],c[0]]:c;}
function cubic(c:[P,P,P,P],t:number){const u=1-t,a=u*u*u,b=3*u*u*t,d=3*u*t*t,e=t*t*t;return {x:a*c[0].x+b*c[1].x+d*c[2].x+e*c[3].x,y:a*c[0].y+b*c[1].y+d*c[2].y+e*c[3].y};}
/** Exact signed area contribution of one cubic: Green's theorem over the Bernstein basis. */
export function cubicSignedArea(c:readonly [P,P,P,P]){return (6*cross(c[0],c[1])+3*cross(c[0],c[2])+cross(c[0],c[3])+3*cross(c[1],c[2])+3*cross(c[1],c[3])+6*cross(c[2],c[3]))/20;}
function tangent(c:[P,P,P,P]){for(const p of [c[1],c[2],c[3]]){const x=p.x-c[0].x,y=p.y-c[0].y;if(Math.hypot(x,y)>1e-9)return Math.atan2(y,x);}return 0;}
/** Angle of the curve where it first leaves radius r; edges do not cross, so this order matches the tangent order. */
function departure(c:[P,P,P,P],r:number){let last=0;for(let i=1;i<=64;i++){const t=i/64,p=cubic(c,t);if(Math.hypot(p.x-c[0].x,p.y-c[0].y)>=r){let lo=last,hi=t;for(let j=0;j<24;j++){const m=(lo+hi)/2,q=cubic(c,m);if(Math.hypot(q.x-c[0].x,q.y-c[0].y)>=r)hi=m;else lo=m;}const q=cubic(c,hi);return Math.atan2(q.y-c[0].y,q.x-c[0].x);}last=t;}const end=c[3];return Math.atan2(end.y-c[0].y,end.x-c[0].x);}
const wrap=(a:number)=>{let v=a%TAU;if(v<0)v+=TAU;return v;};
/** Counter-clockwise rotation system in (x,y); tangent ties fall back to where the curves actually separate. */
function rotation(out:{h:number;c:[P,P,P,P];angle:number}[]){
 if(out.length<2)return out.map(o=>o.h);
 const sorted=[...out].sort((a,b)=>a.angle-b.angle||a.h-b.h);let base=sorted[0].angle,gap=-1;
 for(let i=0;i<sorted.length;i++){const a=sorted[i].angle,b=i+1<sorted.length?sorted[i+1].angle:sorted[0].angle+TAU;if(b-a>gap){gap=b-a;base=b;}}
 const keyed=out.map(o=>({...o,key:wrap(o.angle-base)})).sort((a,b)=>a.key-b.key||a.h-b.h),result:number[]=[];
 for(let i=0;i<keyed.length;){let j=i+1;while(j<keyed.length&&keyed[j].key-keyed[j-1].key<1e-7)j++;const run=keyed.slice(i,j);
  if(run.length>1){const lengths=run.map(o=>Math.hypot(o.c[3].x-o.c[0].x,o.c[3].y-o.c[0].y)),r=Math.min(...lengths)/64,mid=run[0].angle,rel=(a:number)=>{let d=(a-mid)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;},ordered=run.map(o=>({o,d:rel(departure(o.c,r))})).sort((a,b)=>a.d-b.d||a.o.h-b.o.h);for(const v of ordered)result.push(v.o.h);}else result.push(run[0].h);
  i=j;}
 return result;
}
const keyOf=(b:NetworkRegionBoundary)=>b.edgeId+(b.reverse?'\u0001':'\u0000');
function compareKeys(a:string,b:string){return a<b?-1:a>b?1:0;}
function canonicalLoop(loop:NetworkLoop){let best=0;for(let i=1;i<loop.length;i++)if(compareKeys(keyOf(loop[i]),keyOf(loop[best]))<0)best=i;return [...loop.slice(best),...loop.slice(0,best)];}
/** A face walk retraces bridges and dangling trees. Removing both directions leaves balanced closed loops; split them at repeated vertices. */
function simpleLoops(walk:number[],tail:(h:number)=>string,head:(h:number)=>string){
 const present=new Set(walk),remaining=walk.filter(h=>!present.has(h^1));if(!remaining.length)return [] as number[][];
 const outgoing=new Map<string,number[]>();for(const h of remaining){const list=outgoing.get(tail(h));if(list)list.push(h);else outgoing.set(tail(h),[h]);}
 const used=new Set<number>(),take=(v:string)=>{const list=outgoing.get(v);if(list)for(const h of list)if(!used.has(h)){used.add(h);return h;}return undefined;},loops:number[][]=[];
 for(const first of remaining){if(used.has(first))continue;used.add(first);const path:number[]=[],seen=new Map<string,number>([[tail(first),0]]);let h:number|undefined=first;
  while(h!==undefined){path.push(h);const v=head(h),index=seen.get(v);if(index!==undefined){const loop=path.splice(index);loops.push(loop);for(const edge of loop.slice(1))seen.delete(tail(edge));seen.set(v,index);if(!path.length)break;}else seen.set(v,path.length);h=take(v);if(h===undefined)fail('the face boundary is not closed.');}
 }
 return loops;
}
function loopPath(g:Graph,loops:NetworkLoop[]){return facePath(new Map(g.vertices.map(v=>[v.id,v])),new Map(g.edges.map(e=>[e.id,e])),loops);}
function facePath(vertices:Map<string,NetworkVertex>,edges:Map<string,NetworkEdge>,loops:NetworkLoop[]){return loops.map(loop=>{const first=edges.get(loop[0].edgeId)!,start=vertices.get(first[loop[0].reverse?'to':'from'])!;return 'M'+at(start)+loop.map(b=>{const e=edges.get(b.edgeId)!,c=controls(vertices,e,b.reverse);return e.fromHandle||e.toHandle?`C${at(c[1])} ${at(c[2])} ${at(c[3])}`:`L${at(c[3])}`;}).join('')+'Z';}).join(' ');}
/** Authoritative region fill path: evenodd over the loops of exactly this face. Never includes dangling branches. */
export function networkFacePath(g:Graph,loops:NetworkLoop[]){return loopPath(g,loops);}
/**
 * Bounded faces of a planar graph with explicit junctions. Topology comes only from the rotation system at
 * shared vertices, so crossings without a vertex never create faces; validateNetworkCurves refuses those.
 * Disconnected components nested inside a face become that face's holes.
 */
export function deriveNetworkFaces(g:Graph):NetworkFace[]{
 const vertices=new Map(g.vertices.map(v=>[v.id,v])),count=g.edges.length*2,outgoing=new Map<string,{h:number;c:[P,P,P,P];angle:number}[]>();
 const tail=(h:number)=>{const e=g.edges[h>>1];return h&1?e.to:e.from;},head=(h:number)=>{const e=g.edges[h>>1];return h&1?e.from:e.to;},half=(h:number)=>controls(vertices,g.edges[h>>1],!!(h&1));
 for(let h=0;h<count;h++){const c=half(h),list=outgoing.get(tail(h)),item={h,c,angle:tangent(c)};if(list)list.push(item);else outgoing.set(tail(h),[item]);}
 const next=new Int32Array(count).fill(-1);
 for(const list of outgoing.values()){const order=rotation(list);for(let i=0;i<order.length;i++){const previous=order[(i+order.length-1)%order.length];next[order[i]^1]=previous;}}
 const origin=g.vertices[0],shift=(p:P)=>({x:p.x-origin.x,y:p.y-origin.y}),area=(h:number)=>{const c=half(h);return cubicSignedArea([shift(c[0]),shift(c[1]),shift(c[2]),shift(c[3])]);};
 const parents=new Map<string,string>(g.vertices.map(v=>[v.id,v.id])),root=(id:string)=>{let p=id;while(parents.get(p)!==p)p=parents.get(p)!;while(parents.get(id)!==id){const n=parents.get(id)!;parents.set(id,p);id=n;}return p;};
 for(const e of g.edges)parents.set(root(e.from),root(e.to));
 const seen=new Uint8Array(count),walks:{walk:number[];area:number;component:string}[]=[];
 for(let h=0;h<count;h++){if(seen[h])continue;const walk:number[]=[];let cur=h,sum=0;while(!seen[cur]){seen[cur]=1;walk.push(cur);sum+=area(cur);cur=next[cur];if(cur<0)fail('invalid junction order.');}walks.push({walk,area:sum,component:root(tail(h))});}
 const outer=new Map<string,typeof walks[number]>();for(const w of walks){const o=outer.get(w.component);if(!o||w.area<o.area)outer.set(w.component,w);}
 const toBoundary=(loop:number[]):NetworkLoop=>canonicalLoop(loop.map(h=>({edgeId:g.edges[h>>1].id,reverse:!!(h&1)})));
 const faces:{loops:NetworkLoop[];area:number;component:string}[]=[];
 for(const w of walks){if(outer.get(w.component)===w)continue;const loops=simpleLoops(w.walk,tail,head).map(toBoundary);if(loops.length)faces.push({loops,area:w.area,component:w.component});}
 const islands=[...outer.entries()].map(([component,w])=>({component,loops:simpleLoops(w.walk,tail,head).map(toBoundary)})).filter(i=>i.loops.length);
 if(islands.length>1){scope.activate();const shapes=faces.map(f=>{const item=scope.PathItem.create(loopPath(g,f.loops));item.remove();item.fillRule='evenodd';return item;});
  try{for(const island of islands){const edge=g.edges.find(e=>e.id===island.loops[0][0].edgeId)!,p=vertices.get(edge.from)!,point=new scope.Point(p.x,p.y);let best=-1;for(let i=0;i<faces.length;i++){if(faces[i].component===island.component)continue;const b=shapes[i].bounds;if(p.x<b.left||p.x>b.right||p.y<b.top||p.y>b.bottom||!shapes[i].contains(point))continue;if(best<0||Math.abs(faces[i].area)<Math.abs(faces[best].area))best=i;}if(best>=0)faces[best].loops.push(...island.loops);}}
  finally{for(const item of shapes)item.remove();}}
 const result=faces.map(f=>{const loops=[...f.loops].sort((a,b)=>compareKeys(keyOf(a[0]),keyOf(b[0])));return {key:loops.map(l=>l.map(keyOf).join('')).join('\u0002'),loops,area:f.area};});
 return result.sort((a,b)=>compareKeys(keyOf(a.loops[0][0]),keyOf(b.loops[0][0])));
}
/** Independent cycles (E−V+C). Zero is a forest; one may stay a version 2 graph. */
export function networkCycleRank(g:Graph){const parents=new Map<string,string>(g.vertices.map(v=>[v.id,v.id])),root=(id:string)=>{let p=id;while(parents.get(p)!==p)p=parents.get(p)!;while(parents.get(id)!==id){const n=parents.get(id)!;parents.set(id,p);id=n;}return p;};let components=g.vertices.length;for(const e of g.edges){const a=root(e.from),b=root(e.to);if(a!==b){parents.set(a,b);components--;}}return g.edges.length-g.vertices.length+components;}
/** Deterministic, order-independent identity for a face nobody named yet. */
function fnv(text:string){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,'0');}
export interface PriorRegion<T> {id:string;loops:NetworkLoop[];value?:T;}
/**
 * Region identity survives splits, branches and moves through shared half-edges. A split face gives both parts the
 * parent's paint; a merged face keeps the larger painted neighbor. Newly enclosed faces start unpainted.
 */
export function matchNetworkRegions<T>(prior:PriorRegion<T>[],faces:NetworkFace[],undirected=false){
 const key=(b:NetworkRegionBoundary)=>undirected?b.edgeId:keyOf(b),sets=prior.map(o=>new Set(o.loops.flat().map(key))),pairs:{face:number;old:number;score:number}[]=[];
 faces.forEach((f,face)=>{const all=f.loops.flat().map(key);prior.forEach((_,old)=>{let score=0;for(const k of all)if(sets[old].has(k))score++;if(score)pairs.push({face,old,score});});});
 pairs.sort((a,b)=>b.score-a.score||Number(prior[b.old].value!==undefined)-Number(prior[a.old].value!==undefined)||compareKeys(prior[a.old].id,prior[b.old].id)||compareKeys(faces[a.face].key,faces[b.face].key));
 const named=new Map<number,string>(),taken=new Set<number>(),painted=new Map<number,T>();
 for(const p of pairs){if(prior[p.old].value!==undefined&&!painted.has(p.face))painted.set(p.face,prior[p.old].value as T);if(!named.has(p.face)&&!taken.has(p.old)){named.set(p.face,prior[p.old].id);taken.add(p.old);}}
 const used=new Set(named.values());
 return faces.map((f,i)=>{let id=named.get(i);if(!id){const base='region-'+fnv(f.key);id=base;for(let n=2;used.has(id);n++)id=base+'-'+n;used.add(id);}return {id,value:painted.get(i)};});
}
