import type {DesignDocument,DesignNode} from './model';
import {detachEditedBindings} from './design-systems';
import {createPaint,createStroke,fillsFor,strokesFor} from './paints';
import {constrainAspectPatch} from './transform-controls';
import {hexColor,pageIndex} from './audit-index';
import type {AuditLayer,PageIndex} from './audit-index';
import {replaceRichText} from './rich-text';
/** Declarative batch scripts. They are JSON data interpreted here: no code is evaluated and matching uses globs, not regular expressions. */
export const BATCH_FORMAT='forma-batch-transform',BATCH_LIMITS={bytes:200_000,steps:64,ops:32,layers:20000} as const;
const numericFields=['x','y','width','height','rotation','opacity','radius','strokeWidth','fontSize','fontWeight','letterSpacing','lineHeight','gap','padding'] as const;
const booleanFields=['visible','locked'] as const;
const colorFields=['fill','stroke'] as const;
export type NumericField=typeof numericFields[number];
export type BatchOp={op:'set';field:string;value:string|number|boolean}|{op:'offset';field:NumericField;by:number}|{op:'scale';field:NumericField;by:number}|{op:'round';field:NumericField;to?:number}|{op:'rename';template:string}|{op:'replace-color';from:string;to:string}|{op:'replace-text';find:string;replace:string};
export interface BatchWhere {type?:string|string[];name?:string;text?:string;visible?:boolean;fill?:string;}
export interface BatchStep {scope?:'selection'|'page'|'document';where?:BatchWhere;do:BatchOp[];}
export interface BatchScript {format:typeof BATCH_FORMAT;version:1;name:string;steps:BatchStep[];}
const NODE_TYPES=['frame','section','slice','rectangle','ellipse','line','arrow','polygon','star','text','path','image','group','component','instance'];
const fail=(message:string):never=>{throw Error(message);};
const only=(value:object,keys:string[],what:string)=>{if(Object.keys(value).some(k=>!keys.includes(k)))fail('Unknown field in '+what+'.');};
const text=(value:unknown,what:string,max=512)=>{if(typeof value!=='string'||value.length>max)fail(what+' must be text up to '+max+' characters.');return value as string;};
const number=(value:unknown,what:string)=>{if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e6)fail(what+' must be a finite number.');return value as number;};
const color=(value:unknown,what:string)=>{if(!hexColor(value))fail(what+' must be a six-digit hex color.');return (value as string).toLowerCase();};
const numericField=(value:unknown)=>{if(!numericFields.includes(value as NumericField))fail('Choose a numeric field: '+numericFields.join(', ')+'.');return value as NumericField;};
function validateOp(op:BatchOp){
 if(!op||typeof op!=='object'||Array.isArray(op))fail('Each operation must be an object.');
 switch(op.op){
  case 'set':{only(op,['op','field','value'],'set');const field=op.field;if(numericFields.includes(field as NumericField))number(op.value,field);else if(booleanFields.includes(field as typeof booleanFields[number])){if(typeof op.value!=='boolean')fail(field+' must be true or false.');}else if(colorFields.includes(field as typeof colorFields[number]))color(op.value,field);else if(field==='name')text(op.value,'name');else fail('This field cannot be set: '+String(field).slice(0,40)+'.');break;}
  case 'offset':case 'scale':only(op,['op','field','by'],op.op);numericField(op.field);number(op.by,'by');break;
  case 'round':only(op,['op','field','to'],'round');numericField(op.field);if(op.to!==undefined&&(number(op.to,'to')<=0))fail('Round to a positive step.');break;
  case 'rename':only(op,['op','template'],'rename');if(!text(op.template,'template').trim())fail('A rename template cannot be empty.');break;
  case 'replace-color':only(op,['op','from','to'],'replace-color');color(op.from,'from');color(op.to,'to');break;
  case 'replace-text':only(op,['op','find','replace'],'replace-text');if(!text(op.find,'find',2000))fail('Enter the text to find.');text(op.replace,'replace',2000);break;
  default:fail('Unknown operation: '+String((op as {op:unknown}).op).slice(0,40)+'.');
 }
}
/** Strict structural check; every unknown key, type or out-of-range value refuses the whole script. */
export function validateBatchScript(value:unknown):BatchScript{
 const s=value as BatchScript;if(!s||typeof s!=='object'||Array.isArray(s))fail('A batch script is a JSON object.');only(s,['format','version','name','steps'],'the script');if(s.format!==BATCH_FORMAT||s.version!==1)fail('Set format to "'+BATCH_FORMAT+'" and version to 1.');text(s.name,'name',120);if(!s.name.trim())fail('Give the script a name.');if(!Array.isArray(s.steps)||!s.steps.length||s.steps.length>BATCH_LIMITS.steps)fail('A script needs 1 to '+BATCH_LIMITS.steps+' steps.');
 for(const step of s.steps){if(!step||typeof step!=='object'||Array.isArray(step))fail('Each step must be an object.');only(step,['scope','where','do'],'a step');if(step.scope!==undefined&&!['selection','page','document'].includes(step.scope))fail('Scope must be selection, page or document.');if(!Array.isArray(step.do)||!step.do.length||step.do.length>BATCH_LIMITS.ops)fail('Each step needs 1 to '+BATCH_LIMITS.ops+' operations.');step.do.forEach(validateOp);const w=step.where;if(w!==undefined){if(!w||typeof w!=='object'||Array.isArray(w))fail('where must be an object.');only(w,['type','name','text','visible','fill'],'where');if(w.type!==undefined){const types=Array.isArray(w.type)?w.type:[w.type];if(!types.length||types.some(t=>!NODE_TYPES.includes(t)))fail('Unknown layer type in where.');}if(w.name!==undefined)text(w.name,'name pattern');if(w.text!==undefined)text(w.text,'text pattern');if(w.visible!==undefined&&typeof w.visible!=='boolean')fail('where.visible must be true or false.');if(w.fill!==undefined)color(w.fill,'where.fill');}}
 return s;
}
export function parseBatchScript(raw:string){if(raw.length>BATCH_LIMITS.bytes)throw Error('Batch scripts can be up to 200 KB.');let value:unknown;try{value=JSON.parse(raw);}catch{throw Error('This script is not valid JSON.');}return validateBatchScript(value);}
/** Case-insensitive glob matched in linear time, so a hostile pattern cannot hang the editor. */
export function globMatch(pattern:string,value:string){const parts=pattern.toLocaleLowerCase().split('*'),target=value.toLocaleLowerCase();if(parts.length===1)return target===parts[0];if(!target.startsWith(parts[0]))return false;let at=parts[0].length;for(const part of parts.slice(1,-1)){const found=target.indexOf(part,at);if(found<0)return false;at=found+part.length;}const last=parts.at(-1)!;return target.length-at>=last.length&&target.endsWith(last);}
function matches(n:DesignNode,w:BatchWhere|undefined,index:PageIndex){if(!w)return true;if(w.type!==undefined&&!(Array.isArray(w.type)?w.type:[w.type]).includes(n.type))return false;if(w.name!==undefined&&!globMatch(w.name,n.name))return false;if(w.text!==undefined&&(n.type!=='text'||!globMatch(w.text,n.text)))return false;if(w.visible!==undefined&&index.visible(n)!==w.visible)return false;if(w.fill!==undefined){const p=fillsFor(n)[0];if(p?.type!=='solid'||p.color.toLowerCase()!==w.fill.toLowerCase())return false;}return true;}
const applicable=(n:DesignNode,field:string)=>['fontSize','fontWeight','letterSpacing','lineHeight'].includes(field)?n.type==='text':field==='gap'||field==='padding'?n.layout!=='none':field==='radius'?['frame','rectangle','component','image'].includes(n.type):field==='strokeWidth'?strokesFor(n).length>0:field==='stroke'||field==='fill'?n.type!=='slice'&&!n.media:field==='width'||field==='height'?n.type!=='text'||n.textResize==='fixed':true;
const fieldRanges:Partial<Record<NumericField,[number,number]>>={width:[0,1e6],height:[0,1e6],opacity:[0,1],radius:[0,1e6],strokeWidth:[0,1e6],fontSize:[.1,1e4],fontWeight:[1,1000],lineHeight:[.1,100],gap:[-1e6,1e6],padding:[0,1e6]};
const clampField=(field:NumericField,value:number)=>{const r=fieldRanges[field];return Math.round((r?Math.min(r[1],Math.max(r[0],value)):value)*1e6)/1e6;};
function renameLayer(n:DesignNode,template:string,position:number){const pad=(v:number,w:number)=>String(v).padStart(w,'0');return template.replace(/\{(name|type|width|height|n{1,4})\}/g,(_,key:string)=>key==='name'?n.name:key==='type'?n.type:key==='width'?String(Math.round(n.width)):key==='height'?String(Math.round(n.height)):pad(position,key.length)).slice(0,512);}
function opPatch(n:DesignNode,op:BatchOp,position:number):Partial<DesignNode>|undefined{
 switch(op.op){
  case 'set':{if(op.field==='name')return n.name===op.value?undefined:{name:String(op.value)};if(!applicable(n,op.field))return undefined;if(op.field==='fill'){const paints=structuredClone(fillsFor(n)),value=String(op.value);if(paints[0]?.type==='solid'&&paints[0].color.toLowerCase()===value&&paints.length===1)return undefined;if(paints[0]?.type==='solid')paints[0].color=value;else paints.unshift(createPaint(value));return {fill:value,paints};}if(op.field==='stroke'){const strokes=structuredClone(strokesFor(n)),value=String(op.value);if(strokes[0]?.paint.type==='solid'&&strokes[0].paint.color.toLowerCase()===value)return undefined;if(strokes[0])strokes[0].paint={...strokes[0].paint,type:'solid',color:value};else strokes.push({...createStroke(value),width:n.strokeWidth||1});return {stroke:value,strokes};}if(typeof op.value==='number'){const value=clampField(op.field as NumericField,op.value);return n[op.field as NumericField]===value?undefined:{[op.field]:value};}return n[op.field as 'visible']===op.value?undefined:{[op.field]:op.value};}
  case 'offset':case 'scale':case 'round':{if(!applicable(n,op.field))return undefined;const before=n[op.field] as number,value=clampField(op.field,op.op==='offset'?before+op.by:op.op==='scale'?before*op.by:Math.round(before/(op.to??1))*(op.to??1));return value===before?undefined:{[op.field]:value};}
  case 'rename':{const name=renameLayer(n,op.template,position);return name===n.name?undefined:{name};}
  case 'replace-color':{const swap=(p:ReturnType<typeof fillsFor>[number])=>{let hit=false;if(!p.visible)return false;if(p.type==='solid'&&p.color.toLowerCase()===op.from){p.color=op.to;hit=true;}else if(p.type!=='solid'&&p.type!=='image')for(const stop of p.stops??[])if(stop.color.toLowerCase()===op.from){stop.color=op.to;hit=true;}return hit;};const paints=structuredClone(fillsFor(n)),strokes=structuredClone(strokesFor(n)),fill=paints.map(swap).some(Boolean),stroke=strokes.map(s=>swap(s.paint)).some(Boolean),patch:Partial<DesignNode>={};if(fill){patch.paints=paints;if(paints[0]?.type==='solid')patch.fill=paints[0].color;}if(stroke){patch.strokes=strokes;if(strokes[0]?.paint.type==='solid')patch.stroke=strokes[0].paint.color;}return Object.keys(patch).length?patch:undefined;}
  case 'replace-text':{if(n.type!=='text'||!n.text.includes(op.find))return undefined;return replaceRichText(n,n.text.split(op.find).join(op.replace));}
 }
}
const describe=(key:string,value:unknown)=>key==='paints'||key==='strokes'||key==='textRuns'?undefined:key==='text'?String(value).slice(0,60):String(value);
export interface BatchChange {layer:AuditLayer;fields:{field:string;before:string;after:string}[];}
export interface BatchPlan {changes:BatchChange[];matched:number;skippedLocked:number;skippedManaged:number;}
/** Interprets the script over `d` in place. The preview runs on a private copy, the commit inside one editor edit. */
export function runBatchScript(d:DesignDocument,pageId:string,selection:readonly string[],script:BatchScript):BatchPlan{
 validateBatchScript(script);if(!d.pages.some(p=>p.id===pageId))throw Error('The current page no longer exists.');const changes=new Map<string,BatchChange>();let matched=0,skippedLocked=0,skippedManaged=0;const counted=new Set<string>(),chosen=new Set(selection);
 for(const step of script.steps){
  const scope=step.scope??(selection.length?'selection':'page'),pages=scope==='document'?d.pages:d.pages.filter(p=>p.id===pageId);if(scope==='selection'&&!selection.length)throw Error('Select layers, or set the step scope to page or document.');
  for(const page of pages){const index=pageIndex(page),targets=index.order.filter(n=>(scope!=='selection'||chosen.has(n.id))&&n.type!=='slice');
   const children=new Map<string,DesignNode[]>(),hit=targets.filter(n=>matches(n,step.where,index)),hitIds=new Set(hit.map(n=>n.id));for(const n of page.nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}
   const inherited=(n:DesignNode)=>{const seen=new Set<string>();let id=n.parentId;while(id&&!seen.has(id)){if(hitIds.has(id))return true;seen.add(id);id=index.byId.get(id)?.parentId??null;}return false;};
   let position=0;for(const n of hit){position++;if(!counted.has(n.id)){counted.add(n.id);matched++;if(matched>BATCH_LIMITS.layers)throw Error('A batch can change up to 20,000 layers.');if(index.locked(n))skippedLocked++;else if(index.managed(n))skippedManaged++;}if(index.locked(n)||index.managed(n))continue;
    for(const op of step.do){if(op.op==='offset'&&(op.field==='x'||op.field==='y')&&inherited(n))continue;const raw=opPatch(n,op,position);if(!raw)continue;const patch=constrainAspectPatch(n,{...raw}),before=Object.fromEntries(Object.keys(patch).map(k=>[k,n[k as keyof DesignNode]])),dx=typeof patch.x==='number'?patch.x-n.x:0,dy=typeof patch.y==='number'?patch.y-n.y:0;if((n.type==='path'||['line','arrow'].includes(n.type)&&n.points.length>1)&&(patch.width!==undefined||patch.height!==undefined)){n.pathWidth??=n.width;n.pathHeight??=n.height;}detachEditedBindings(n,patch);Object.assign(n,patch);if(dx||dy){const stack=[n.id],seen=new Set<string>();while(stack.length){const id=stack.pop()!;for(const child of children.get(id)??[])if(!seen.has(child.id)){seen.add(child.id);child.x+=dx;child.y+=dy;stack.push(child.id);}}}
     const change=changes.get(n.id)??{layer:index.layer(n),fields:[]};for(const [field,after] of Object.entries(patch)){const shown=describe(field,after);if(shown===undefined)continue;const existing=change.fields.find(f=>f.field===field);if(existing)existing.after=shown;else change.fields.push({field,before:describe(field,before[field])??'',after:shown});}changes.set(n.id,change);}
   }
  }
 }
 return {changes:[...changes.values()].filter(c=>c.fields.some(f=>f.before!==f.after)),matched,skippedLocked,skippedManaged};
}
export function previewBatchScript(doc:DesignDocument,pageId:string,selection:readonly string[],script:BatchScript){return runBatchScript(structuredClone(doc),pageId,selection,script);}
export const BATCH_SCRIPTS_KEY='forma-batch-scripts-v1',BATCH_SCRIPT_LIMIT=32;
export function readBatchScripts():BatchScript[]{try{const raw=localStorage.getItem(BATCH_SCRIPTS_KEY);if(!raw||raw.length>2_000_000)return [];const data=JSON.parse(raw);return Array.isArray(data)?data.slice(0,BATCH_SCRIPT_LIMIT).map(validateBatchScript):[];}catch{return [];}}
export function writeBatchScripts(scripts:readonly BatchScript[]){if(scripts.length>BATCH_SCRIPT_LIMIT)throw Error('You can save up to '+BATCH_SCRIPT_LIMIT+' batch scripts.');try{localStorage.setItem(BATCH_SCRIPTS_KEY,JSON.stringify(scripts));}catch{throw Error('Batch scripts could not be saved. Allow local storage or free some space.');}}
export const batchExamples:{label:string;script:BatchScript}[]=[
 {label:'Round positions to whole pixels',script:{format:BATCH_FORMAT,version:1,name:'Round positions',steps:[{scope:'page',do:[{op:'round',field:'x'},{op:'round',field:'y'}]}]}},
 {label:'Number selected frames',script:{format:BATCH_FORMAT,version:1,name:'Number frames',steps:[{scope:'selection',where:{type:'frame'},do:[{op:'rename',template:'Screen {nn}'}]}]}},
 {label:'Scale body text',script:{format:BATCH_FORMAT,version:1,name:'Scale text',steps:[{scope:'page',where:{type:'text'},do:[{op:'scale',field:'fontSize',by:1.125},{op:'round',field:'fontSize'}]}]}},
 {label:'Swap a color across the file',script:{format:BATCH_FORMAT,version:1,name:'Swap color',steps:[{scope:'document',do:[{op:'replace-color',from:'#000000',to:'#1c1b1f'}]}]}},
];
