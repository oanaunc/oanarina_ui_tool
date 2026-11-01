import paper from 'paper/dist/paper-core.js';
import type {NetworkEdge,NetworkVertex} from './vector-network-geometry';

type Graph={vertices:NetworkVertex[];edges:NetworkEdge[]};
type P={x:number;y:number};
const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
const EPS=1e-6,END=1e-7,lerp=(a:P,b:P,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function fail(text:string):never{throw Error('Vector network: '+text);}
/** The curves of a Paper path as edges, with one unwelded vertex per segment. */
export function paperGraph(item:paper.PathItem,id:()=>string):Graph{const paths=item.children?.length?item.children as paper.Path[]:[item as paper.Path],vertices:NetworkVertex[]=[],edges:NetworkEdge[]=[];for(const path of paths){const ids=new Map(path.segments.map(s=>{const v={id:id(),x:s.point.x,y:s.point.y};vertices.push(v);return [s,v.id];}));for(const c of path.curves){const bent=c.handle1.length>1e-9||c.handle2.length>1e-9;edges.push({id:id(),from:ids.get(c.segment1)!,to:ids.get(c.segment2)!,...(bent?{fromHandle:{x:c.handle1.x,y:c.handle1.y},toHandle:{x:c.handle2.x,y:c.handle2.y}}:{})});}}return {vertices,edges};}
/**
 * Welds coincident vertices and places an explicit junction at every crossing, so a drawn crossing becomes shared
 * topology. Existing edge identities stay on the first part of a split edge; overlapping edges have no single junction and refuse.
 * `origin` learns which source edge each further part came from.
 */
export function planarizeNetworkGraph(g:Graph,id:()=>string,origin?:Map<string,string>):Graph{
 scope.activate();const vertices=[...g.vertices],alias=new Map<string,string>();
 const real=(v:string)=>{while(alias.has(v))v=alias.get(v)!;return v;};
 for(let i=0;i<vertices.length;i++){if(alias.has(vertices[i].id))continue;for(let j=i+1;j<vertices.length;j++)if(!alias.has(vertices[j].id)&&Math.hypot(vertices[i].x-vertices[j].x,vertices[i].y-vertices[j].y)<EPS)alias.set(vertices[j].id,vertices[i].id);}
 const lookup=new Map(vertices.map(v=>[v.id,v])),edges=g.edges.map(e=>({...e,from:real(e.from),to:real(e.to)})).filter(e=>e.from!==e.to||e.fromHandle||e.toHandle),paths=edges.map(e=>{const a=lookup.get(e.from)!,b=lookup.get(e.to)!,p=new scope.Path({insert:false});p.moveTo(new scope.Point(a.x,a.y));p.cubicCurveTo(new scope.Point(a.x+(e.fromHandle?.x??0),a.y+(e.fromHandle?.y??0)),new scope.Point(b.x+(e.toHandle?.x??0),b.y+(e.toHandle?.y??0)),new scope.Point(b.x,b.y));return p;});
 const cuts=edges.map(()=>[] as {t:number;vertex:string}[]),added:NetworkVertex[]=[];let pairs=0;
 const junction=(p:P)=>{for(const v of [...vertices.filter(v=>!alias.has(v.id)),...added])if(Math.hypot(v.x-p.x,v.y-p.y)<EPS*10)return v.id;if(added.length>=256)fail('the crossings exceed the graph budget.');const v={id:id(),x:p.x,y:p.y};added.push(v);return v.id;};
 const interior=(t:number)=>t>END&&t<1-END,split=(i:number,t:number,vertex:string)=>{if(interior(t))cuts[i].push({t,vertex});};
 try{
  paths.forEach((p,i)=>{for(const hit of p.getIntersections()){const v=junction(hit.point);split(i,hit.time,v);split(i,hit.intersection.time,v);}});
  for(let i=0;i<paths.length;i++)for(let j=0;j<i;j++){if(++pairs>100000)fail('the graph exceeds 100,000 edge-pair checks.');const a=paths[i].bounds,b=paths[j].bounds;if(a.right<b.left-1e-7||b.right<a.left-1e-7||a.bottom<b.top-1e-7||b.bottom<a.top-1e-7)continue;
   for(const hit of paths[i].getIntersections(paths[j])){if(hit.hasOverlap())fail('overlapping edges cannot share one junction. Separate them first.');const t=hit.time,u=hit.intersection.time,end=(k:number,time:number)=>time<=END?edges[k].from:time>=1-END?edges[k].to:undefined,one=end(i,t),two=end(j,u);if(one&&two)continue;const v=one??two??junction(hit.point);split(i,t,v);split(j,u,v);}}
 }finally{for(const p of paths)p.remove();}
 const next:NetworkEdge[]=[];
 edges.forEach((e,i)=>{const list=[...cuts[i]].sort((a,b)=>a.t-b.t).filter((c,k,all)=>!k||c.t-all[k-1].t>END);if(!list.length){next.push(e);return;}
  const start=lookup.get(e.from)!,finish=lookup.get(e.to)!,curved=!!(e.fromHandle||e.toHandle);let c:[P,P,P,P]=[start,{x:start.x+(e.fromHandle?.x??0),y:start.y+(e.fromHandle?.y??0)},{x:finish.x+(e.toHandle?.x??0),y:finish.y+(e.toHandle?.y??0)},finish],from=e.from,base=0,first=true;
  const point=(v:string)=>lookup.get(v)??added.find(a=>a.id===v)!,push=(to:string,part:[P,P,P,P])=>{const a=point(from),b=point(to),edge:NetworkEdge={id:first?e.id:id(),from,to};if(!first)origin?.set(edge.id,e.id);if(curved){edge.fromHandle={x:part[1].x-a.x,y:part[1].y-a.y};edge.toHandle={x:part[2].x-b.x,y:part[2].y-b.y};}next.push(edge);first=false;from=to;};
  for(const cut of list){const t=(cut.t-base)/(1-base),ab=lerp(c[0],c[1],t),bc=lerp(c[1],c[2],t),cd=lerp(c[2],c[3],t),abc=lerp(ab,bc,t),bcd=lerp(bc,cd,t),p=lerp(abc,bcd,t);push(cut.vertex,[c[0],ab,abc,p]);c=[p,bcd,cd,c[3]];base=cut.t;}
  push(e.to,c);});
 const used=new Set(next.flatMap(e=>[e.from,e.to]));return {vertices:[...vertices.filter(v=>!alias.has(v.id)),...added].filter(v=>used.has(v.id)),edges:next};
}
