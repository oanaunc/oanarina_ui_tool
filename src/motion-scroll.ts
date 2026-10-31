import {refuseBackgroundBlurPlayback} from './background-blur';
import {validateDocumentProgressiveBlur} from './progressive-blur';
import type {DesignNode} from './model';
import {effectPadding,effectsFor} from './effects';
import {effectiveStrokeWidth} from './edge-strokes';
import {strokesFor} from './paints';
import {pathControlBounds} from './path-control-bounds';
import {textInkOverflowBounds} from './text-layout';
import {identity,inverseMatrix,multiply,nodeMatrix,point} from './transforms';
import type {Matrix} from './transforms';
export interface ScrollPoint {x:number;y:number;}
interface Entry {node:DesignNode;matrix:Matrix;parent?:Entry;positioned?:Entry;visible:boolean;}
export interface MotionScrollScene {id:string;nodes:DesignNode[];entries:Entry[];byId:Map<string,Entry>;min:ScrollPoint;max:ScrollPoint;width:number;height:number;}
const finite=(v:number)=>Number.isFinite(v)&&Math.abs(v)<=1e9;
const corners=(n:DesignNode,m:Matrix,x=0,y=0,w=n.width,h=n.height)=>[point(m,x,y),point(m,x+w,y),point(m,x+w,y+h),point(m,x,y+h)];
function box(points:ScrollPoint[]){return {x:Math.min(...points.map(p=>p.x)),y:Math.min(...points.map(p=>p.y)),right:Math.max(...points.map(p=>p.x)),bottom:Math.max(...points.map(p=>p.y))};}
/** Read-only, frame-local scroll layout. The sampled root affine is deliberately excluded. */
export function motionScrollScene(nodes:DesignNode[],id:string):MotionScrollScene {refuseBackgroundBlurPlayback(nodes);
 if(nodes.length>20000)throw Error('Motion scrolling supports pages up to 20,000 layers.');
 const map=new Map(nodes.map(n=>[n.id,n])),children=new Map<string,DesignNode[]>();
 for(const n of nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}
 const root=map.get(id);if(!root||root.type!=='frame'||![root.width,root.height].every(finite)||root.width<0||root.height<0)throw Error('The scrolling frame is unavailable.');
 const entries:Entry[]=[{node:root,matrix:identity,visible:root.visible}],byId=new Map([[id,entries[0]]]),depth=new Map([[id,0]]);let positionedCount=0;
 if(!root.prototypeScroll||root.prototypeScroll==='none')return {id,nodes,entries,byId,min:{x:0,y:0},max:{x:0,y:0},width:root.width,height:root.height};
 // Check a global positioned/work budget before doing matrix feasibility or text bounds.
 let work=0;for(let i=0;i<entries.length;i++){const e=entries[i];for(const n of children.get(e.node.id)??[]){if(byId.has(n.id)||entries.length>=20000)throw Error('Motion scrolling requires an acyclic hierarchy.');const d=depth.get(e.node.id)!+1;if(d>256)throw Error('Motion scrolling supports up to 256 ancestor levels.');const positioned=e.positioned??(e.node.id!==id&&e.node.prototypePosition&&e.node.prototypePosition!=='normal'?e:undefined),entry:Entry={node:n,matrix:identity,parent:e,positioned,visible:e.visible&&n.visible};entries.push(entry);byId.set(n.id,entry);depth.set(n.id,d);if(!positioned&&n.prototypePosition&&n.prototypePosition!=='normal')positionedCount++;work+=d;}}
 if(positionedCount>512||work>2000000)throw Error('This frame exceeds the Motion scroll positioning budget (512 positioned roots / 2 million hierarchy steps).');
 for(const e of entries)if(e.node.id!==id&&!e.positioned&&e.node.prototypePosition&&e.node.prototypePosition!=='normal'){for(let owner=e.parent;owner;owner=owner.parent)if(effectsFor(owner.node).some(effect=>effect.type==='progressive-blur'))throw Error('Motion scrolling with fixed or sticky descendants inside a progressive blur is unavailable. Remove the ancestor blur or use normal scroll positioning before previewing.');}
 const progressiveRegions=validateDocumentProgressiveBlur({pages:[{nodes}]});
 let x=0,y=0,right=root.width,bottom=root.height;
 for(const e of entries){if(e.parent)e.matrix=multiply(e.parent.matrix,nodeMatrix(e.node,e.parent.node));if(e.matrix.some(v=>!finite(v)))throw Error('Motion scroll transforms exceed finite coordinates.');
  if(e.node.id!==id&&!e.positioned&&e.node.prototypePosition&&e.node.prototypePosition!=='normal'){try{inverseMatrix(e.parent!.matrix);}catch{throw Error('A fixed or sticky layer has a collapsed parent inside this frame. Restore that parent’s scale before previewing.');}}
  if(!e.visible||e.node.id===id||e.node.type==='slice'||e.node.mask||e.node.prototypePosition==='fixed'||e.positioned?.node.prototypePosition==='fixed')continue;
  // Conservative ink/control/effect extents; inner clips can leave harmless extra scroll space.
  const n=e.node,padding=effectPadding(effectsFor(n))+Math.max(0,...strokesFor(n).filter(s=>s.visible).map(s=>effectiveStrokeWidth(s,n)*(s.align==='inside'?0:s.align==='center'?.5:1))),curve=pathControlBounds(n),ink=textInkOverflowBounds(n),lx=Math.min(0,curve?.x??0,ink?.x??0)-padding,ly=Math.min(0,curve?.y??0,ink?.y??0)-padding,rx=Math.max(n.width,curve?curve.x+curve.width:0,ink?ink.x+ink.width:0)+padding,by=Math.max(n.height,curve?curve.y+curve.height:0,ink?ink.y+ink.height:0)+padding,b=box(corners(n,e.matrix,lx,ly,rx-lx,by-ly));x=Math.min(x,b.x);y=Math.min(y,b.y);right=Math.max(right,b.right);bottom=Math.max(bottom,b.bottom);const region=progressiveRegions.get(n.id);if(region&&effectsFor(n).some(e=>e.visible&&e.type==='progressive-blur')){const outer=multiply(e.parent!.matrix,nodeMatrix({...n,flipX:false,flipY:false,motionScaleX:undefined,motionScaleY:undefined},e.parent!.node)),ink=box(corners(n,outer,region.x,region.y,region.width,region.height));x=Math.min(x,ink.x);y=Math.min(y,ink.y);right=Math.max(right,ink.right);bottom=Math.max(bottom,ink.bottom);}
 }
 const horizontal=['horizontal','both'].includes(root.prototypeScroll??'none'),vertical=['vertical','both'].includes(root.prototypeScroll??'none'),min={x:horizontal?Math.floor(x):0,y:vertical?Math.floor(y):0},max={x:horizontal?Math.ceil(Math.max(0,right-root.width)):0,y:vertical?Math.ceil(Math.max(0,bottom-root.height)):0};
 if(![min.x,min.y,max.x,max.y].every(finite)||max.x-min.x>1e7||max.y-min.y>1e7)throw Error('The Motion scroll extent exceeds the 10 million unit limit.');
 return {id,nodes,entries,byId,min,max,width:root.width,height:root.height};
}
export function clampMotionScroll(scene:MotionScrollScene,p:ScrollPoint):ScrollPoint{return {x:Math.max(scene.min.x,Math.min(scene.max.x,Number.isFinite(p.x)?p.x:0)),y:Math.max(scene.min.y,Math.min(scene.max.y,Number.isFinite(p.y)?p.y:0))};}
export function motionScrollPhysical(scene:MotionScrollScene,p:ScrollPoint){const q=clampMotionScroll(scene,p);return {x:q.x-scene.min.x,y:q.y-scene.min.y};}
export function motionScrollSemantic(scene:MotionScrollScene,p:ScrollPoint){return clampMotionScroll(scene,{x:p.x+scene.min.x,y:p.y+scene.min.y});}
export function motionScrollTarget(scene:MotionScrollScene,id:string){if(!scene.min.x&&!scene.min.y&&!scene.max.x&&!scene.max.y)return {x:0,y:0};const e=scene.byId.get(id);if(!e)throw Error('The scroll target is outside this frame.');const b=box(corners(e.node,e.matrix));return clampMotionScroll(scene,{x:b.x,y:b.y});}
/** Project desired sticky compensation into its actual parent rectangle and axis pin interval. */
function stickyDelta(scene:MotionScrollScene,e:Entry,s:ScrollPoint){
 const b=box(corners(e.node,e.matrix)),desired={x:Math.max(0,s.x-b.x),y:Math.max(0,s.y-b.y)},parent=e.parent!,inv=inverseMatrix(parent.matrix),local=box(corners(e.node,multiply(inv,e.matrix))),root=parent.node.id===scene.id;
 const left=root?scene.min.x:0,top=root?scene.min.y:0,right=root?scene.width+scene.max.x:parent.node.width,bottom=root?scene.height+scene.max.y:parent.node.height;
 // Already overflowing source children may stay where authored, but never jump farther outside.
 const planes=[{a:-inv[0],b:-inv[2],c:Math.max(0,local.x-left)},{a:inv[0],b:inv[2],c:Math.max(0,right-local.right)},{a:-inv[1],b:-inv[3],c:Math.max(0,local.y-top)},{a:inv[1],b:inv[3],c:Math.max(0,bottom-local.bottom)}];
 let polygon:ScrollPoint[]=[{x:0,y:0},{x:desired.x,y:0},desired,{x:0,y:desired.y}];
 for(const p of planes){const next:ScrollPoint[]=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=p.a*a.x+p.b*a.y-p.c,db=p.a*b.x+p.b*b.y-p.c;if(da<=1e-8)next.push(a);if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);next.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}polygon=next;if(!polygon.length)return {x:0,y:0};}
 if(planes.every(p=>p.a*desired.x+p.b*desired.y<=p.c+1e-8))return desired;
 let best=polygon[0],distance=Infinity;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((desired.x-a.x)*dx+(desired.y-a.y)*dy)/(dx*dx+dy*dy||1))),q={x:a.x+t*dx,y:a.y+t*dy},d=(q.x-desired.x)**2+(q.y-desired.y)**2;if(d<distance){distance=d;best=q;}}return best;
}
/** Flat model translations are inherited once; nested positioned roots travel with the outer root. */
export function motionScrollNodes(scene:MotionScrollScene,offset:ScrollPoint){const s=clampMotionScroll(scene,offset);if(!s.x&&!s.y)return scene.nodes;const shifts=new Map<string,ScrollPoint>([[scene.id,{x:-s.x,y:-s.y}]]),plans=new Map<string,ScrollPoint>();
 for(const e of scene.entries){if(e.node.id===scene.id)continue;let shift=shifts.get(e.parent!.node.id)!;if(!e.positioned&&e.node.prototypePosition&&e.node.prototypePosition!=='normal'){const d=e.node.prototypePosition==='fixed'?s:stickyDelta(scene,e,s),inv=inverseMatrix(e.parent!.matrix);shift={x:shift.x+inv[0]*d.x+inv[2]*d.y,y:shift.y+inv[1]*d.x+inv[3]*d.y};}shifts.set(e.node.id,shift);if(shift.x||shift.y)plans.set(e.node.id,shift);}
 return scene.nodes.map(n=>{const d=plans.get(n.id);return d?{...n,x:n.x+d.x,y:n.y+d.y}:n;});}

/** Stable-source reaction/navigation rows, without repeated per-layer ancestor scans. */
export function motionActiveNodes(nodes:DesignNode[],id:string){
 if(nodes.length>20000)throw Error('Motion scrolling supports pages up to 20,000 layers.');
 const map=new Map(nodes.map(n=>[n.id,n])),children=new Map<string,DesignNode[]>();for(const n of nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}
 let parent=map.get(id),depth=0;const ancestors=new Set<string>();while(parent){if(ancestors.has(parent.id)||++depth>256)throw Error('Motion scrolling supports up to 256 ancestor levels without cycles.');ancestors.add(parent.id);if(!parent.visible)return [];parent=map.get(parent.parentId??'');}
 const root=map.get(id);if(!root)return [];const result:DesignNode[]=[],seen=new Set<string>(),queue=[{node:root,depth:0}];for(let i=0;i<queue.length;i++){const e=queue[i];if(seen.has(e.node.id)||e.depth>256)throw Error('Motion scrolling requires an acyclic hierarchy up to 256 levels.');seen.add(e.node.id);if(!e.node.visible)continue;result.push(e.node);for(const n of children.get(e.node.id)??[])queue.push({node:n,depth:e.depth+1});}const visible=new Set(result.map(n=>n.id));return nodes.filter(n=>visible.has(n.id));
}
