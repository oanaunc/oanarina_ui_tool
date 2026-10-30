import type {DesignDocument} from './model';
export type DeveloperResourceKind='issue'|'documentation'|'repository'|'other';
export interface DeveloperResource {id:string;kind:DeveloperResourceKind;name:string;url:string;}
export const DEVELOPER_RESOURCE_LIMITS={perLayer:32,document:4096,name:200,url:4096,id:200} as const;
export const developerResourceKinds:DeveloperResourceKind[]=['issue','documentation','repository','other'];
const controls=/[\u0000-\u001f\u007f-\u009f]/;
/** Links are data only. Nothing fetches a resource or evaluates markup. */
export function developerResourceUrl(value:unknown){
 if(typeof value!=='string'||value.length>DEVELOPER_RESOURCE_LIMITS.url||!/^https?:\/\//i.test(value)||value.trim()!==value||controls.test(value)||/\s/.test(value))throw Error('Use an absolute HTTP or HTTPS resource URL without spaces or control characters.');
 let url:URL;try{url=new URL(value);}catch{throw Error('Use an absolute HTTP or HTTPS resource URL.');}
 if(!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password)throw Error('Developer resources require HTTP or HTTPS links without embedded sign-in credentials.');return url.href;
}
export function validateDeveloperResources(value:unknown):asserts value is DeveloperResource[]|undefined{
 if(value===undefined)return;if(!Array.isArray(value)||value.length>DEVELOPER_RESOURCE_LIMITS.perLayer)throw Error('A layer supports up to 32 developer resources.');const ids=new Set<string>();
 for(const entry of value){if(!entry||typeof entry!=='object'||Array.isArray(entry)||Object.keys(entry).some(k=>!['id','kind','name','url'].includes(k)))throw Error('Invalid developer resource.');const r=entry as DeveloperResource;
  if(typeof r.id!=='string'||!r.id.trim()||r.id.length>200||controls.test(r.id)||ids.has(r.id)||!developerResourceKinds.includes(r.kind)||typeof r.name!=='string'||!r.name.trim()||r.name.length>200||controls.test(r.name))throw Error('Developer resources need unique IDs, a valid kind and a plain name up to 200 characters.');ids.add(r.id);developerResourceUrl(r.url);
 }
}
export function validateDocumentDeveloperResources(document:{pages?:unknown}){if(!Array.isArray(document.pages))return;let total=0;for(const page of document.pages)if(Array.isArray(page?.nodes))for(const n of page.nodes){validateDeveloperResources(n?.devResources);total+=n?.devResources?.length??0;if(total>DEVELOPER_RESOURCE_LIMITS.document)throw Error('A document supports up to 4,096 developer resources.');}}
export function makeDeveloperResource(input:{kind:DeveloperResourceKind;name:string;url:string},id:string=crypto.randomUUID()):DeveloperResource{const resource={id,kind:input.kind,name:input.name.trim(),url:developerResourceUrl(input.url.trim())};validateDeveloperResources([resource]);return resource;}
/** Mutate only an editor/transaction draft; the caller owns source, lock and context guards. */
export function setDeveloperResources(document:DesignDocument,pageId:string,nodeId:string,value:DeveloperResource[]|undefined){validateDeveloperResources(value);const n=document.pages.find(p=>p.id===pageId)?.nodes.find(n=>n.id===nodeId);if(!n)throw Error('The developer-resource layer is missing.');const previous=n.devResources;if(value===undefined)delete n.devResources;else n.devResources=structuredClone(value);try{validateDocumentDeveloperResources(document);}catch(error){if(previous===undefined)delete n.devResources;else n.devResources=previous;throw error;}}
