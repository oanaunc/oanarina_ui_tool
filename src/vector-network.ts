import {inheritRegionPaints,refreshNetworkRegion,withNetworkFaces} from './vector-network-region';
import {deriveNetworkFaces,networkFacePath} from './vector-network-faces';
import {planarizeNetworkGraph} from './vector-network-planarize';
import paper from 'paper/dist/paper-core.js';
import {networkMatrix} from './vector-network-space';
import {point} from './transforms';
import type {DesignNode,VectorContour,VectorPoint} from './model';
import {fillsFor,strokesFor,validateStrokeStack,validatePaint} from './paints';
import type {Paint} from './paints';
import {networkFallbackPath,networkContours,validateNetworkGeometry,validateNetworkShape} from './vector-network-geometry';
import {contourPath} from './geometry';
import type {VectorNetwork,NetworkEdge,NetworkGeometryBudget,NetworkRegionBoundary} from './vector-network-geometry';
const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
const REGION_PAINTS:Paint['type'][]=['solid','linear','radial','angular','diamond'];
const paintsVisible=(paints:Paint[]|undefined)=>!!paints?.some(p=>p.visible&&p.opacity>0);
/** Region paints render through the shared gradient definitions; image and shader assets stay node-level and are not tracked here. */
function validateRegionPaints(paints:Paint[]){for(const p of paints){validatePaint(p);if(!REGION_PAINTS.includes(p.type))throw Error('Vector network regions support solid and gradient paints.');}if(new Set(paints.map(p=>p.id)).size!==paints.length)throw Error('Region paint identities must be unique.');}
export function validateNetworkNode(n:DesignNode,budget?:NetworkGeometryBudget){if(n.vectorNetwork===undefined)return;validateNetworkShape(n.vectorNetwork);
 if(n.type!=='path'||n.contours!==undefined||!Array.isArray(n.points)||n.points.length||n.path!==networkFallbackPath(n.vectorNetwork)||n.closed||n.booleanOp||n.layout!=='none'||n.media)throw Error('Vector networks require independent leaf paths with canonical graph geometry and its exact generated path fallback. Flatten the network before editing ordinary path data.');
 if(![n.width,n.height,n.pathWidth??n.width,n.pathHeight??n.height].every(v=>Number.isFinite(v)&&v>0&&v<=1e6))throw Error('Vector networks need a positive finite path coordinate box.');
 const paints=fillsFor(n),fills=paints.filter(p=>p.visible&&p.opacity>0),g=n.vectorNetwork;if(g.version===1&&fills.length||g.version===2&&(paints.length>1||paints.some(p=>p.type!=='solid')))throw Error('Vector networks support one solid region fill only on a version 2 cycle.');if(g.version===3){if(paints.length)throw Error('Version 3 vector networks keep their fills on regions, not on the layer.');for(const r of g.regions)if(r.paints)validateRegionPaints(r.paints);}for(const p of g.version===2?paints:fills)validatePaint(p);
 const strokes=strokesFor(n);if(strokes.length>16||strokes.some(s=>!Number.isFinite(s.width)||s.width<0||s.width>10000||s.align!=='center'||s.edgeWidths||s.variableWidth||s.dynamic||s.calligraphic)||n.arrowStart&&n.arrowStart!=='none'||n.arrowEnd&&n.arrowEnd!=='none')throw Error('Vector networks support centered strokes without per-edge widths, profiles, dynamic or calligraphic geometry, or arrowheads.');
 if(!strokes.some(s=>s.visible&&s.paint.visible&&s.width>0)&&!fills.length&&!(g.version===3&&g.regions.some(r=>paintsVisible(r.paints))))throw Error('A vector network needs a visible stroke or a filled region.');
 validateStrokeStack(strokes);const radius=Math.max(0,...strokes.map(s=>s.width))/2,sx=n.width/(n.pathWidth??n.width),sy=n.height/(n.pathHeight??n.height);for(const c of networkContours(n.vectorNetwork))for(const p of c.points)for(const q of [p,...(p.in?[{x:p.x+p.in.x,y:p.y+p.in.y}]:[]),...(p.out?[{x:p.x+p.out.x,y:p.y+p.out.y}]:[])])if(Math.abs(q.x*sx)+radius>1e6||Math.abs(q.y*sy)+radius>1e6)throw Error('The vector network stroke envelope exceeds ±1,000,000 local units.');
 validateNetworkGeometry(n.vectorNetwork,budget);
}
export function validateDocumentNetworks(d:{pages?:unknown;styles?:unknown;workspace?:unknown}){if(Array.isArray(d.styles))for(const style of d.styles)if(style?.value?.vectorNetwork!==undefined)throw Error('Vector graph topology cannot be stored in reusable styles.');if(!Array.isArray(d.pages))return;let count=0,vertices=0,edges=0;const budget={pairs:0};
 // Cheap structure/count checks precede intersection and ancestry work for the entire project.
 for(const page of d.pages)if(Array.isArray(page?.nodes))for(const n of page.nodes)if(n?.vectorNetwork!==undefined){validateNetworkShape(n.vectorNetwork);if(++count>64||(vertices+=n.vectorNetwork.vertices.length)>8192||(edges+=n.vectorNetwork.edges.length)>8192)throw Error('Vector networks exceed the project budget of 64 paths / 8,192 vertices / 8,192 edges.');}
 if(!count)return;if(d.workspace&&d.workspace!=='design')throw Error('Vector networks are currently supported only in Design documents.');
 for(const page of d.pages)if(Array.isArray(page?.nodes)){const nodes=page.nodes as DesignNode[];if(nodes.length>20000)throw Error('Vector networks support pages of at most 20,000 layers.');const map=new Map(nodes.map(n=>[n.id,n])),children=new Set(nodes.map(n=>n.parentId)),painted=new Set((page.motion?.tracks??[]).filter((t:{keyframes?:unknown[];property?:string})=>t.keyframes?.length&&!LAYER_TRACKS.has(t.property??'')).map((t:{nodeId:string})=>t.nodeId));
  for(const n of nodes){if(n.vectorNetwork===undefined)continue;if(children.has(n.id))throw Error('Vector networks must remain leaf layers.');let owner:DesignNode|undefined=n,depth=0;const seen=new Set<string>();while(owner){if(seen.has(owner.id)||++depth>64)throw Error('Vector networks support at most 64 acyclic ancestor layers.');seen.add(owner.id);if(owner.booleanOp)throw Error('Flatten the network before using it in a Boolean group.');if(owner.parentId&&!map.has(owner.parentId))throw Error('A vector network ancestor is missing.');owner=owner.parentId?map.get(owner.parentId):undefined;}
   if(painted.has(n.id))throw Error('Vector network paint tracks are not supported; animate the layer or flatten the network.');validateNetworkNode(n,budget);const matrix=networkMatrix(n,map),radius=Math.max(0,...strokesFor(n).map(s=>s.width))/2,sx=n.width/(n.pathWidth??n.width),sy=n.height/(n.pathHeight??n.height),px=radius*Math.hypot(matrix[0]/sx,matrix[2]/sy),py=radius*Math.hypot(matrix[1]/sx,matrix[3]/sy);
   for(const c of networkContours(n.vectorNetwork))for(const p of c.points)for(const q of [p,...(p.in?[{x:p.x+p.in.x,y:p.y+p.in.y}]:[]),...(p.out?[{x:p.x+p.out.x,y:p.y+p.out.y}]:[])]){const world=point(matrix,q.x,q.y);if(Math.abs(world.x)+px>1e6||Math.abs(world.y)+py>1e6)throw Error('The vector network world-space stroke envelope exceeds ±1,000,000.');}
  }
 }
}
export function contoursToNetwork(n:DesignNode,id:()=>string=()=>crypto.randomUUID()):VectorNetwork {
 if(n.vectorNetwork)throw Error('This layer is already a vector network.');const contours=n.contours;
 if(!contours?.length||contours.length>128||contours.some(c=>c.points.length<(c.closed?3:2)))throw Error('Convert a path with at least one contour of two or more anchors.');
 let count=0;for(const c of contours)if((count+=c.points.length)>256)throw Error('Vector networks support at most 256 source anchors.');
 const vertices:VectorNetwork['vertices']=[],edges:NetworkEdge[]=[];
 for(const c of contours){const ids=c.points.map(p=>{const vertex={id:id(),x:p.x,y:p.y};vertices.push(vertex);return vertex.id;});for(let i=1;i<c.points.length+(c.closed?1:0);i++){const index=i%c.points.length,from=c.points[i-1].out,to=c.points[index].in;edges.push({id:id(),from:ids[i-1],to:ids[index],...(from?{fromHandle:{...from}}:{}),...(to?{toHandle:{...to}}:{})});}}
 const base=planarizeNetworkGraph({vertices,edges},id),regionId=id(),forest:VectorNetwork={version:1,vertices:[],edges:[]},graph=refreshNetworkRegion(forest,base,regionId);
 const paints=fillsFor(n),visible=paintsVisible(paints);let result=graph;
 if(graph.version!==1&&visible){const filled=filledFaces(n,base),plain=paints.length===1&&paints[0].type==='solid';if(graph.version===2&&(!plain||!filled[0])||graph.version===3){const faces=withNetworkFaces(forest,base);result={...faces,regions:faces.regions.map((r,i)=>filled[i]?{...r,paints:structuredClone(paints)}:r)};}}
 validateNetworkGeometry(result);return result;
}
/** Which faces the closed source contours actually fill under the source winding rule. */
function filledFaces(n:DesignNode,g:{vertices:VectorNetwork['vertices'];edges:NetworkEdge[]}){scope.activate();const faces=deriveNetworkFaces(g),source=scope.PathItem.create((n.contours??[]).filter(c=>c.closed).map(c=>contourPath(c.points,true)).join(' ')||'M0 0');source.remove();source.fillRule=n.fillRule??'nonzero';return faces.map(f=>{const item=scope.PathItem.create(networkFacePath(g,f.loops));item.remove();item.fillRule='evenodd';return source.contains(item.interiorPoint);});}
/** Moves paint between the layer and its regions when the graph version changes, so the generated cache and paints stay one transaction. */
export function networkNodePatch(n:DesignNode,graph:VectorNetwork):Partial<DesignNode>{
 const old=n.vectorNetwork,fills=fillsFor(n),paint:Partial<DesignNode>={};let next=graph;
 if(graph.version===3&&old?.version!==3&&(old?.version===2||fills.length)){if(old?.version===2&&fills.some(p=>p.visible&&p.opacity>0))next=inheritRegionPaints(old,fills,graph);Object.assign(paint,{fill:'none',gradient:false,paints:[]});}
 else if(graph.version===1&&old?.version===2&&fills.some(p=>p.visible))Object.assign(paint,{fill:'none',gradient:false,paints:fills.map(p=>({...p,visible:false}))});
 const patch={...paint,vectorNetwork:next,points:[],contours:undefined,path:networkFallbackPath(next),closed:undefined};validateNetworkNode({...n,...patch});return patch;
}
function loopContour(g:VectorNetwork,loop:NetworkRegionBoundary[]):VectorContour{const vertices=new Map(g.vertices.map(v=>[v.id,v])),edges=new Map(g.edges.map(e=>[e.id,e])),handles=(b:NetworkRegionBoundary)=>{const e=edges.get(b.edgeId)!;return {start:b.reverse?e.to:e.from,out:b.reverse?e.toHandle:e.fromHandle,in:b.reverse?e.fromHandle:e.toHandle};};return {closed:true,points:loop.map((b,i)=>{const h=handles(b),before=handles(loop[(i+loop.length-1)%loop.length]),v=vertices.get(h.start)!,p:VectorPoint={x:v.x,y:v.y};if(before.in)p.in={...before.in};if(h.out)p.out={...h.out};return p;})};}
/** Closed filled loops plus every remaining edge as an open contour. The whole result strokes in one operation, so shared edges never double. */
function filledContours(g:VectorNetwork,loops:NetworkRegionBoundary[][]):VectorContour[]{const closed=new Set(loops.flat().map(b=>b.edgeId)),open=networkContours(g).filter((_,i)=>!closed.has(g.edges[i].id));return [...loops.map(l=>loopContour(g,l)),...open];}
const paintKey=(paints:Paint[])=>JSON.stringify(paints.map(({id:_,stops,...p})=>({...p,stops:stops.map(({id:__,...s})=>s)})));
/** Regions of one paint stack flatten together; each further stack needs its own layer because an ordinary path has a single fill. */
export function flattenNetworkLayers(n:DesignNode):{patch:Partial<DesignNode>;layers:{name:string;paints:Paint[];contours:VectorContour[]}[]}{
 if(!n.vectorNetwork)throw Error('Select one vector network.');validateNetworkNode(n);const g=n.vectorNetwork,base={vectorNetwork:undefined,points:[],path:'',closed:undefined};
 if(g.version===2&&fillsFor(n).some(p=>p.visible&&p.opacity>0))return {patch:{...base,contours:filledContours(g,[g.regions[0].boundary]),fillRule:'evenodd'},layers:[]};
 const groups=new Map<string,{paints:Paint[];loops:NetworkRegionBoundary[][]}>();if(g.version===3)for(const r of g.regions)if(paintsVisible(r.paints)){const key=paintKey(r.paints!),group=groups.get(key);if(group)group.loops.push(...r.loops);else groups.set(key,{paints:r.paints!,loops:[...r.loops]});}
 const [first,...others]=[...groups.values()];if(!first)return {patch:{...base,contours:networkContours(g)},layers:[]};
 return {patch:{...base,contours:filledContours(g,first.loops),fillRule:'evenodd',paints:first.paints,fill:first.paints.find(p=>p.visible)?.color??'none',gradient:false},layers:others.map((group,i)=>({name:`${n.name} · region fill ${i+2}`,paints:group.paints,contours:group.loops.map(l=>loopContour(g,l))}))};
}
export function flattenNetworkPatch(n:DesignNode):Partial<DesignNode>{const {patch,layers}=flattenNetworkLayers(n);if(layers.length)throw Error('Flatten this network from the inspector so each region paint keeps its own layer.');return patch;}

/** Layer transform and opacity tracks sample like any other path. Fill/shader tracks would bypass region paint, so they stay refused. */
const LAYER_TRACKS=new Set(['x','y','width','height','rotation','opacity','scaleX','scaleY']);
export function validateNetworkMotion(nodes:DesignNode[],motion:{tracks:{nodeId:string;property?:string;keyframes:unknown[]}[]}|undefined){if(!motion?.tracks.length||!nodes.some(n=>n.vectorNetwork))return;const painted=new Set(motion.tracks.filter(t=>t.keyframes.length&&!LAYER_TRACKS.has(t.property??'')).map(t=>t.nodeId));for(const n of nodes)if(n.vectorNetwork&&painted.has(n.id))throw Error('Flatten vector networks before using paint Motion tracks.');}
