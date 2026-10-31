import {pluginObject,pluginKeys,pluginBytes} from './local-plugin-manifest';

type Base={key:string;label:string;description?:string};
export type PluginParameter=Base&({type:'text';default:string;maxLength:number}|{type:'number';default:number;min:number;max:number}|{type:'boolean';default:boolean}|{type:'choice';default:string;options:string[]});
export type PluginParameterValues=Record<string,string|number|boolean>;
const text=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(v);
const singleLine=(v:unknown,max:number)=>text(v,max)&&!/[\r\n]/.test(v as string);
const choice=(v:unknown)=>singleLine(v,80)&&typeof v==='string'&&!!v&&v.trim()===v&&!/[\t]| {2}/.test(v);
function fail():never{throw Error('Plugin parameters need up to 12 unique named text, number, checkbox or choice fields with valid defaults and bounds.');}
/** Closed host-owned form definitions, never guest HTML or document metadata. */
export function validatePluginParameters(value:unknown):asserts value is PluginParameter[]{
 if(!Array.isArray(value)||value.length>12)fail();const keys=new Set<string>();
 for(const raw of value){const p=pluginObject(raw);if(typeof p.key!=='string'||!/^[a-z][a-zA-Z0-9_]{0,39}$/.test(p.key)||['constructor','prototype','__proto__'].includes(p.key)||keys.has(p.key)||!text(p.label,80)||!(p.label as string).trim()||p.description!==undefined&&!text(p.description,240))fail();keys.add(p.key);
  const fields=['key','label','description','type','default'];
  if(p.type==='text'){pluginKeys(p,[...fields,'maxLength']);if(!Number.isInteger(p.maxLength)||(p.maxLength as number)<1||(p.maxLength as number)>1000||!singleLine(p.default,p.maxLength as number))fail();}
  else if(p.type==='number'){pluginKeys(p,[...fields,'min','max']);if(![p.default,p.min,p.max].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1000000)||(p.min as number)>(p.max as number)||(p.default as number)<(p.min as number)||(p.default as number)>(p.max as number))fail();}
  else if(p.type==='boolean'){pluginKeys(p,fields);if(typeof p.default!=='boolean')fail();}
  else if(p.type==='choice'){pluginKeys(p,[...fields,'options']);if(!Array.isArray(p.options)||!p.options.length||p.options.length>20||new Set(p.options).size!==p.options.length||p.options.some(o=>!choice(o))||typeof p.default!=='string'||!p.options.includes(p.default))fail();}
  else fail();
 }
 if(pluginBytes(JSON.stringify(value))>20000)fail();
}
/** Mint an owned scalar snapshot. Absent input uses defaults; submitted maps must be complete. */
export function pluginParameterValues(definitions:readonly PluginParameter[]|undefined,input?:unknown):PluginParameterValues{
 if(definitions!==undefined)validatePluginParameters(definitions);const fields=definitions??[],values=input===undefined?undefined:pluginObject(input);if(values)pluginKeys(values,fields.map(p=>p.key));const result:PluginParameterValues={};
 for(const p of fields){const v=values===undefined?p.default:values[p.key];if(p.type==='text'?!singleLine(v,p.maxLength):p.type==='number'?typeof v!=='number'||!Number.isFinite(v)||v<p.min||v>p.max:p.type==='boolean'?typeof v!=='boolean':typeof v!=='string'||!p.options.includes(v))throw Error('Choose a valid value for plugin parameter “'+p.label+'”.');result[p.key]=v as string|number|boolean;}
 return result;
}
