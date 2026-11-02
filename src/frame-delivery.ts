import {variableWidthBounds} from './variable-width';
import type {DesignDocument,DesignNode,Page} from './model';
import {effectiveVisible,isLocked,uid} from './model';
import {managedLayer} from './layer-operations';
import type {PrototypeFlow} from './prototype';
import {effectsFor,effectPadding} from './effects';
import {effectiveStrokeWidth} from './edge-strokes';
import {strokesFor} from './paints';
import {exportSelection,identity,inverseMatrix,multiply,nodeMatrix,point,visualBounds} from './transforms';
import type {Matrix} from './transforms';
import {validateFrameExportSettings} from './frame-export-settings';
import type {FrameExportSetting} from './frame-export-settings';

function frameIn(page:Page,id:string){const frame=page.nodes.find(n=>n.id===id);if(!frame||frame.type!=='frame')throw Error('Select one existing frame.');return frame;}
function startingPointContext(doc:DesignDocument,page:Page){
 const map=new Map(page.nodes.map(n=>[n.id,n])),generated=new Set([...(doc.slides?.slides.map(s=>s.frameId)??[]),...(doc.whiteboard?.stickies.map(s=>s.frameId)??[]),...(doc.whiteboard?.tables.map(t=>t.frameId)??[])]);
 return (id:string):string|undefined=>{const frame=map.get(id);
 if(!frame||frame.type!=='frame')return 'Select one frame for a prototype starting point.';
 if(frame.width<=0||frame.height<=0)return 'Give the frame positive dimensions before using it as a starting point.';
 if(doc.workspace==='slides'||generated.has(id))return 'Use the workspace presentation controls for generated slide, sticky note or table frames.';
 let current:DesignNode|undefined=frame;const seen=new Set<string>();
 while(current){if(seen.has(current.id)||seen.size>256)return 'Use a starting frame with at most 256 ancestor levels and no cycles.';seen.add(current.id);
  if(!current.visible)return 'Make the frame and its ancestors visible before using it as a starting point.';
  if(current.instanceRootId||current.id!==id&&current.type==='instance')return 'Detach the instance before using its managed frame as a starting point.';
  if(current.id!==id&&current.type==='frame')return 'Use an outer frame as a starting point; nested frames stay inside their containing screen.';
  const parent:DesignNode|undefined=current.parentId?map.get(current.parentId):undefined;if(current.parentId&&!parent)return 'The frame ancestor is missing.';current=parent;
 }
 return undefined;
 };
}
export function frameStartingPointIssue(doc:DesignDocument,page:Page,id:string){return startingPointContext(doc,page)(id);}
export function availableStartingFrames(doc:DesignDocument,page:Page){const issue=startingPointContext(doc,page);return page.nodes.filter(n=>n.type==='frame'&&!issue(n.id));}
/** Reuse a frame's first flow when making it the default; other saved flows are preserved. */
export function planFrameStartingPoint(doc:DesignDocument,page:Page,id:string):PrototypeFlow[]{
 const issue=frameStartingPointIssue(doc,page,id);if(issue)throw Error(issue);const frame=frameIn(page,id);
 if(isLocked(frame,page.nodes))throw Error('Unlock the frame and its ancestors before changing its starting point.');
 const flows=structuredClone(page.flows??[]),index=flows.findIndex(f=>f.frameId===id);
 if(index>=0){const [flow]=flows.splice(index,1);return [flow,...flows];}
 if(flows.length>=1000)throw Error('A page supports at most 1,000 starting flows.');
 return [{id:uid(),frameId:id,name:frame.name.trim()||'Starting flow',description:''},...flows];
}
/** The page flow editor intentionally permits multiple named flows for one eligible frame. */
export function appendFrameStartingFlow(doc:DesignDocument,page:Page,id:string){
 const issue=frameStartingPointIssue(doc,page,id);if(issue)throw Error(issue);const frame=frameIn(page,id);
 if(isLocked(frame,page.nodes))throw Error('Unlock the frame and its ancestors before changing its starting point.');
 if((page.flows?.length??0)>=1000)throw Error('A page supports at most 1,000 starting flows.');
 (page.flows??=[]).push({id:uid(),frameId:id,name:'Flow '+((page.flows?.length??0)+1),description:''});
}
export function setFrameExportSettings(doc:DesignDocument,pageId:string,id:string,settings:FrameExportSetting[]){
 validateFrameExportSettings(settings);const page=doc.pages.find(p=>p.id===pageId);if(!page)throw Error('The frame page is missing.');const frame=frameIn(page,id);
 if(isLocked(frame,page.nodes))throw Error('Unlock the frame and its ancestors before editing export settings.');
 if(managedLayer(frame,page.nodes))throw Error('Detach the instance before editing its managed frame export settings.');
 frame.exportSettings=structuredClone(settings);
}
function geometry(page:Page,id:string){
 const frame=frameIn(page,id),map=new Map(page.nodes.map(n=>[n.id,n])),cache=new Map<string,Matrix>(),levels=new Map<string,number>();
 const matrix=(n:DesignNode,depth=0,seen=new Set<string>()):Matrix=>{
  const cached=cache.get(n.id);if(cached)return cached;
  if(depth>256||seen.has(n.id))throw Error('Inspect or export a frame with at most 256 ancestor levels and no cycles.');
  seen.add(n.id);const parent=n.parentId?map.get(n.parentId):undefined;if(n.parentId&&!parent)throw Error('A frame ancestor is missing.');
  const parentMatrix=parent?matrix(parent,depth+1,seen):identity,level=parent?(levels.get(parent.id)??0)+1:0;if(level>256)throw Error('Inspect or export a frame with at most 256 hierarchy levels.');
  const value=multiply(parentMatrix,nodeMatrix(n,parent));levels.set(n.id,level);
  if(value.some(v=>!Number.isFinite(v)))throw Error('This frame hierarchy has nonfinite geometry. Reduce its nested scales.');cache.set(n.id,value);return value;
 };
 const inverse=inverseMatrix(matrix(frame));return {frame,map,matrix,inverse};
}
function box(n:DesignNode,m:Matrix,padding=0){
 const band=variableWidthBounds(n),bx=band?.x??0,by=band?.y??0,w=band?.width??n.width,h=band?.height??n.height;
 const pts=[point(m,bx-padding,by-padding),point(m,bx+w+padding,by-padding),point(m,bx+w+padding,by+h+padding),point(m,bx-padding,by+h+padding)];
 if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Frame content exceeds finite inspection bounds.');
 const x=Math.min(...pts.map(p=>p.x)),y=Math.min(...pts.map(p=>p.y)),width=Math.max(...pts.map(p=>p.x))-x,height=Math.max(...pts.map(p=>p.y))-y;
 if(!Number.isFinite(width)||!Number.isFinite(height))throw Error('Frame content exceeds finite inspection bounds.');return {x,y,width,height};
}
export interface FrameOverflowEntry {id:string;name:string;left:number;top:number;right:number;bottom:number;}
/** Painted rectangles, cut down by every clip and mask between a layer and the frame, so a layer hidden by one of those is not reported. */
export function inspectFrameOverflow(page:Page,id:string){
 const {frame,map,matrix,inverse}=geometry(page,id),owned=new Set([id]);let pending=[id],depth=0;
 const children=new Map<string,DesignNode[]>();for(const n of page.nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}
 while(pending.length){if(++depth>257)throw Error('Inspect a frame with at most 256 descendant levels.');const next:string[]=[];for(const parent of pending)for(const n of children.get(parent)??[]){if(owned.has(n.id))throw Error('Cyclic frame content cannot be inspected.');owned.add(n.id);next.push(n.id);}pending=next;}
 const entries:FrameOverflowEntry[]=[];
 for(const n of page.nodes){if(n.id===id||!owned.has(n.id)||!effectiveVisible(n,page.nodes)||n.type==='slice'||n.mask)continue;
  let parent=n.parentId?map.get(n.parentId):undefined,boolean=false;while(parent&&parent.id!==id){if(parent.booleanOp){boolean=true;break;}parent=parent.parentId?map.get(parent.parentId):undefined;}if(boolean)continue;
  const stroke=Math.max(0,...strokesFor(n).filter(s=>s.visible&&s.paint.visible).map(s=>s.align==='inside'?0:effectiveStrokeWidth(s,n)*(s.align==='center'?.5:1))),padding=stroke+effectPadding(effectsFor(n)),b=box(n,multiply(inverse,matrix(n)),padding);let x0=b.x,y0=b.y,x1=b.x+b.width,y1=b.y+b.height;
  const crop=(a:DesignNode)=>{const c=box(a,multiply(inverse,matrix(a)));x0=Math.max(x0,c.x);y0=Math.max(y0,c.y);x1=Math.min(x1,c.x+c.width);y1=Math.min(y1,c.y+c.height);};
  for(let at:DesignNode|undefined=n;at&&at.id!==id;at=at.parentId?map.get(at.parentId):undefined){if(at!==n&&at.clip)crop(at);const siblings=children.get(at.parentId??'')??[],source=siblings.slice(0,siblings.indexOf(at)).reverse().find(v=>v.mask);if(source)crop(source);}
  if(x1<=x0||y1<=y0)continue;const values={left:Math.max(0,-x0),top:Math.max(0,-y0),right:Math.max(0,x1-frame.width),bottom:Math.max(0,y1-frame.height)};
  if(Object.values(values).some(v=>v>1e-6))entries.push({id:n.id,name:n.name,...values});
 }
 const selected=exportSelection(page.nodes,[id]);const nodes=selected.map(n=>n.id===id?{...n,clip:false}:n),b=visualBounds(nodes);
 if(![b.x,b.y,b.width,b.height].every(Number.isFinite))throw Error('Frame content exceeds finite preview bounds.');
 const pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(([x,y])=>point(inverse,x,y));
 if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Frame content exceeds finite preview bounds.');
 const x=Math.min(0,...pts.map(p=>p.x)),y=Math.min(0,...pts.map(p=>p.y)),width=Math.max(frame.width,...pts.map(p=>p.x))-x,height=Math.max(frame.height,...pts.map(p=>p.y))-y;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Frame content exceeds finite preview bounds.');
 return {entries,nodes,transform:inverse,viewport:{x,y,width,height},frame};
}
/** Selected exports retain their required mask/clip ancestors; a wrapper removes the frame's world transform. */
export function frameExportGeometry(page:Page,id:string,bounds:'frame'|'artwork'){
 const {frame,matrix,inverse}=geometry(page,id);if(frame.width<=0||frame.height<=0)throw Error('Use positive frame dimensions before exporting.');if(!effectiveVisible(frame,page.nodes))throw Error('Make the frame and its ancestors visible before exporting.');
 const nodes=exportSelection(page.nodes,[id]);
 for(const n of nodes)if(effectiveVisible(n,page.nodes))box(n,matrix(n));
 if(bounds==='frame')return {nodes,viewport:{x:0,y:0,width:frame.width,height:frame.height},transform:inverse};
 const viewport=visualBounds(nodes);if(![viewport.x,viewport.y,viewport.width,viewport.height].every(Number.isFinite))throw Error('The frame export has nonfinite bounds.');return {nodes,viewport,transform:undefined};
}
