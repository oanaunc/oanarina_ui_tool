import {pluginObject,pluginKeys,pluginBytes} from './local-plugin-manifest';
import type {DesignDocument} from './model';

/** A field can follow an earlier choice. A hidden field keeps its current value and still reaches the run. */
export interface PluginParameterCondition {key:string;equals:string|boolean;}
export const PLUGIN_PARAMETER_SOURCES=['pages','layers','components','styles','variables'] as const;
export type PluginParameterSource=typeof PLUGIN_PARAMETER_SOURCES[number];
export type PluginSourceOptions=Record<string,{id:string;name:string}[]>;
type Base={key:string;label:string;description?:string;showWhen?:PluginParameterCondition};
export type PluginParameter=Base&({type:'text';default:string;maxLength:number}|{type:'number';default:number;min:number;max:number}|{type:'boolean';default:boolean}|{type:'choice';default:string;options:string[]}|{type:'source';default:'';source:PluginParameterSource});
export type PluginParameterValues=Record<string,string|number|boolean>;
const text=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(v);
const singleLine=(v:unknown,max:number)=>text(v,max)&&!/[\r\n]/.test(v as string);
const choice=(v:unknown)=>singleLine(v,80)&&typeof v==='string'&&!!v&&v.trim()===v&&!/[\t]| {2}/.test(v);
function fail():never{throw Error('Plugin parameters need up to 12 unique named text, number, checkbox, choice or source fields with valid defaults and bounds.');}
/** Closed host-owned form definitions, never guest HTML or document metadata. */
export function validatePluginParameters(value:unknown):asserts value is PluginParameter[]{
 if(!Array.isArray(value)||value.length>12)fail();const keys=new Set<string>();
 for(const raw of value){const p=pluginObject(raw);if(typeof p.key!=='string'||!/^[a-z][a-zA-Z0-9_]{0,39}$/.test(p.key)||['constructor','prototype','__proto__'].includes(p.key)||keys.has(p.key)||!text(p.label,80)||!(p.label as string).trim()||p.description!==undefined&&!text(p.description,240))fail();keys.add(p.key);
  const fields=['key','label','description','showWhen','type','default'];if(p.showWhen!==undefined){const when=pluginObject(p.showWhen);pluginKeys(when,['key','equals']);if(typeof when.key!=='string'||!keys.has(when.key)||when.key===p.key||!['string','boolean'].includes(typeof when.equals)||typeof when.equals==='string'&&!text(when.equals,1000))fail();}
  if(p.type==='text'){pluginKeys(p,[...fields,'maxLength']);if(!Number.isInteger(p.maxLength)||(p.maxLength as number)<1||(p.maxLength as number)>1000||!singleLine(p.default,p.maxLength as number))fail();}
  else if(p.type==='number'){pluginKeys(p,[...fields,'min','max']);if(![p.default,p.min,p.max].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1000000)||(p.min as number)>(p.max as number)||(p.default as number)<(p.min as number)||(p.default as number)>(p.max as number))fail();}
  else if(p.type==='boolean'){pluginKeys(p,fields);if(typeof p.default!=='boolean')fail();}
  else if(p.type==='source'){pluginKeys(p,[...fields,'source']);if(p.default!==''||!PLUGIN_PARAMETER_SOURCES.includes(p.source as PluginParameterSource))fail();}
  else if(p.type==='choice'){pluginKeys(p,[...fields,'options']);if(!Array.isArray(p.options)||!p.options.length||p.options.length>20||new Set(p.options).size!==p.options.length||p.options.some(o=>!choice(o))||typeof p.default!=='string'||!p.options.includes(p.default))fail();}
  else fail();
 }
 if(pluginBytes(JSON.stringify(value))>20000)fail();
}
/** Options for source fields, read by the host when the form opens. Names stay in the trusted form: a run receives only the ID that was chosen. */
export function pluginParameterSources(doc:DesignDocument,pageId:string,definitions:readonly PluginParameter[]|undefined):PluginSourceOptions{const page=doc.pages.find(p=>p.id===pageId),row=(v:{id:string;name:string})=>({id:v.id,name:v.name.slice(0,200)}),out:PluginSourceOptions={};for(const p of definitions??[])if(p.type==='source')out[p.key]=(p.source==='pages'?doc.pages.map(row):p.source==='layers'?(page?.nodes??[]).filter(n=>!n.instanceRootId).map(row):p.source==='components'?doc.pages.flatMap(v=>v.nodes).filter(n=>n.type==='component'&&!n.instanceRootId).map(row):p.source==='styles'?(doc.styles??[]).map(row):(doc.variables??[]).map(row)).slice(0,500);return out;}
export const parameterVisible=(p:PluginParameter,values:Record<string,string|boolean|number>)=>!p.showWhen||values[p.showWhen.key]===p.showWhen.equals;
/** Mint an owned scalar snapshot. Absent input uses defaults; submitted maps must be complete. */
export function pluginParameterValues(definitions:readonly PluginParameter[]|undefined,input?:unknown,sources?:PluginSourceOptions):PluginParameterValues{
 if(definitions!==undefined)validatePluginParameters(definitions);const fields=definitions??[],values=input===undefined?undefined:pluginObject(input);if(values)pluginKeys(values,fields.map(p=>p.key));const result:PluginParameterValues={};
 for(const p of fields){const v=values===undefined?p.default:values[p.key];if(p.type==='source'?typeof v!=='string'||v!==''&&!sources?.[p.key]?.some(o=>o.id===v):p.type==='text'?!singleLine(v,p.maxLength):p.type==='number'?typeof v!=='number'||!Number.isFinite(v)||v<p.min||v>p.max:p.type==='boolean'?typeof v!=='boolean':typeof v!=='string'||!p.options.includes(v))throw Error('Choose a valid value for plugin parameter “'+p.label+'”.');result[p.key]=v as string|number|boolean;}
 return result;
}
