import type {DesignNode} from './model';
import {identity,multiply,nodeMatrix,point} from './transforms';
import type {Matrix} from './transforms';
import {pathControlBounds} from './path-control-bounds';
import {strokesFor} from './paints';
import {effectiveStrokeWidth} from './edge-strokes';
import {arrowStyle} from './arrowheads';

export interface CullRect {x:number;y:number;width:number;height:number;}
export interface CullRoot {id:string;bounds:CullRect|null;uncertain:boolean;}
export interface ViewportCullIndex {source:readonly DesignNode[];roots:CullRoot[];rootFor:Map<string,string>;nodes:number;work:number;fallback:string;}
export const VIEWPORT_CULL_LIMITS={nodes:20000,depth:256,points:200000,strokes:100000,world:1_000_000_000,padding:128} as const;
const finiteRect=(b:CullRect)=>[b.x,b.y,b.width,b.height,b.x+b.width,b.y+b.height].every(Number.isFinite)&&b.width>=0&&b.height>=0;
function union(a:CullRect|null,b:CullRect):CullRect {if(!a)return {...b};const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return {x,y,width:Math.max(a.x+a.width,b.x+b.width)-x,height:Math.max(a.y+a.height,b.y+b.height)-y};}
function worldBox(b:CullRect,m:Matrix):CullRect {const p=[point(m,b.x,b.y),point(m,b.x+b.width,b.y),point(m,b.x+b.width,b.y+b.height),point(m,b.x,b.y+b.height)],x=Math.min(...p.map(p=>p.x)),y=Math.min(...p.map(p=>p.y));return {x,y,width:Math.max(...p.map(p=>p.x))-x,height:Math.max(...p.map(p=>p.y))-y};}
interface Resolved {matrix:Matrix;root:string;depth:number;}
/** One immutable-page index. Uncertain geometry is retained, never replaced by guessed clipping. */
export function indexViewportRoots(nodes:readonly DesignNode[]):ViewportCullIndex {
 const result:ViewportCullIndex={source:nodes,roots:[],rootFor:new Map(),nodes:nodes.length,work:0,fallback:''},fail=(message:string)=>({...result,fallback:message});
 if(nodes.length>VIEWPORT_CULL_LIMITS.nodes)return fail('Page exceeds the 20,000-layer culling budget.');
 const byId=new Map<string,DesignNode>(),resolved=new Map<string,Resolved>(),roots=new Map<string,CullRoot>();
 for(const n of nodes){result.work++;if(!n||typeof n.id!=='string'||!n.id||byId.has(n.id))return fail('Layer identities are not supported by this culling index.');byId.set(n.id,n);}
 // Artwork groups missing/falsy parents at the root. Malformed missing parents fall back instead of being reinterpreted.
 for(const n of nodes)if(!n.parentId){if(n.mask)return fail('Root-level sibling masks keep the complete scene.');const root={id:n.id,bounds:null,uncertain:false};roots.set(n.id,root);result.roots.push(root);}else if(!byId.has(n.parentId))return fail('A layer parent is unavailable.');
 let pointCount=0,strokeCount=0;
 for(const start of nodes){
  if(!resolved.has(start.id)){
   const chain:DesignNode[]=[],seen=new Set<string>();let n:DesignNode|undefined=start;
   while(n&&!resolved.has(n.id)){result.work++;if(seen.has(n.id)||chain.length>=VIEWPORT_CULL_LIMITS.depth)return fail('The culling hierarchy exceeds 256 levels or contains a cycle.');seen.add(n.id);chain.push(n);n=n.parentId?byId.get(n.parentId):undefined;}
   while(chain.length){const current=chain.pop()!,parent=current.parentId?byId.get(current.parentId):undefined,base=parent?resolved.get(parent.id):undefined,depth=(base?.depth??0)+1;if(depth>VIEWPORT_CULL_LIMITS.depth)return fail('The culling hierarchy exceeds 256 levels.');const root=base?.root??current.id,matrix=multiply(base?.matrix??identity,nodeMatrix(current,parent));resolved.set(current.id,{matrix,root,depth});result.rootFor.set(current.id,root);}
  }
  const n=start,r=resolved.get(n.id)!,root=roots.get(r.root);if(!root)return fail('A root layer could not be resolved.');
  const hasEffects=n.effects!==undefined?n.effects.some(e=>e.visible):n.shadow||n.blur>0;
  const strokes=strokesFor(n);strokeCount+=strokes.length;if(strokeCount>VIEWPORT_CULL_LIMITS.strokes)return fail('The culling stroke-work budget was exceeded.');
  const contours=n.type==='path'?n.contours:n.type==='line'&&n.points.length?[{points:n.points,closed:false}]:undefined;
  if(contours)for(const c of contours){pointCount+=c.points.length;if(pointCount>VIEWPORT_CULL_LIMITS.points)return fail('The culling point-work budget was exceeded.');}
  if(root.uncertain)continue;
  if(n.type==='text'||n.media||n.mask||n.booleanOp||hasEffects||n.type==='path'&&!n.contours||strokes.some(s=>s.variableWidth||s.dynamic)||arrowStyle(n,'start')!=='none'||arrowStyle(n,'end')!=='none') {root.uncertain=true;continue;}
  if(![n.x,n.y,n.width,n.height,n.rotation,...r.matrix].every(Number.isFinite)||n.width<0||n.height<0){root.uncertain=true;continue;}
  let local:CullRect={x:0,y:0,width:n.width,height:n.height};
  if(contours)try{const hull=pathControlBounds(n.type==='path'?n:{...n,type:'path',contours});if(hull)local=union(local,hull);}catch{root.uncertain=true;continue;}
  // A deliberately broad miter/cap envelope: aligned SVG strokes can double authored width.
  let padding=0;for(const s of strokes)if(s.visible){const extent=2*effectiveStrokeWidth(s,n)*Math.max(1,s.miterLimit);if(!Number.isFinite(extent)||extent<0){root.uncertain=true;break;}padding=Math.max(padding,extent);}
  const box=worldBox({x:local.x-padding,y:local.y-padding,width:local.width+2*padding,height:local.height+2*padding},r.matrix);
  if(!finiteRect(box)||Math.max(Math.abs(box.x),Math.abs(box.y),Math.abs(box.x+box.width),Math.abs(box.y+box.height))>VIEWPORT_CULL_LIMITS.world){root.uncertain=true;continue;}
  // Never shrink by clips: descendants may overflow, so union their complete painted envelopes.
  root.bounds=union(root.bounds,box);
 }
 return result;
}
export interface CullCamera {zoom:number;pan:{x:number;y:number};}
export interface ViewportCullResult {nodes:DesignNode[];omittedRoots:number;omittedNodes:number;retainedUncertain:number;fallback:string;}
/** Camera units match SVG clientWidth/clientHeight, including a constant logical-screen safety margin. */
export function cullViewportRoots(nodes:DesignNode[],index:ViewportCullIndex,camera:CullCamera,size:{width:number;height:number},keepIds:readonly string[]=[],enabled=true):ViewportCullResult {
 const all=(fallback=''):ViewportCullResult=>({nodes,omittedRoots:0,omittedNodes:0,retainedUncertain:index.roots.filter(r=>r.uncertain).length,fallback});
 if(!enabled)return all('Culling is disabled for this view.');if(index.fallback)return all(index.fallback);
 if(index.source!==nodes||index.nodes!==nodes.length||![camera.zoom,camera.pan.x,camera.pan.y,size.width,size.height].every(Number.isFinite)||camera.zoom<=0||size.width<=0||size.height<=0)return all('The canvas viewport is not available.');
 const p=VIEWPORT_CULL_LIMITS.padding/camera.zoom,view={x:-camera.pan.x/camera.zoom-p,y:-camera.pan.y/camera.zoom-p,width:size.width/camera.zoom+2*p,height:size.height/camera.zoom+2*p};if(!finiteRect(view))return all('The canvas viewport is not finite.');
 const keep=new Set(keepIds.map(id=>index.rootFor.get(id)).filter((id):id is string=>id!==undefined));let omittedRoots=0;
 for(const r of index.roots){const b=r.bounds;if(keep.has(r.id)||r.uncertain||!b||b.x<=view.x+view.width&&b.x+b.width>=view.x&&b.y<=view.y+view.height&&b.y+b.height>=view.y)keep.add(r.id);else omittedRoots++;}
 if(!omittedRoots)return all();const shown=nodes.filter(n=>keep.has(index.rootFor.get(n.id)!));return {nodes:shown,omittedRoots,omittedNodes:nodes.length-shown.length,retainedUncertain:index.roots.filter(r=>r.uncertain).length,fallback:''};
}
