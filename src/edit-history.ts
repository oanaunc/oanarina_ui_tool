import type {DesignDocument,DesignNode,Page} from './model';
import {parseDocument} from './model';

/** Bounded persisted Undo: nearest steps win, the oldest fall off first. */
export const EDIT_HISTORY_LIMITS={steps:60,bytes:12_000_000,stepBytes:6_000_000,recordBytes:16_000_000} as const;
export const editHistoryKey=(id:string)=>'edit-history-v1:'+id;
type Bag=Record<string,unknown>;
/** [start,count] reuses a run of source nodes; an object is a replaced or added node. */
type NodeRun=[number,number]|DesignNode;
interface PagePatch {id:string;set?:Bag;del?:string[];nodes?:NodeRun[];}
/** A string entry reuses the source page unchanged. */
export interface DocumentPatch {set?:Bag;del?:string[];pages:(string|PagePatch)[];}
export interface EditHistoryRecord {schema:1;documentId:string;head:string;past:string[];future:string[];}
export function contentDigest(value:string){let a=0x811c9dc5,b=0x1b873593;for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);a=Math.imul(a^c,0x01000193);b=Math.imul(b^c,0x5bd1e995);}return (a>>>0).toString(36)+'-'+(b>>>0).toString(36)+'-'+value.length.toString(36);}
export const documentDigest=(doc:DesignDocument)=>contentDigest(JSON.stringify(doc));
function fieldPatch(from:Bag,to:Bag,skip:ReadonlySet<string>){const set:Bag={},del:string[]=[];for(const key of Object.keys(to))if(!skip.has(key)&&JSON.stringify(from[key])!==JSON.stringify(to[key]))set[key]=to[key];for(const key of Object.keys(from))if(!skip.has(key)&&to[key]===undefined&&from[key]!==undefined)del.push(key);return {...(Object.keys(set).length?{set}:{}),...(del.length?{del}:{})};}
function nodeRuns(from:readonly DesignNode[],to:readonly DesignNode[]):NodeRun[]|undefined{
 const index=new Map(from.map((n,i)=>[n.id,i])),runs:NodeRun[]=[];let last:[number,number]|undefined,same=from.length===to.length;
 for(let i=0;i<to.length;i++){const n=to[i],at=index.get(n.id);if(at!==undefined&&(from[at]===n||JSON.stringify(from[at])===JSON.stringify(n))){if(at!==i)same=false;if(last&&last[0]+last[1]===at)last[1]++;else{last=[at,1];runs.push(last);}}else{same=false;runs.push(n);last=undefined;}}
 return same?undefined:runs;
}
const PAGE_SKIP=new Set(['nodes','id']),DOCUMENT_SKIP=new Set(['pages','id','format','version']);
/** Transforms `from` into `to` at page and layer granularity; reused runs keep a one-layer edit small on a 20,000-layer page. */
export function documentPatch(from:DesignDocument,to:DesignDocument):DocumentPatch{
 const pages=new Map(from.pages.map(p=>[p.id,p]));
 return {...fieldPatch(from as unknown as Bag,to as unknown as Bag,DOCUMENT_SKIP),pages:to.pages.map(page=>{const source=pages.get(page.id);if(!source)return {id:page.id,set:Object.fromEntries(Object.entries(page).filter(([k])=>k!=='id')) as Bag};const nodes=nodeRuns(source.nodes,page.nodes),fields=fieldPatch(source as unknown as Bag,page as unknown as Bag,PAGE_SKIP);return !nodes&&!fields.set&&!fields.del?page.id:{id:page.id,...fields,...(nodes?{nodes}:{})};})};
}
function applyFields(target:Bag,patch:{set?:Bag;del?:string[]}){for(const key of patch.del??[])delete target[key];if(patch.set)Object.assign(target,patch.set);}
/** Structure errors throw; document validation stays with the caller, who knows how to fall back. */
export function applyDocumentPatch(from:DesignDocument,patch:DocumentPatch):DesignDocument{
 if(!patch||!Array.isArray(patch.pages))throw Error('Invalid edit history step.');
 const pages=new Map(from.pages.map(p=>[p.id,p])),out={...from} as unknown as Bag;applyFields(out,patch);
 out.pages=patch.pages.map(entry=>{if(typeof entry==='string'){const page=pages.get(entry);if(!page)throw Error('Invalid edit history step.');return page;}if(!entry||typeof entry.id!=='string')throw Error('Invalid edit history step.');const source=pages.get(entry.id),page={...(source??{}),id:entry.id} as unknown as Bag;applyFields(page,entry);if(entry.nodes){if(!Array.isArray(entry.nodes)||!source)throw Error('Invalid edit history step.');const nodes:DesignNode[]=[];for(const run of entry.nodes){if(Array.isArray(run)){const [start,count]=run;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(count)||start<0||count<1||start+count>source.nodes.length)throw Error('Invalid edit history step.');for(let i=start;i<start+count;i++)nodes.push(source.nodes[i]);}else nodes.push(run);}page.nodes=nodes;}return page as unknown as Page;});
 return out as unknown as DesignDocument;
}
/** Patches are immutable per ordered document pair, so each is computed once however often the stack is saved. */
export class EditHistoryEncoder {
 private cache=new WeakMap<DesignDocument,WeakMap<DesignDocument,string>>();
 private encode(from:DesignDocument,to:DesignDocument){let row=this.cache.get(from);if(!row){row=new WeakMap();this.cache.set(from,row);}let value=row.get(to);if(value===undefined){value=JSON.stringify(documentPatch(from,to));row.set(to,value);}return value;}
 /** Restored stacks reuse their stored steps instead of re-encoding the whole chain on the first save. */
 seed(links:readonly HistoryLink[]){for(const {from,to,step} of links){let row=this.cache.get(from);if(!row){row=new WeakMap();this.cache.set(from,row);}row.set(to,step);}}
 /** Walks outward from the head. A step over budget ends that direction: the chain cannot skip a link. Time spent encoding uncached steps is bounded per save; later saves extend the chain. */
 record(doc:DesignDocument,past:readonly DesignDocument[],future:readonly DesignDocument[],budgetMs=Infinity):EditHistoryRecord{
  let bytes=0,count=0,spent=0,computed=0;const walk=(list:readonly DesignDocument[])=>{const out:string[]=[];let from=doc;for(const to of list){if(count>=EDIT_HISTORY_LIMITS.steps)break;const cached=this.cache.get(from)?.has(to);if(!cached&&computed>0&&spent>budgetMs)break;const started=cached?0:performance.now(),step=this.encode(from,to);if(!cached){spent+=performance.now()-started;computed++;}if(step.length>EDIT_HISTORY_LIMITS.stepBytes||bytes+step.length>EDIT_HISTORY_LIMITS.bytes)break;bytes+=step.length;count++;out.push(step);from=to;}return out;};
  const newestFirst=[...past].reverse(),pastSteps=walk(newestFirst),futureSteps=walk(future);
  return {schema:1,documentId:doc.id,head:documentDigest(doc),past:pastSteps,future:futureSteps};
 }
}
export function validateHistoryRecord(value:unknown,documentId:string):EditHistoryRecord{const r=value as EditHistoryRecord;if(!r||typeof r!=='object'||r.schema!==1||r.documentId!==documentId||typeof r.head!=='string'||r.head.length>128||!Array.isArray(r.past)||!Array.isArray(r.future)||r.past.length+r.future.length>EDIT_HISTORY_LIMITS.steps||[...r.past,...r.future].some(s=>typeof s!=='string'||s.length>EDIT_HISTORY_LIMITS.stepBytes))throw Error('Invalid edit history record.');return r;}
/** A step must be applicable and pass the complete document validators. Decoding stops at the first bad link and yields between steps. */
async function decodeChain(head:DesignDocument,steps:readonly string[],pause:()=>Promise<void>,links:HistoryLink[]){const out:DesignDocument[]=[];let from=head;for(const step of steps){try{const next=parseDocument(JSON.stringify(applyDocumentPatch(from,JSON.parse(step) as DocumentPatch)));if(next.id!==head.id)break;out.push(next);links.push({from,to:next,step});from=next;}catch{break;}await pause();}return out;}
export interface HistoryLink {from:DesignDocument;to:DesignDocument;step:string;}
export interface RestoredHistory {past:DesignDocument[];future:DesignDocument[];dropped:number;links:HistoryLink[];}
/** Never rejects: a stale, damaged or foreign record yields empty stacks and the document opens normally. */
export async function restoreHistory(value:unknown,doc:DesignDocument,pause:()=>Promise<void>=async()=>{}):Promise<RestoredHistory>{
 const empty={past:[],future:[],dropped:0,links:[]};if(value===undefined||value===null)return empty;
 try{const record=validateHistoryRecord(value,doc.id);if(record.head!==documentDigest(doc))return {...empty,dropped:record.past.length+record.future.length};const links:HistoryLink[]=[],pastSteps=await decodeChain(doc,record.past,pause,links),future=await decodeChain(doc,record.future,pause,links);return {past:pastSteps.reverse(),future,links,dropped:record.past.length+record.future.length-pastSteps.length-future.length};}catch{return empty;}
}
