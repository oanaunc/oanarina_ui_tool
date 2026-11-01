import {descendants,effectiveVisible} from './model';
import type {DesignNode,Page} from './model';
import {fillsFor,strokesFor} from './paints';
import {inspectSpacing} from './spacing-inspection';
import {inverseMatrix,point,visualBounds} from './transforms';
import type {Matrix} from './transforms';
import type {LayerAnnotation} from './layer-annotations';
/** Normalized box coordinates: 0,0 is the layer's own top-left corner in any transform, 1,1 its bottom-right. */
export interface AnnotationPoint {u:number;v:number;}
export type AnnotationAxis='direct'|'horizontal'|'vertical';
export const annotationMeasurements=['width','height','diagonal','points','ink-width','ink-height'] as const;
export type AnnotationMeasurement=typeof annotationMeasurements[number];
export const annotationValueProperties=['fill','stroke','cornerRadius','fontFamily','fontWeight','lineHeight','letterSpacing','textAlign','blendMode','gap','padding','layout','prototypeTarget'] as const;
export const annotationPoints:readonly (AnnotationPoint&{name:string})[]=[{name:'Top left',u:0,v:0},{name:'Top',u:.5,v:0},{name:'Top right',u:1,v:0},{name:'Left',u:0,v:.5},{name:'Center',u:.5,v:.5},{name:'Right',u:1,v:.5},{name:'Bottom left',u:0,v:1},{name:'Bottom',u:.5,v:1},{name:'Bottom right',u:1,v:1}];
const unit=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1;
export function validAnnotationPoint(p:unknown):p is AnnotationPoint{return !!p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===2&&unit((p as AnnotationPoint).u)&&unit((p as AnnotationPoint).v);}
export function validateAnnotationMeasure(a:LayerAnnotation){
 for(const p of [a.fromPoint,a.toPoint,a.at])if(p!==undefined&&!validAnnotationPoint(p))throw Error('Annotation points must stay inside the layer box.');
 if(a.axis!==undefined&&!['direct','horizontal','vertical'].includes(a.axis))throw Error('Choose a supported measurement axis.');if(a.gap!==undefined&&a.gap!==true)throw Error('Invalid annotation edge gap.');
 const measure=a.kind==='measurement',distance=a.kind==='distance',points=measure&&a.measurement==='points';
 if(!measure&&!distance&&(a.fromPoint!==undefined||a.toPoint!==undefined||a.axis!==undefined))throw Error('Measurement fields apply only to measurement and distance annotations.');
 if(!distance&&a.gap!==undefined)throw Error('An edge gap applies only to distance annotations.');if((measure||distance)&&a.at!==undefined)throw Error('Measurements take their position from their geometry.');
 if(measure&&!points&&(a.fromPoint!==undefined||a.toPoint!==undefined||a.axis!==undefined))throw Error('Only a point-to-point measurement stores points.');
 if(points&&(a.fromPoint===undefined||a.toPoint===undefined))throw Error('A point-to-point measurement needs two points.');
 if(distance&&(a.fromPoint===undefined)!==(a.toPoint===undefined))throw Error('A point distance needs both points.');if(distance&&a.gap&&(a.fromPoint!==undefined||a.axis!==undefined))throw Error('An edge gap measures whole boxes, so it stores no points or axis.');
}
/** Keeps a staged draft valid while its measurement choice changes. */
export function normalizedMeasure(a:LayerAnnotation):LayerAnnotation{const next={...a};if(a.kind==='measurement'&&a.measurement==='points'){next.fromPoint??={u:0,v:0};next.toPoint??={u:1,v:1};}else if(a.kind==='measurement'||a.gap){delete next.fromPoint;delete next.toPoint;delete next.axis;}return next;}
const fixed=(v:number)=>String(Math.round(v*100)/100);
const axisLength=(dx:number,dy:number,axis:AnnotationAxis='direct')=>axis==='horizontal'?Math.abs(dx):axis==='vertical'?Math.abs(dy):Math.hypot(dx,dy);
const axisName=(axis:AnnotationAxis='direct')=>axis==='horizontal'?'Horizontal':axis==='vertical'?'Vertical':'Direct';
export const boxPoint=(n:DesignNode,m:Matrix,p:AnnotationPoint)=>point(m,n.width*p.u,n.height*p.v);
function inkBounds(nodes:readonly DesignNode[],id:string){const list=nodes as DesignNode[],owner=list.find(n=>n.id===id);if(!owner||!effectiveVisible(owner,list))return;const ids=new Set(descendants(list,[id])),subtree=list.filter(n=>ids.has(n.id));return visualBounds(subtree);}
export interface AnnotationSegment {x1:number;y1:number;x2:number;y2:number;}
/** World-space geometry an annotation draws on canvas; undefined when a value cannot be proven. */
export function annotationSegment(n:DesignNode,a:LayerAnnotation,page:Pick<Page,'nodes'>,matrices:ReadonlyMap<string,Matrix>):AnnotationSegment|undefined{
 const m=matrices.get(n.id);if(!m)return;const line=(from:{x:number;y:number},to:{x:number;y:number})=>[from.x,from.y,to.x,to.y].every(Number.isFinite)?{x1:from.x,y1:from.y,x2:to.x,y2:to.y}:undefined,constrain=(from:{x:number;y:number},to:{x:number;y:number},axis:AnnotationAxis='direct')=>line(from,axis==='horizontal'?{x:to.x,y:from.y}:axis==='vertical'?{x:from.x,y:to.y}:to);
 if(a.kind==='measurement'){if(a.measurement==='points')return constrain(boxPoint(n,m,a.fromPoint!),boxPoint(n,m,a.toPoint!),a.axis);if(a.measurement==='ink-width'||a.measurement==='ink-height'){const b=inkBounds(page.nodes,n.id);if(!b)return;return a.measurement==='ink-width'?line({x:b.x,y:b.y},{x:b.x+b.width,y:b.y}):line({x:b.x,y:b.y},{x:b.x,y:b.y+b.height});}return line(boxPoint(n,m,a.measurement==='height'?{u:1,v:0}:{u:0,v:0}),boxPoint(n,m,a.measurement==='width'?{u:1,v:0}:{u:1,v:1}));}
 if(a.kind!=='distance'||!a.targetId)return;const target=page.nodes.find(t=>t.id===a.targetId),tm=target&&matrices.get(target.id);if(!target||!tm)return;
 if(a.gap){try{const {selected:p,target:q}=inspectSpacing(page.nodes as DesignNode[],n.id,target.id),y=(Math.max(p.y,q.y)+Math.min(p.y+p.height,q.y+q.height))/2,x=(Math.max(p.x,q.x)+Math.min(p.x+p.width,q.x+q.width))/2;if(p.x+p.width<=q.x)return line({x:p.x+p.width,y},{x:q.x,y});if(q.x+q.width<=p.x)return line({x:q.x+q.width,y},{x:p.x,y});if(p.y+p.height<=q.y)return line({x,y:p.y+p.height},{x,y:q.y});if(q.y+q.height<=p.y)return line({x,y:q.y+q.height},{x,y:p.y});return;}catch{return;}}
 return constrain(boxPoint(n,m,a.fromPoint??{u:.5,v:.5}),boxPoint(target,tm,a.toPoint??{u:.5,v:.5}),a.axis);
}
/** Values that center-distance and box-vector annotations do not cover. */
export function extendedAnnotationValue(n:DesignNode,a:LayerAnnotation,page:Pick<Page,'nodes'>,matrices:ReadonlyMap<string,Matrix>):{value:string;available:boolean}|undefined{
 if(a.kind==='measurement'&&a.measurement==='points'){const m=matrices.get(n.id),from=a.fromPoint!,to=a.toPoint!;if(!m)return {value:'Owner geometry unavailable',available:false};const du=(to.u-from.u)*n.width,dv=(to.v-from.v)*n.height,length=axisLength(m[0]*du+m[2]*dv,m[1]*du+m[3]*dv,a.axis);return Number.isFinite(length)?{value:axisName(a.axis)+' point to point: '+fixed(length)+' px',available:true}:{value:'Measurement unavailable',available:false};}
 if(a.kind==='measurement'&&(a.measurement==='ink-width'||a.measurement==='ink-height')){let b;try{b=inkBounds(page.nodes,n.id);}catch{return {value:'Painted bounds unavailable',available:false};}if(!b)return {value:'Hidden layers have no painted bounds',available:false};return {value:(a.measurement==='ink-width'?'Painted width: '+fixed(b.width):'Painted height: '+fixed(b.height))+' px',available:true};}
 if(a.kind!=='distance'||(!a.gap&&!a.fromPoint&&!a.axis))return;const target=a.targetId?page.nodes.find(t=>t.id===a.targetId):undefined,m=matrices.get(n.id),tm=target&&matrices.get(target.id);if(!target||!m||!tm)return {value:'Distance target unavailable · choose a target again',available:false};
 if(a.gap){try{const rows=inspectSpacing(page.nodes as DesignNode[],n.id,target.id).rows,show=(row:{name:string;value:number})=>row.name+' '+fixed(row.value)+' px';return {value:'Edge '+show(rows[0]).toLowerCase()+' · '+show(rows[1]).toLowerCase(),available:true};}catch(e){return {value:(e as Error).message,available:false};}}
 const from=boxPoint(n,m,a.fromPoint??{u:.5,v:.5}),to=boxPoint(target,tm,a.toPoint??{u:.5,v:.5}),length=axisLength(to.x-from.x,to.y-from.y,a.axis);if(Math.max(Math.abs(from.x),Math.abs(from.y),Math.abs(to.x),Math.abs(to.y))*Number.EPSILON>.005)return {value:'Distance unavailable · coordinate precision is insufficient for 0.01 px',available:false};return Number.isFinite(length)?{value:axisName(a.axis)+' point to point: '+fixed(length)+' px',available:true}:{value:'Distance unavailable',available:false};
}
const paintText=(n:DesignNode)=>{const visible=fillsFor(n).filter(p=>p.visible&&p.opacity>0);if(!visible.length)return 'none';return visible.length>1?visible.length+' paints':visible[0].type==='solid'?visible[0].color+(visible[0].opacity<1?' '+Math.round(visible[0].opacity*100)+'%':''):visible[0].type;};
const strokeText=(n:DesignNode)=>{const visible=strokesFor(n).filter(s=>s.visible);if(!visible.length)return 'none';return visible.length>1?visible.length+' strokes':(visible[0].paint.type==='solid'?visible[0].paint.color:visible[0].paint.type)+' · '+fixed(visible[0].width)+' px';};
const prototypeText=(n:DesignNode,nodes:readonly DesignNode[])=>{const enabled=(n.reactions??[]).filter(r=>r.enabled);if(!enabled.length)return n.targetId?nodes.find(t=>t.id===n.targetId)?.name??'unavailable target':'none';const targetId=enabled.flatMap(r=>r.actions).find(v=>v.targetId)?.targetId,name=targetId?nodes.find(t=>t.id===targetId)?.name:undefined;return enabled.length+(enabled.length===1?' interaction':' interactions')+(name?' to '+name:'');};
/** Live values for non-numeric references, read the same way the numeric ones are: never copied into the note. */
export function textAnnotationValue(n:DesignNode,property:string,nodes:readonly DesignNode[]):{value:string;available:boolean}|undefined{
 const text=n.type==='text',typeOnly=()=>text?undefined:{value:'Property unavailable',available:false};
 switch(property){case 'fill':return {value:'fill: '+paintText(n),available:true};case 'stroke':return {value:'stroke: '+strokeText(n),available:true};case 'cornerRadius':return {value:'corner radius: '+(n.corners?n.corners.map(fixed).join(' / '):fixed(n.radius))+' px',available:true};case 'blendMode':return {value:'blend mode: '+(n.blendMode??'normal'),available:true};case 'layout':return {value:'layout: '+(n.layout==='none'?'none':n.layout),available:true};case 'gap':case 'padding':return n.layout==='none'?{value:'Layout unavailable',available:false}:{value:property+': '+fixed(n[property])+' px',available:true};case 'prototypeTarget':return {value:'prototype: '+prototypeText(n,nodes),available:true};
 case 'fontFamily':return typeOnly()??{value:'font: '+n.fontFamily,available:true};case 'fontWeight':return typeOnly()??{value:'weight: '+n.fontWeight,available:true};case 'lineHeight':return typeOnly()??{value:n.lineHeightAuto?'line height: Auto':'line height: '+fixed(n.lineHeightPx??n.lineHeight)+(n.lineHeightPx?' px':''),available:true};case 'letterSpacing':return typeOnly()??{value:'letter spacing: '+fixed(n.letterSpacing)+' px',available:true};case 'textAlign':return typeOnly()??{value:'text align: '+n.textAlign,available:true};}
}
/** Canvas point to box point. Stays inside the box and settles on corners, edge midpoints and the center within the snap radius. */
export function canvasBoxPoint(n:DesignNode,m:Matrix,world:{x:number;y:number},snapRadius:number):AnnotationPoint{
 const local=point(inverseMatrix(m),world.x,world.y),clamp=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0,raw={u:n.width>0?clamp(local.x/n.width):0,v:n.height>0?clamp(local.y/n.height):0};let best:AnnotationPoint=raw,distance=snapRadius;
 for(const p of annotationPoints){const c=boxPoint(n,m,p),d=Math.hypot(c.x-world.x,c.y-world.y);if(d<=distance){distance=d;best={u:p.u,v:p.v};}}return best;
}
