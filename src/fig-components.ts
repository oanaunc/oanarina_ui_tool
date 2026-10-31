import type {DesignDocument,DesignNode} from './model';
import {detachInstance,overrideFields} from './components-model';
import type {ComponentProperty,ComponentSet} from './components-model';
import {bindingTypes} from './design-systems';
import type {BindingField} from './design-systems';
import {guid,list,object,optional,string} from './fig-values';
import type {Raw} from './fig-values';
/** Links gathered while emitting layers. Identities resolve afterward because a main can follow its instances. */
export interface FigOwned {node:DesignNode;owner:DesignNode;base:DesignNode;baseMain:string;key:string;}
export interface FigInstance {node:DesignNode;main:string;properties:ReadonlyMap<string,Raw>;}
export interface FigConsumer {main:string;definition:string;node:DesignNode;field:string;}
export interface FigStateGroup {raw:Raw;node:DesignNode;variants:Raw[];}
export interface FigLinks {definitions:Map<string,DesignNode>;instances:FigInstance[];owned:FigOwned[];consumers:FigConsumer[];groups:FigStateGroup[];detach:Set<string>;mains:Map<string,{raw:Raw;group?:Raw}>;}
export const newFigLinks=():FigLinks=>({definitions:new Map(),instances:[],owned:[],consumers:[],groups:[],detach:new Set(),mains:new Map()});
export const figKey=(main:string,path='')=>main+'|'+path;
const canonical=(value:unknown)=>JSON.stringify(value??null,(key,v)=>key==='id'?undefined:v);
/** Paint, stroke and action identities are per-copy, and a bound value follows its variable mode rather than an override. */
function comparable(n:DesignNode,key:string,bound:ReadonlySet<BindingField>):unknown{
 if(key==='fill'&&bound.has('fill'))return null;if(key==='paints'&&bound.has('fill')&&n.paints?.length)return n.paints.map((p,i)=>i?p:{...p,color:null});
 if(key==='stroke'&&bound.has('stroke'))return null;if(key==='strokes'&&bound.has('stroke')&&n.strokes?.length)return n.strokes.map((s,i)=>i?s:{...s,paint:{...s.paint,color:null}});
 if(Object.hasOwn(bindingTypes,key)&&bound.has(key as BindingField))return null;return (n as unknown as Record<string,unknown>)[key];
}
export function figOverrideKeys(n:DesignNode,source:DesignNode,base:DesignNode,main:DesignNode){
 const keys:string[]=[],mine=n.variableBindings??{},theirs=source.variableBindings??{},bound=new Set(Object.keys(mine).filter(k=>mine[k as BindingField]===theirs[k as BindingField]) as BindingField[]);
 for(const key of overrideFields){if(key==='propertyValues'||n===base&&(key==='x'||key==='y'))continue;if(key==='x'||key==='y'){if(Math.abs(n[key]-base[key]-(source[key]-main[key]))>1e-6)keys.push(key);continue;}if(canonical(comparable(n,key,bound))!==canonical(comparable(source,key,bound)))keys.push(key);}
 return keys;
}
const propertyField:Record<string,ComponentProperty['type']>={TEXT_DATA:'text',VISIBLE:'boolean',OVERRIDDEN_SYMBOL_ID:'instance-swap'};
const propertyValue=(value:Raw,type:ComponentProperty['type'],main:(id:string)=>string|undefined)=>{const v=optional(value.value);if(type==='text'){const text=v.textDataValue??v.textValue;return text===undefined?undefined:string(optional(text).characters);}if(type==='boolean')return typeof v.boolValue==='boolean'?v.boolValue:undefined;const symbol=v.symbolIdValue??v.guidValue;if(symbol===undefined)return;const o=object(symbol);return main(guid(o.guid??o.symbolID??o));};
/** Variant property values are authored in the component name: `Size=Large, State=Hover`. */
export function figVariantValues(name:string):Record<string,string>{const out:Record<string,string>={};for(const part of name.split(/,\s*/)){const at=part.indexOf('=');if(at<=0||!part.slice(0,at).trim())return {Variant:name};Object.defineProperty(out,part.slice(0,at).trim(),{value:part.slice(at+1).trim(),enumerable:true,writable:true,configurable:true});}return out;}
/** Properties, instance links and sets resolve together once every main has a Forma identity. */
export function linkFigComponents(doc:DesignDocument,links:FigLinks,issue:(code:string,message:string)=>void){
 const main=(id:string)=>links.definitions.get(figKey(id))?.id,mains=new Map<string,DesignNode>();for(const id of links.mains.keys()){const n=links.definitions.get(figKey(id));if(n)mains.set(id,n);}
 for(const inst of links.instances){const target=mains.get(inst.main);if(!target){inst.node.type='frame';issue('missing-component','An instance whose main component could not be imported stays as editable layers.');continue;}inst.node.type='instance';inst.node.componentId=target.id;inst.node.sourceId=target.id;}
 for(const o of links.owned){const source=links.definitions.get(o.key);if(!source||o.owner.type!=='instance')links.detach.add(o.owner.id);else{o.node.sourceId=source.id;o.node.instanceRootId=o.owner.id;}}
 // A property needs one consuming layer; further consumers stay as ordinary per-instance overrides.
 const consumers=new Map<string,Map<string,FigConsumer>>();for(const c of links.consumers){const map=consumers.get(c.main)??new Map<string,FigConsumer>();if(map.has(c.definition)){if(map.get(c.definition)!.node!==c.node)issue('property-multi-target','A component property drives several layers. The first stays a property; the others keep their current values.');}else map.set(c.definition,c);consumers.set(c.main,map);}
 const propertyIds=new Map<string,{id:string;definition:string}[]>();
 for(const [id,target] of mains){const uses=consumers.get(id);if(!uses)continue;const source=links.mains.get(id)!,defs=new Map([...list(source.group?.componentPropDefs,1000),...list(source.raw.componentPropDefs,1000)].map(object).map(d=>[guid(d.id),d])),properties:ComponentProperty[]=[],ids:{id:string;definition:string}[]=[];
  for(const [definition,use] of uses){const def=defs.get(definition),type=propertyField[use.field];if(!def||!type||type==='instance-swap'&&use.node.type!=='instance')continue;const value=propertyValue(def.varValue===undefined?{value:optional(def.initialValue)}:object(def.varValue),type,main);if(value===undefined)continue;const property=crypto.randomUUID();ids.push({id:property,definition});properties.push({id:property,name:string(def.name,'Property').slice(0,512),type,targetId:use.node.id,defaultValue:value,description:string(def.description).slice(0,4096)});}
  if(properties.length){target.componentMetadata={...target.componentMetadata,properties:properties.slice(0,1000)};propertyIds.set(id,ids);}}
 for(const inst of links.instances){const target=mains.get(inst.main);if(!target||inst.node.type!=='instance')continue;const values:Record<string,string|boolean>={};for(const {id,definition} of propertyIds.get(inst.main)??[]){const prop=target.componentMetadata!.properties!.find(p=>p.id===id),assigned=inst.properties.get(definition);if(!prop||!assigned)continue;const value=propertyValue(assigned,prop.type,main);if(value!==undefined&&value!==prop.defaultValue)values[id]=value;}if(Object.keys(values).length)inst.node.propertyValues=values;}
 for(const inst of links.instances){const target=mains.get(inst.main);if(target&&inst.node.type==='instance'&&!inst.node.instanceRootId)inst.node.overrideKeys=figOverrideKeys(inst.node,target,inst.node,target);}
 for(const o of links.owned){const source=links.definitions.get(o.key),root=links.definitions.get(figKey(o.baseMain));if(source&&root)o.node.overrideKeys=figOverrideKeys(o.node,source,o.base,root);}
 const sets:ComponentSet[]=[];for(const group of links.groups){const variants=group.variants.flatMap(raw=>{const n=mains.get(guid(raw.guid));return n?[{n,values:figVariantValues(string(raw.name))}]:[];});if(!variants.length)continue;if(sets.length>=1000){issue('variant-limit','Component sets beyond the first 1,000 stay as separate main components.');break;}const order=list(group.raw.stateGroupPropertyValueOrders,1000).map(object).map(o=>string(o.property)).filter(Boolean),names=[...new Set([...order,...variants.flatMap(v=>Object.keys(v.values))])];sets.push({id:crypto.randomUUID(),name:group.node.name,description:string(group.raw.description).slice(0,4096),containerId:group.node.id,propertyNames:names,variants:variants.map(v=>({componentId:v.n.id,values:Object.fromEntries(names.map(k=>[k,v.values[k]??'']))})),defaultComponentId:variants[0].n.id});}
 if(sets.length)doc.componentSets=sets;
}
/** Ownership is cleared last so a nested copy can be found and released in its own round. */
export function detachEveryFigInstance(doc:DesignDocument){for(let round=0;round<300;round++){const roots=doc.pages.flatMap(p=>p.nodes.filter(n=>n.type==='instance'&&!n.instanceRootId));if(!roots.length)break;for(const n of roots)detachInstance(doc,n.id);}for(const p of doc.pages)for(const n of p.nodes){if(n.type==='instance'){n.type='frame';n.componentId=null;n.propertyValues=undefined;}n.sourceId=undefined;n.instanceRootId=undefined;n.overrideKeys=undefined;n.overrideBindings=undefined;n.componentKey=undefined;}}
