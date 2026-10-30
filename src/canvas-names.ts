import type {DesignNode} from './model';
import {identity,inverseMatrix,multiply,nodeMatrix,point} from './transforms';
import type {Matrix} from './transforms';
export const CANVAS_NAME_LIMITS={layers:20000,labels:500,candidates:2000,units:256,characters:80,width:240,clips:64} as const;
interface Clip {inverse:Matrix;width:number;height:number;radii:number[];parent:Clip|null;depth:number;}
interface State {matrix:Matrix;visible:boolean;locked:boolean;suppressed:boolean;clips:Clip|null;labelClips:Clip|null;}
export interface CanvasNameIndexEntry {id:string;type:'frame'|'component'|'section';name:string;title:string;x:number;top:number;locked:boolean;clips:Clip|null;nested?:boolean;}
export interface NameMetrics {width:number;left?:number;right?:number;ascent?:number;descent?:number;}
export interface CanvasName {id:string;type:CanvasNameIndexEntry['type'];text:string;title:string;x:number;y:number;locked:boolean;plate?:{x:number;y:number;width:number;height:number};}
/** Cached world transforms, visibility and mask ownership; never recursively walk a legacy hierarchy. */
export function canvasNameIndex(nodes:DesignNode[],excluded:ReadonlySet<string>=new Set()):CanvasNameIndexEntry[]{
 if(nodes.length>CANVAS_NAME_LIMITS.layers)return [];
 const byId=new Map(nodes.map(n=>[n.id,n])),state=new Map<string,State>(),masked=new Set<string>(),lastMask=new Set<string|null>();
 if(byId.size!==nodes.length)return [];
 for(const n of nodes){if(n.mask)lastMask.add(n.parentId);if(lastMask.has(n.parentId))masked.add(n.id);}
 for(const n of nodes){if(state.has(n.id))continue;const path:DesignNode[]=[],seen=new Set<string>();let current:DesignNode|undefined=n;
  while(current&&!state.has(current.id)){if(seen.has(current.id))return [];seen.add(current.id);path.push(current);current=byId.get(current.parentId??'');}
  let parent:State=current?state.get(current.id)!:{matrix:identity,visible:true,locked:false,suppressed:false,clips:null,labelClips:null};
  for(let i=path.length-1;i>=0;i--){const item=path[i],owner=byId.get(item.parentId??''),matrix=multiply(parent.matrix,nodeMatrix(item,owner));let suppressed=parent.suppressed||Boolean(item.instanceRootId)||item.type==='instance'||item.type==='slice'||Boolean(item.booleanOp)||masked.has(item.id)||excluded.has(item.id)||!matrix.every(Number.isFinite),clips=parent.clips;
   const labelClips=clips;
   if(item.clip){if(!['rectangle','frame','group','section','component'].includes(item.type)||item.width<=0||item.height<=0)suppressed=true;else try{clips={inverse:inverseMatrix(matrix),width:item.width,height:item.height,radii:(item.corners??[item.radius,item.radius,item.radius,item.radius]).map(r=>Math.max(0,Math.min(Math.min(item.width,item.height)/2,r))),parent:clips,depth:(clips?.depth??0)+1};}catch{suppressed=true;}}
   const value:State={matrix,visible:parent.visible&&item.visible&&item.opacity>0,locked:parent.locked||item.locked,suppressed,clips,labelClips};state.set(item.id,value);parent=value;
  }
 }
 const result:CanvasNameIndexEntry[]=[];
 for(const n of nodes){if(!['frame','component','section'].includes(n.type))continue;const s=state.get(n.id)!;if(!s.visible||s.suppressed||(s.labelClips?.depth??0)>CANVAS_NAME_LIMITS.clips)continue;
  const corners=[[0,0],[n.width,0],[n.width,n.height],[0,n.height]].map(([x,y])=>point(s.matrix,x,y));if(corners.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e9||Math.abs(p.y)>1e9))continue;
  const x=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y));if(Math.max(...corners.map(p=>p.x))-x<1e-6||Math.max(...corners.map(p=>p.y))-top<1e-6)continue;
  let clip=s.labelClips,contained=true;while(clip){if(!corners.every(p=>inside(clip!,p))){contained=false;break;}clip=clip.parent;}if(!contained)continue;
  const title=n.name.slice(0,CANVAS_NAME_LIMITS.units).replace(/[\u0000-\u001f\u007f-\u009f]/g,' '),chars=Array.from(title),name=chars.slice(0,CANVAS_NAME_LIMITS.characters).join('')+(n.name.length>chars.slice(0,CANVAS_NAME_LIMITS.characters).join('').length?'…':'');
  result.push({id:n.id,type:n.type as CanvasName['type'],name:name||n.type,title:title+(title.length<n.name.length?'…':''),x,top,locked:s.locked,clips:s.labelClips,nested:Boolean(n.parentId)});
 }
 return result;
}
function inside(clip:Clip,p:{x:number;y:number}){const q=point(clip.inverse,p.x,p.y),{width:w,height:h,radii:r}=clip;if(!Number.isFinite(q.x)||!Number.isFinite(q.y)||q.x<0||q.y<0||q.x>w||q.y>h)return false;for(const [x,y,radius,sx,sy] of [[r[0],r[0],r[0],-1,-1],[w-r[1],r[1],r[1],1,-1],[w-r[2],h-r[2],r[2],1,1],[r[3],h-r[3],r[3],-1,1]]){if(!radius)continue;const cornerX=(q.x-x)*sx>0,cornerY=(q.y-y)*sy>0;if(cornerX&&cornerY&&Math.hypot(q.x-x,q.y-y)>radius)return false;}return true;}
/** Screen-horizontal, measured name labels fit completely within every ordinary ancestor clip. */
export function placeCanvasNames(index:CanvasNameIndexEntry[],zoom:number,options:{frames:boolean;sections:boolean},measure:(text:string)=>NameMetrics):CanvasName[]{
 if(!Number.isFinite(zoom)||zoom<=0)return [];const result:CanvasName[]=[];let candidates=0;
 for(const n of index){if(n.type==='section'?!options.sections:!options.frames)continue;if(++candidates>CANVAS_NAME_LIMITS.candidates)break;
  const prefix=n.type==='component'?'◇  ':'▦  ';let text=prefix+n.name,m=measure(text);
  if(m.width>CANVAS_NAME_LIMITS.width){const chars=Array.from(n.name);let lo=0,hi=chars.length;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(measure(prefix+chars.slice(0,mid).join('')+'…').width<=CANVAS_NAME_LIMITS.width)lo=mid;else hi=mid-1;}text=prefix+chars.slice(0,lo).join('')+'…';m=measure(text);}
  if(![m.width,m.left??0,m.right??m.width,m.ascent??11,m.descent??3].every(Number.isFinite)||m.width<0)continue;
  const x=n.x,y=n.top-14/zoom,left=x+((m.left??0)-2)/zoom,right=x+((m.right??m.width)+2)/zoom,top=y-((m.ascent??11)+2)/zoom,bottom=y+((m.descent??3)+2)/zoom,corners=[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}];
  let clip=n.clips,allowed=true;while(clip){if(!corners.every(p=>inside(clip!,p))){allowed=false;break;}clip=clip.parent;}if(!allowed)continue;
  result.push({id:n.id,type:n.type,text,title:n.title,x,y,locked:n.locked,...(n.nested?{plate:{x:(left-x)*zoom,y:(top-y)*zoom,width:(right-left)*zoom,height:(bottom-top)*zoom}}:{})});if(result.length>=CANVAS_NAME_LIMITS.labels)break;
 }
 return result;
}
