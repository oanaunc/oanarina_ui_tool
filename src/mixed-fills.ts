import type {DesignDocument,DesignNode} from './model';
import {createStroke,fillsFor,createPaint,strokesFor,validatePaint,validateStrokeStack} from './paints';
import type {Paint,StrokeStyle} from './paints';
import {linearGradientPoints} from './linear-gradient';
import {detachEditedBindings} from './design-systems';
import {entryBindingValue,splitBinding} from './design-systems';
import type {BindingField} from './design-systems';

export const MIXED_FILL_LIMITS={nodes:20000,selected:512,paints:4096,bytes:16_000_000,depth:256} as const;
export type MixedFillOperation={kind:'opacity';slot:number;value:number}|{kind:'visible';slot:number;value:boolean}|{kind:'solid';slot:number;color:string}|{kind:'remove';slot:number}|{kind:'move';slot:number;direction:-1|1}|{kind:'append';color:string}|{kind:'replace';sourceId:string}|{kind:'clear'}|{kind:'paint';slot:number;patch:Partial<Paint>}|{kind:'width';slot:number;value:number}|{kind:'align';slot:number;value:StrokeStyle['align']};
export type MixedStackRole='fill'|'stroke';
export interface MixedFillRow {slot:number;present:number;types:string[];opacity:number|null;visible:boolean|null;color:string|null;width?:number|null;align?:StrokeStyle['align']|null;}
export interface MixedFillInspection {targets:{node:DesignNode;paints:Paint[];strokes:StrokeStyle[]}[];rows:MixedFillRow[];blocked:string;uniform:boolean;}
/** Legacy factories mint unused stop IDs even on reads. Make that fallback deterministic without writing metadata. */
function readFills(n:DesignNode){const paints=fillsFor(n);return n.paints===undefined?paints.map(p=>({...p,stops:p.stops.map((s,i)=>({...s,id:'legacy-stop:'+i}))})):paints;}
/** Compare editable appearance, excluding IDs and latent parameters unused by the current paint type. */
export function fillAppearanceKey(paints:Paint[]){return JSON.stringify(paints.map(p=>{const base={type:p.type,opacity:p.opacity,visible:p.visible},stops=p.stops.map(s=>({position:s.position,color:s.color.toLowerCase(),opacity:s.opacity}));if(p.type==='shader')return {...base,shader:p.shader};if(p.type==='solid')return {...base,color:p.color.toLowerCase()};if(p.type==='linear')return {...base,points:linearGradientPoints(p),stops};if(p.type==='radial')return {...base,cx:p.cx,cy:p.cy,radius:p.radius,stops};if(p.type==='angular'||p.type==='diamond')return {...base,cx:p.cx,cy:p.cy,angle:p.angle,...(p.type==='diamond'?{radius:p.radius}:{}),stops};return {...base,image:p.image,imageWidth:p.imageWidth,imageHeight:p.imageHeight,scaleMode:p.scaleMode,scale:p.scale,offsetX:p.offsetX,offsetY:p.offsetY,angle:p.angle,adjustments:p.adjustments,surface:p.surface};}));}
/** A stroke's own visibility and geometry count as appearance, as well as its paint. */
const strokeAppearanceKey=(strokes:StrokeStyle[])=>fillAppearanceKey(strokes.map(s=>s.paint))+JSON.stringify(strokes.map(({id:_,paint:__,...rest})=>rest));
function common<T>(values:T[]):T|null{return values.every(v=>v===values[0])?values[0]:null;}
/** Inspect explicitly selected layers, never their descendants. Work is bounded before cloning any source assets. */
export function inspectMixedFills(doc:DesignDocument,pageId:string,ids:readonly string[],role:MixedStackRole='fill'):MixedFillInspection{
 const page=doc.pages.find(p=>p.id===pageId);if(!page||page.nodes.length>MIXED_FILL_LIMITS.nodes||ids.length<2||ids.length>MIXED_FILL_LIMITS.selected||new Set(ids).size!==ids.length)throw Error('Mixed fills support 2–512 selected layers on a page of up to 20,000 layers.');
 const lookup=new Map(page.nodes.map(n=>[n.id,n]));if(lookup.size!==page.nodes.length)throw Error('The fill selection has duplicate layer IDs.');
 const states=new Map<string,{locked:boolean;managed:boolean;depth:number}>();
 function state(n:DesignNode){if(states.has(n.id))return states.get(n.id)!;const trail:DesignNode[]=[],seen=new Set<string>();let at:DesignNode|undefined=n;while(at&&!states.has(at.id)){if(seen.has(at.id)||trail.length>=MIXED_FILL_LIMITS.depth)throw Error('Mixed fills require an acyclic hierarchy within 256 levels.');seen.add(at.id);trail.push(at);if(at.parentId&&!lookup.has(at.parentId))throw Error('The fill hierarchy has a missing parent.');at=at.parentId?lookup.get(at.parentId):undefined;}let prior=at?states.get(at.id)!:{locked:false,managed:false,depth:0};for(const current of trail.reverse()){const parent=current.parentId?lookup.get(current.parentId):undefined;prior={locked:prior.locked||current.locked,managed:prior.managed||!!current.instanceRootId||parent?.type==='instance',depth:prior.depth+1};if(prior.depth>MIXED_FILL_LIMITS.depth)throw Error('Mixed fills require an acyclic hierarchy within 256 levels.');states.set(current.id,prior);}return states.get(n.id)!;}
 let paints=0,bytes=0,blocked='';const targets=ids.map(id=>{const n=lookup.get(id);if(!n)throw Error('Select existing layers before editing mixed fills.');const flags=state(n);if(flags.locked)blocked='Unlock every selected layer hierarchy before editing mixed fills.';else if(flags.managed&&!blocked)blocked='Edit managed instance children on their main component, or detach them first.';else if((n.media||n.type==='slice')&&!blocked)blocked='Video posters and export slices do not use editable mixed fill stacks.';const strokes=role==='stroke'?strokesFor(n):[],stack=role==='stroke'?strokes.map(s=>s.paint):readFills(n);paints+=stack.length;if(stack.length>100||paints>MIXED_FILL_LIMITS.paints)throw Error('Mixed fills support up to 4,096 selected fills, with 100 fills per layer.');bytes+=new TextEncoder().encode(JSON.stringify(stack)).length;if(bytes>MIXED_FILL_LIMITS.bytes)throw Error('The selected fill data exceeds the 16 MB mixed-editing budget.');stack.forEach(validatePaint);return {node:n,paints:stack,strokes};});
 const rows=Array.from({length:Math.max(...targets.map(t=>t.paints.length))},(_,slot)=>{const present=targets.flatMap(t=>t.paints[slot]?[t.paints[slot]]:[]),styles=targets.flatMap(t=>t.strokes[slot]?[t.strokes[slot]]:[]);return {slot,present:present.length,types:[...new Set(present.map(p=>p.surface?.kind??p.type))],opacity:common(present.map(p=>p.opacity)),visible:common(role==='stroke'?styles.map(s=>s.visible&&s.paint.visible):present.map(p=>p.visible)),color:present.every(p=>p.type==='solid')?common(present.map(p=>p.color.toLowerCase())):null,...(styles.length?{width:common(styles.map(s=>s.width)),align:common(styles.map(s=>s.align))}:{})};});
 const key=(t:(typeof targets)[number])=>role==='stroke'?strokeAppearanceKey(t.strokes):fillAppearanceKey(t.paints),firstKey=key(targets[0]);return {targets,rows,blocked,uniform:targets.every(t=>key(t)===firstKey)};
}
/** Whether selected strokes differ, because the single stroke editor would overwrite them with the first layer's. */
export function selectedStrokesDiffer(doc:DesignDocument,pageId:string,ids:readonly string[]){if(ids.length<2)return false;try{return !inspectMixedFills(doc,pageId,ids,'stroke').uniform;}catch{return false;}}
export interface MixedFillPlan {pageId:string;changes:Map<string,Partial<DesignNode>>;}
const rgb=(v:unknown):v is string=>typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);
/** Prepare the complete atomic edit before detaching a style or mutating any layer. */
/** Fields a shared paint edit may set; identity and stops' owners stay per layer. */
const PAINT_FIELDS:readonly string[]=['type','color','opacity','angle','cx','cy','radius','linearStart','linearEnd','stops','surface','shader','image','imageWidth','imageHeight','scaleMode','scale','offsetX','offsetY','adjustments'];
export function planMixedFills(doc:DesignDocument,pageId:string,ids:readonly string[],op:MixedFillOperation,role:MixedStackRole='fill'):MixedFillPlan{
 const view=inspectMixedFills(doc,pageId,ids,role);if(view.blocked)throw Error(view.blocked);if(!op||!['opacity','visible','solid','remove','move','append','replace','clear','paint',...(role==='stroke'?['width','align']:[])].includes(op.kind))throw Error('Choose a supported mixed edit.');
 if(op.kind==='paint'&&(!op.patch||typeof op.patch!=='object'||Object.keys(op.patch).some(k=>!PAINT_FIELDS.includes(k))))throw Error('Shared paint edits change paint settings only.');if(op.kind==='width'&&!(Number.isFinite(op.value)&&op.value>=0&&op.value<=4096)||op.kind==='align'&&!['inside','center','outside'].includes(op.value))throw Error('Use a valid stroke width or position.');
 if('slot'in op&&(!Number.isInteger(op.slot)||op.slot<0||!view.rows[op.slot]))throw Error('Choose an existing fill position.');
 if(op.kind==='opacity'&&(!Number.isFinite(op.value)||op.value<0||op.value>1)||op.kind==='visible'&&typeof op.value!=='boolean'||(op.kind==='solid'||op.kind==='append')&&!rgb(op.color))throw Error('Use a valid fill color, visibility or opacity.');
 if(op.kind==='move'&&(![-1,1].includes(op.direction)||view.targets.some(t=>!t.paints[op.slot]||!t.paints[op.slot+op.direction])))throw Error('Both fill positions must exist on every selected layer before reordering.');
 const source=op.kind==='replace'?view.targets.find(t=>t.node.id===op.sourceId):undefined;if(op.kind==='replace'&&!source)throw Error('Choose a current selected layer as the fill source.');
 const changes=new Map<string,Partial<DesignNode>>();let count=0,bytes=0;
 for(const {node:n,paints:before,strokes} of view.targets){let next=structuredClone(before),styles=structuredClone(strokes);
  switch(op.kind){
   case 'opacity':if(next[op.slot])next[op.slot].opacity=op.value;break;
   case 'visible':if(next[op.slot])next[op.slot].visible=op.value;if(styles[op.slot])styles[op.slot].visible=op.value;break;
   case 'solid':if(next[op.slot]&&(next[op.slot].type!=='solid'||next[op.slot].color.toLowerCase()!==op.color.toLowerCase())){const old=next[op.slot];next[op.slot]={...createPaint(op.color.toLowerCase()),id:old.id,visible:old.visible,opacity:old.opacity};}break;
   case 'remove':next=next.filter((_,i)=>i!==op.slot);styles=styles.filter((_,i)=>i!==op.slot);break;
   case 'move':{const other=op.slot+op.direction;[next[op.slot],next[other]]=[next[other],next[op.slot]];if(role==='stroke')[styles[op.slot],styles[other]]=[styles[other],styles[op.slot]];break;}
   case 'append':{const stroke=createStroke(op.color.toLowerCase());next.unshift(role==='stroke'?stroke.paint:createPaint(op.color.toLowerCase()));if(role==='stroke')styles.unshift(stroke);break;}
   case 'replace':next=structuredClone(source!.paints);styles=structuredClone(source!.strokes);break;
   case 'clear':next=[];styles=[];break;
   case 'paint':if(next[op.slot])next[op.slot]={...next[op.slot],...structuredClone(op.patch)};break;
   case 'width':if(styles[op.slot])styles[op.slot].width=op.value;break;
   case 'align':if(styles[op.slot])styles[op.slot].align=op.value;break;
  }
  if(next.length>100)throw Error('A selected layer would exceed its 100-fill limit.');count+=next.length;bytes+=new TextEncoder().encode(JSON.stringify(next)).length;if(count>MIXED_FILL_LIMITS.paints||bytes>MIXED_FILL_LIMITS.bytes)throw Error('The changed fills exceed the 4,096-fill or 16 MB mixed-editing budget.');next.forEach(validatePaint);
  const nextStrokes=styles.map((s,i)=>({...s,paint:next[i]}));if(role==='stroke'?strokeAppearanceKey(strokes)===strokeAppearanceKey(nextStrokes):fillAppearanceKey(before)===fillAppearanceKey(next))continue;
  if(op.kind==='replace')next=next.map(p=>({...p,id:crypto.randomUUID(),stops:p.stops.map(s=>({...s,id:crypto.randomUUID()}))}));
  if(role==='stroke'){const stack=op.kind==='replace'?styles.map((s,i)=>({...s,id:crypto.randomUUID(),paint:next[i]})):nextStrokes;validateStrokeStack(stack);const color=stack[0]?.paint.color??'',width=stack[0]?.width??1;changes.set(n.id,{strokes:stack,...(color!==n.stroke?{stroke:color}:{}),...(width!==n.strokeWidth?{strokeWidth:width}:{})});continue;}
  const variableBindings=n.variableBindings?{...n.variableBindings}:undefined;if(variableBindings&&(before[0]?.id!==next[0]?.id||before[0]?.type!==next[0]?.type||before[0]?.color!==next[0]?.color))delete variableBindings.fill;if(variableBindings)for(const field of Object.keys(variableBindings) as BindingField[]){const {base,entry}=splitBinding(field);if(entry!==undefined&&entryBindingValue(n,base,entry)!==entryBindingValue({...n,paints:next},base,entry))delete variableBindings[field];}
  const patch:Partial<DesignNode>={...(variableBindings?{variableBindings}:{}),paints:next,fill:next.find(p=>p.visible)?.color??'none',gradient:false,...(n.type==='image'?{image:next.find(p=>p.type==='image')?.image??''}:{})};changes.set(n.id,patch);
 }
 return {pageId,changes};
}
export function applyMixedFillPlan(doc:DesignDocument,plan:MixedFillPlan){const lookup=new Map(doc.pages.find(p=>p.id===plan.pageId)!.nodes.map(n=>[n.id,n]));for(const [id,patch]of plan.changes){const n=lookup.get(id)!;detachEditedBindings(n,patch);Object.assign(n,structuredClone(patch));}}
export function validateMixedFillPlan(doc:DesignDocument,plan:MixedFillPlan){const lookup=new Map(doc.pages.find(p=>p.id===plan.pageId)?.nodes.map(n=>[n.id,n])??[]);for(const [id,patch]of plan.changes){const n=lookup.get(id);if(!n||Object.entries(patch).some(([key,value])=>JSON.stringify(n[key as keyof DesignNode])!==JSON.stringify(value)))throw Error('A component or workspace controller replaced this fill edit. Edit its source or detach it first.');}if(new TextEncoder().encode(JSON.stringify(doc)).length>50_000_000)throw Error('The changed project exceeds the 50 MB saved-file limit.');}
