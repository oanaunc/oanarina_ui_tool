import type {DesignDocument,DesignNode} from './model';
import {layerLocks} from './layer-locks';
import {bindingTypes,createStyle,styleFields} from './design-systems';
import type {BindingField,StyleKind} from './design-systems';
type AssignmentMaps=Pick<DesignNode,'variableBindings'|'variableModes'|'styleIds'>;
export interface AssignmentResult {changed:string[];skipped:string[];expected:Map<string,AssignmentMaps>;}
function targets(d:DesignDocument,pageId:string,ids:readonly string[]){const page=d.pages.find(p=>p.id===pageId);if(!page||!ids.length||ids.length>20000)throw Error('Select existing layers on this page.');const map=new Map(page.nodes.map(n=>[n.id,n]));if(ids.some(id=>!map.has(id)))throw Error('The assignment selection changed. Select the layers again.');return {page,nodes:[...new Set(ids)].map(id=>map.get(id)!),locks:layerLocks(page.nodes)};}
function setMap(n:DesignNode,key:'variableBindings'|'styleIds'|'variableModes',next:Record<string,string>){const before=n[key]??{};if(Object.keys(before).length===Object.keys(next).length&&Object.entries(next).every(([k,v])=>(before as Record<string,string>)[k]===v))return false;if(Object.keys(next).length)(n as unknown as Record<string,unknown>)[key]=next;else delete n[key];return true;}
function assignment(d:DesignDocument,pageId:string,ids:readonly string[],fn:(n:DesignNode)=>boolean,compatible=(n:DesignNode)=>!!n){const {nodes,locks}=targets(d,pageId,ids),result:AssignmentResult={changed:[],skipped:[],expected:new Map()};for(const n of nodes){if(locks.get(n.id)||!compatible(n)){result.skipped.push(n.id);continue;}if(fn(n)){result.changed.push(n.id);result.expected.set(n.id,structuredClone({variableBindings:n.variableBindings,styleIds:n.styleIds,variableModes:n.variableModes}));}}return result;}
/** Assign a local style without sharing another selected layer's unrelated maps. */
export function assignSelectedStyle(d:DesignDocument,pageId:string,ids:readonly string[],kind:StyleKind,id:string){
 if(!Object.hasOwn(styleFields,kind)||id&&!d.styles?.some(s=>s.id===id&&s.type===kind))throw Error('Choose an existing style of this type.');
 return assignment(d,pageId,ids,n=>{const styles={...n.styleIds};if(id)styles[kind]=id;else delete styles[kind];let changed=setMap(n,'styleIds',styles);if(id){const bindings={...n.variableBindings};for(const field of styleFields[kind])delete bindings[field as BindingField];changed=setMap(n,'variableBindings',bindings)||changed;}return changed;},n=>kind!=='text'||n.type==='text');
}
export function bindSelectedVariable(d:DesignDocument,pageId:string,ids:readonly string[],field:BindingField,id:string){
 if(!Object.hasOwn(bindingTypes,field))throw Error('Choose a supported variable property.');const variable=d.variables?.find(v=>v.id===id);if(id&&(!variable||variable.type!==bindingTypes[field]||variable.scopes.length&&!variable.scopes.includes(field)))throw Error('Choose a compatible scoped variable.');
 return assignment(d,pageId,ids,n=>{const bindings={...n.variableBindings};if(id)bindings[field]=id;else delete bindings[field];let changed=setMap(n,'variableBindings',bindings);if(id){const styles={...n.styleIds};for(const kind of ['paint','text','effect','stroke']as const)if(styleFields[kind].includes(field))delete styles[kind];changed=setMap(n,'styleIds',styles)||changed;}return changed;},n=>field!=='text'||n.type==='text');
}
export function setSelectedVariableMode(d:DesignDocument,pageId:string,ids:readonly string[],collectionId:string,modeId:string){
 const c=d.variableCollections?.find(c=>c.id===collectionId);if(!c||modeId&&!c.modes.some(m=>m.id===modeId))throw Error('Choose an existing collection mode.');
 return assignment(d,pageId,ids,n=>{const modes={...n.variableModes};if(modeId)modes[collectionId]=modeId;else delete modes[collectionId];return setMap(n,'variableModes',modes);});
}
export function createSelectedStyle(d:DesignDocument,pageId:string,ids:readonly string[],sourceId:string,kind:StyleKind){const {nodes,locks}=targets(d,pageId,ids),source=nodes.find(n=>n.id===sourceId);if(!source||locks.get(source.id)||kind==='text'&&source.type!=='text'||!Object.hasOwn(styleFields,kind))throw Error('Choose an unlocked source layer compatible with this style.');const id=createStyle(d,source,kind),result=assignSelectedStyle(d,pageId,ids,kind,id);return {id,...result};}

/** Derivation may refuse edits controlled by an instance; never report a discarded assignment as successful. */
export function validateDesignAssignment(d:DesignDocument,result:AssignmentResult){const nodes=new Map(d.pages.flatMap(p=>p.nodes).map(n=>[n.id,n]));for(const [id,expected]of result.expected){const n=nodes.get(id);if(!n||JSON.stringify({variableBindings:n.variableBindings,styleIds:n.styleIds,variableModes:n.variableModes})!==JSON.stringify(expected))throw Error('A component controls this assignment. Edit its source or detach it first.');}}
