import type {DesignNode} from './model';
import type {CanvasCamera} from './canvas-navigation';
import {identity,multiply,nodeMatrix,point} from './transforms';
import type {Matrix} from './transforms';

export interface OverviewRect {x:number;y:number;width:number;height:number;}
export interface OverviewBox extends OverviewRect {id:string;kind:string;}
export interface OverviewScene {bounds:OverviewRect|null;boxes:OverviewBox[];omitted:number;invalid:number;truncated:boolean;}
export const MAX_OVERVIEW_NODES=20_000,MAX_OVERVIEW_BOXES=1500,MAX_OVERVIEW_WORLD=10_000_000,MAX_CANVAS_PAN=10_000_000;
const MAX_CAMERA_CENTER=MAX_CANVAS_PAN/.05+100_000/.05/2;
const finite=(v:number)=>Number.isFinite(v);
const zoomValue=(v:number)=>finite(v)?clamp(v,.05,8):1;
const dimension=(v:number)=>finite(v)?clamp(v,1,100000):1;
const finiteRect=(r:OverviewRect|null):r is OverviewRect=>!!r&&[r.x,r.y,r.width,r.height,r.x+r.width,r.y+r.height].every(finite)&&r.width>=0&&r.height>=0&&Math.max(Math.abs(r.x),Math.abs(r.y),r.width,r.height)<=400_000_000;
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const validRect=(r:OverviewRect)=>[r.x,r.y,r.width,r.height,r.x+r.width,r.y+r.height].every(finite)&&r.width>=0&&r.height>=0&&Math.max(Math.abs(r.x),Math.abs(r.y),Math.abs(r.x+r.width),Math.abs(r.y+r.height))<=MAX_OVERVIEW_WORLD;
function union(a:OverviewRect|null,b:OverviewRect):OverviewRect {if(!a)return {...b};const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return{x,y,width:Math.max(a.x+a.width,b.x+b.width)-x,height:Math.max(a.y+a.height,b.y+b.height)-y};}
function intersect(a:OverviewRect,b:OverviewRect):OverviewRect {const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y);return{x,y,width:Math.max(0,Math.min(a.x+a.width,b.x+b.width)-x),height:Math.max(0,Math.min(a.y+a.height,b.y+b.height)-y)};}
function transformed(n:DesignNode,m:Matrix):OverviewRect {const corners=[point(m,0,0),point(m,n.width,0),point(m,n.width,n.height),point(m,0,n.height)],x=Math.min(...corners.map(p=>p.x)),y=Math.min(...corners.map(p=>p.y));return{x,y,width:Math.max(...corners.map(p=>p.x))-x,height:Math.max(...corners.map(p=>p.y))-y};}
interface Resolved {matrix:Matrix;visible:boolean;clip:OverviewRect|null;boolean:boolean;box:OverviewRect;}
/** Linear bounded parent traversal. No recursive calls, full-document scans per node or document mutation. */
export function overviewScene(nodes:readonly DesignNode[]):OverviewScene {
 const byId=new Map<string,DesignNode>(),duplicates=new Set<string>(),resolved=new Map<string,Resolved|null>();let invalid=0,omitted=Math.max(0,nodes.length-MAX_OVERVIEW_NODES),bounds:OverviewRect|null=null;const boxes:OverviewBox[]=[];
 for(let i=0;i<Math.min(nodes.length,MAX_OVERVIEW_NODES);i++){const n=nodes[i];if(!n||typeof n.id!=='string'||!n.id){invalid++;continue;}if(byId.has(n.id))duplicates.add(n.id);else byId.set(n.id,n);}
 for(const id of duplicates)resolved.set(id,null);
 const resolve=(start:DesignNode)=>{
  if(resolved.has(start.id))return resolved.get(start.id);
  const chain:DesignNode[]=[],seen=new Set<string>();let n:DesignNode|undefined=start;
  while(n&&!resolved.has(n.id)){if(seen.has(n.id)){for(const item of chain)resolved.set(item.id,null);return null;}seen.add(n.id);chain.push(n);n=byId.get(n.parentId??'');}
  while(chain.length){const item=chain.pop()!,parent=byId.get(item.parentId??''),base=parent?resolved.get(parent.id):undefined;
   const valid=[item.x,item.y,item.width,item.height,item.rotation].every(v=>typeof v==='number'&&finite(v)&&Math.abs(v)<=1_000_000)&&item.width>=0&&item.height>=0&&[item.motionScaleX,item.motionScaleY].every(v=>v===undefined||typeof v==='number'&&finite(v)&&v>=0&&v<=10000);
   if(!valid||item.parentId&&!parent||parent&&!base){resolved.set(item.id,null);continue;}
   const matrix=multiply(base?.matrix??identity,nodeMatrix(item,parent)),box=transformed(item,matrix);if(!matrix.every(finite)||!validRect(box)){resolved.set(item.id,null);continue;}
   resolved.set(item.id,{matrix,box,visible:item.visible===true&&(base?.visible??true),clip:parent?.clip?(base?.clip?intersect(base.clip,base.box):base!.box):base?.clip??null,boolean:!!parent?.booleanOp||!!base?.boolean});
  }
  return resolved.get(start.id);
 };
 for(const n of byId.values()){const r=resolve(n);if(!r){invalid++;continue;}if(!r.visible||r.boolean||n.exportGhost||n.type==='slice'||n.type==='group')continue;if(r.clip&&(r.clip.width===0||r.clip.height===0))continue;const box=r.clip?intersect(r.box,r.clip):r.box;if((box.width===0&&r.box.width>0)||(box.height===0&&r.box.height>0)||box.width===0&&box.height===0)continue;bounds=union(bounds,box);if(boxes.length<MAX_OVERVIEW_BOXES)boxes.push({...box,id:n.id,kind:n.type});else omitted++;}
 return{bounds,boxes,omitted,invalid,truncated:nodes.length>MAX_OVERVIEW_NODES};
}
export function canvasViewport(camera:CanvasCamera,width:number,height:number):OverviewRect {const zoom=zoomValue(camera.zoom);return{x:-safePan(camera.pan.x)/zoom,y:-safePan(camera.pan.y)/zoom,width:dimension(width)/zoom,height:dimension(height)/zoom};}
const safePan=(v:number)=>finite(v)?clamp(v,-MAX_CANVAS_PAN,MAX_CANVAS_PAN):0;
export function centeredCamera(camera:CanvasCamera,width:number,height:number,center:{x:number;y:number}):CanvasCamera {const zoom=zoomValue(camera.zoom),x=finite(center.x)?clamp(center.x,-MAX_CAMERA_CENTER,MAX_CAMERA_CENTER):0,y=finite(center.y)?clamp(center.y,-MAX_CAMERA_CENTER,MAX_CAMERA_CENTER):0;return{zoom,pan:{x:safePan(dimension(width)/2-x*zoom),y:safePan(dimension(height)/2-y*zoom)}};}
/** Fit schematic layout bounds in logical SVG viewport units, never in CSS-zoomed screen pixels. */
export function overviewFitCamera(bounds:OverviewRect|null,width:number,height:number):CanvasCamera {const b=bounds&&validRect(bounds)?bounds:{x:0,y:0,width:1,height:1},w=dimension(width),h=dimension(height),zoom=clamp(Math.min(Math.max(1,w-64)/Math.max(1,b.width),Math.max(1,h-64)/Math.max(1,b.height)),.05,2);return centeredCamera({zoom,pan:{x:0,y:0}},w,h,{x:b.x+b.width/2,y:b.y+b.height/2});}
/** Includes the visible page, even on an empty canvas, with room to pan past artwork. */
export function overviewExtent(scene:OverviewRect|null,view:OverviewRect):OverviewRect {const safe=finiteRect(view)?view:{x:0,y:0,width:1,height:1},padX=Math.max(1,safe.width/2),padY=Math.max(1,safe.height/2),workspace=finiteRect(scene)?{x:scene.x-padX,y:scene.y-padY,width:Math.max(1,scene.width+2*padX),height:Math.max(1,scene.height+2*padY)}:{x:-safe.width,y:-safe.height,width:Math.max(1,safe.width*3),height:Math.max(1,safe.height*3)};return union(workspace,safe);}
export function overviewProjection(extent:OverviewRect,width=200,height=128,padding=8){const b=finiteRect(extent)?extent:{x:0,y:0,width:1,height:1},w=Math.max(20,dimension(width)),h=Math.max(20,dimension(height)),pad=finite(padding)?clamp(padding,0,Math.min(w,h)/2-1):0,scale=Math.min((w-2*pad)/Math.max(1,b.width),(h-2*pad)/Math.max(1,b.height)),x=(w-b.width*scale)/2-b.x*scale,y=(h-b.height*scale)/2-b.y*scale;return{scale,x,y,project:(r:OverviewRect)=>({x:r.x*scale+x,y:r.y*scale+y,width:r.width*scale,height:r.height*scale}),world:(px:number,py:number)=>({x:(px-x)/scale,y:(py-y)/scale})};}
export function scrollbarAxis(extent:OverviewRect,view:OverviewRect,axis:'x'|'y',length:number,zoom:number){const safe=finiteRect(view)?view:{x:0,y:0,width:1,height:1},b=finiteRect(extent)?extent:safe,z=zoomValue(zoom),span=axis==='x'?'width':'height',minimum=Math.max(b[axis],-MAX_CANVAS_PAN/z),maximum=Math.max(minimum,Math.min(b[axis]+b[span]-safe[span],MAX_CANVAS_PAN/z)),value=clamp(safe[axis],minimum,maximum),track=dimension(length),size=clamp(track*safe[span]/Math.max(1,safe[span],maximum-minimum+safe[span]),Math.min(28,track),track),travel=track-size;return{minimum,maximum,value,size,offset:maximum>minimum?(value-minimum)/(maximum-minimum)*travel:0,travel,fromOffset:(offset:number)=>minimum+(maximum-minimum)*(travel?clamp((finite(offset)?offset:0)/travel,0,1):0)};}
