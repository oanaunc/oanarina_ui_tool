import {hasBackgroundBlur} from './background-blur';
import {hasPassThrough} from './pass-through';
import type {DesignNode} from './model';
import {identity,multiply,nodeMatrix,point} from './transforms';
import type {Matrix} from './transforms';
import {pathControlBounds} from './path-control-bounds';
import {strokesFor} from './paints';
import {effectiveStrokeWidth} from './edge-strokes';
import {arrowStyle} from './arrowheads';
import {effectPadding,effectsFor} from './effects';

export interface CullRect {x:number;y:number;width:number;height:number;}
export interface CullRoot {id:string;bounds:CullRect|null;uncertain:boolean;}
/** What one layer and everything under it can paint. An atomic layer keeps all its children: masks and Booleans need their siblings. */
export interface CullEntry {id:string;bounds:CullRect|null;uncertain:boolean;atomic:boolean;children:string[];}
export interface ViewportCullIndex {source:readonly DesignNode[];roots:CullRoot[];rootFor:Map<string,string>;entries:Map<string,CullEntry>;nodes:number;work:number;fallback:string;}
export const VIEWPORT_CULL_LIMITS={nodes:200000,depth:256,points:2000000,strokes:1000000,world:1_000_000_000,padding:128} as const;
const finiteRect=(b:CullRect)=>[b.x,b.y,b.width,b.height,b.x+b.width,b.y+b.height].every(Number.isFinite)&&b.width>=0&&b.height>=0;
function union(a:CullRect|null,b:CullRect):CullRect {if(!a)return {...b};const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return {x,y,width:Math.max(a.x+a.width,b.x+b.width)-x,height:Math.max(a.y+a.height,b.y+b.height)-y};}
function worldBox(b:CullRect,m:Matrix):CullRect {const p=[point(m,b.x,b.y),point(m,b.x+b.width,b.y),point(m,b.x+b.width,b.y+b.height),point(m,b.x,b.y+b.height)],x=Math.min(...p.map(p=>p.x)),y=Math.min(...p.map(p=>p.y));return {x,y,width:Math.max(...p.map(p=>p.x))-x,height:Math.max(...p.map(p=>p.y))-y};}
interface Resolved {matrix:Matrix;root:string;depth:number;}
/** Text can run past its box, so this is a generous guess at the lines it wraps to. Nearly every real frame holds text, so it can't count as unknown. */
function textReach(n:DesignNode):CullRect {const size=Math.max(n.fontSize,...(n.textRuns??[]).map(r=>r.fontSize??0)),wide=Math.max(1,n.width),lines=n.text.split('\n').reduce((sum,line)=>sum+1+Math.ceil(line.length*size*.75/wide),0),tall=lines*size*Math.max(1.2,n.lineHeight)*1.25;return {x:-size*2,y:-size,width:n.width+size*4,height:Math.max(n.height,tall)+size*2};}
/** One immutable-page index. Uncertain geometry is retained, never replaced by guessed clipping. */
export function indexViewportRoots(nodes:readonly DesignNode[]):ViewportCullIndex {
 const result:ViewportCullIndex={source:nodes,roots:[],rootFor:new Map(),entries:new Map(),nodes:nodes.length,work:0,fallback:''},fail=(message:string)=>({...result,fallback:message});
 if(hasBackgroundBlur(nodes))return fail('Background blur retains the complete authored backdrop scene.');
 if(hasPassThrough(nodes))return fail('Pass-through blending keeps the complete backdrop scene.');
 if(nodes.length>VIEWPORT_CULL_LIMITS.nodes)return fail('Page exceeds the 200,000-layer culling budget.');
 const byId=new Map<string,DesignNode>(),resolved=new Map<string,Resolved>(),roots=new Map<string,CullRoot>();
 for(const n of nodes){result.work++;if(!n||typeof n.id!=='string'||!n.id||byId.has(n.id))return fail('Layer identities are not supported by this culling index.');byId.set(n.id,n);result.entries.set(n.id,{id:n.id,bounds:null,uncertain:false,atomic:!!n.booleanOp||!!n.liveRepeat,children:[]});}
 // Artwork groups missing/falsy parents at the root. Malformed missing parents fall back instead of being reinterpreted.
 for(const n of nodes)if(!n.parentId){if(n.mask)return fail('Root-level sibling masks keep the complete scene.');const root={id:n.id,bounds:null,uncertain:false};roots.set(n.id,root);result.roots.push(root);}else if(!byId.has(n.parentId))return fail('A layer parent is unavailable.');else{const parent=result.entries.get(n.parentId)!;parent.children.push(n.id);if(n.mask)parent.atomic=true;}
 let pointCount=0,strokeCount=0;
 for(const start of nodes){
  if(!resolved.has(start.id)){
   const chain:DesignNode[]=[],seen=new Set<string>();let n:DesignNode|undefined=start;
   while(n&&!resolved.has(n.id)){result.work++;if(seen.has(n.id)||chain.length>=VIEWPORT_CULL_LIMITS.depth)return fail('The culling hierarchy exceeds 256 levels or contains a cycle.');seen.add(n.id);chain.push(n);n=n.parentId?byId.get(n.parentId):undefined;}
   while(chain.length){const current=chain.pop()!,parent=current.parentId?byId.get(current.parentId):undefined,base=parent?resolved.get(parent.id):undefined,depth=(base?.depth??0)+1;if(depth>VIEWPORT_CULL_LIMITS.depth)return fail('The culling hierarchy exceeds 256 levels.');const root=base?.root??current.id,matrix=multiply(base?.matrix??identity,nodeMatrix(current,parent));resolved.set(current.id,{matrix,root,depth});result.rootFor.set(current.id,root);}
  }
  const n=start,r=resolved.get(n.id)!,entry=result.entries.get(n.id)!;if(!roots.get(r.root))return fail('A root layer could not be resolved.');
  const effects=effectsFor(n).filter(e=>e.visible),strokes=strokesFor(n);strokeCount+=strokes.length;if(strokeCount>VIEWPORT_CULL_LIMITS.strokes)return fail('The culling stroke-work budget was exceeded.');
  const contours=n.type==='path'?n.contours:n.type==='line'&&n.points.length?[{points:n.points,closed:false}]:undefined;
  if(contours)for(const c of contours){pointCount+=c.points.length;if(pointCount>VIEWPORT_CULL_LIMITS.points)return fail('The culling point-work budget was exceeded.');}
  if(n.liveRepeat||n.textPath||n.media||n.mask||effects.some(e=>e.type==='shader'||e.type==='progressive-blur')||n.type==='path'&&!n.contours||strokes.some(s=>s.variableWidth||s.dynamic||s.calligraphic)||arrowStyle(n,'start')!=='none'||arrowStyle(n,'end')!=='none'){entry.uncertain=true;continue;}
  if(![n.x,n.y,n.width,n.height,n.rotation,...r.matrix].every(Number.isFinite)||n.width<0||n.height<0){entry.uncertain=true;continue;}
  let local:CullRect=n.type==='text'?textReach(n):{x:0,y:0,width:n.width,height:n.height};
  if(contours)try{const hull=pathControlBounds(n.type==='path'?n:{...n,type:'path',contours});if(hull)local=union(local,hull);}catch{entry.uncertain=true;continue;}
  // A deliberately broad miter/cap envelope: aligned SVG strokes can double authored width.
  let padding=effectPadding(effects);for(const s of strokes)if(s.visible){const extent=2*effectiveStrokeWidth(s,n)*Math.max(1,s.miterLimit);if(!Number.isFinite(extent)||extent<0){entry.uncertain=true;break;}padding+=extent;}
  if(entry.uncertain)continue;
  const box=worldBox({x:local.x-padding,y:local.y-padding,width:local.width+2*padding,height:local.height+2*padding},r.matrix);
  if(!finiteRect(box)||Math.max(Math.abs(box.x),Math.abs(box.y),Math.abs(box.x+box.width),Math.abs(box.y+box.height))>VIEWPORT_CULL_LIMITS.world){entry.uncertain=true;continue;}
  entry.bounds=box;
 }
 // Deepest first, so each layer knows its whole subtree. A clip ends both overflow and doubt, because nothing under it can paint outside.
 for(const n of [...nodes].sort((a,b)=>resolved.get(b.id)!.depth-resolved.get(a.id)!.depth)){
  const entry=result.entries.get(n.id)!,clipped=n.clip&&!entry.uncertain&&entry.bounds;if(clipped)continue;
  for(const id of entry.children){const child=result.entries.get(id)!;if(child.uncertain||!child.bounds)entry.uncertain=true;else entry.bounds=union(entry.bounds,child.bounds);}
 }
 for(const root of result.roots){const entry=result.entries.get(root.id)!;root.bounds=entry.bounds;root.uncertain=entry.uncertain;}
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
 const outside=(b:CullRect)=>b.x>view.x+view.width||b.x+b.width<view.x||b.y>view.y+view.height||b.y+b.height<view.y,kept=new Set(keepIds),path=new Set<string>(),parents=new Map<string,string>();
 for(const entry of index.entries.values())for(const child of entry.children)parents.set(child,entry.id);
 for(const id of keepIds)for(let at:string|undefined=id;at!==undefined&&!path.has(at);at=parents.get(at))path.add(at);
 const omitted=new Set<string>();let omittedRoots=0;const drop=(id:string)=>{omitted.add(id);for(const child of index.entries.get(id)!.children)drop(child);};
 const walk=(entry:CullEntry,root:boolean)=>{if(kept.has(entry.id))return;if(!path.has(entry.id)&&!entry.uncertain&&entry.bounds&&outside(entry.bounds)){drop(entry.id);if(root)omittedRoots++;return;}if(!entry.atomic)for(const child of entry.children)walk(index.entries.get(child)!,false);};
 for(const r of index.roots)walk(index.entries.get(r.id)!,true);
 if(!omitted.size)return all();const shown=nodes.filter(n=>!omitted.has(n.id));return {nodes:shown,omittedRoots,omittedNodes:nodes.length-shown.length,retainedUncertain:index.roots.filter(r=>r.uncertain).length,fallback:''};
}
