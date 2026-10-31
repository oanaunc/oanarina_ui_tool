import {create} from 'zustand';

/** Each boot leaves a marker until it is proven healthy or leaves cleanly. Markers left behind by dead
 * renderers count as failed starts; Web Locks separate those from windows that are merely starting. */
export const STARTUP_LIMITS={failures:2,windowMs:600_000,settleMs:3000,liveMs:20_000,entries:16} as const;
const HEALTH_KEY='forma-startup-health-v1',REQUEST_KEY='forma-safe-mode-request-v1',bootLock=(id:string)=>'forma-boot:'+id;
export interface BootEntry {id:string;at:number;failed?:boolean;}
export interface SafeMode {active:boolean;reason:'requested'|'url'|'repeated-failures'|'';interrupted:number;}
export const useSafeMode=create<SafeMode>(()=>({active:false,reason:'',interrupted:0}));
export const isSafeMode=()=>useSafeMode.getState().active;
/** Safe mode's empty placeholder must not displace the file a normal restart will reopen. */
let placeholder:object|undefined;
export const setUntouchedPlaceholder=(doc:object)=>{placeholder=doc;};
export const isUntouchedPlaceholder=(doc:object)=>doc===placeholder;
export function parseBootEntries(raw:string|null):BootEntry[]{if(!raw||raw.length>8000)return [];try{const data=JSON.parse(raw);return Array.isArray(data)?data.filter(e=>e&&typeof e.id==='string'&&e.id.length<=64&&Number.isFinite(e.at)).slice(-STARTUP_LIMITS.entries):[];}catch{return [];}}
/** Pure decision. Live boots are other windows still starting; only dead, recent markers count against a start. */
export function failedBoots(entries:readonly BootEntry[],self:string,live:ReadonlySet<string>|undefined,now:number){return entries.filter(e=>e.id!==self&&now-e.at<=STARTUP_LIMITS.windowMs&&(e.failed||(live?!live.has(e.id):now-e.at>STARTUP_LIMITS.liveMs)));}
const store=()=>{try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}};
const readEntries=()=>{try{return parseBootEntries(store()?.getItem(HEALTH_KEY)??null);}catch{return [];}};
const writeEntries=(entries:BootEntry[])=>{try{store()?.setItem(HEALTH_KEY,JSON.stringify(entries.slice(-STARTUP_LIMITS.entries)));}catch{/* Without storage there is no loop detection, not a failed start. */}};
let bootId='',releaseBoot:(()=>void)|undefined,settled=false,failed=false;
/** Synchronous and first, so a renderer that dies during module evaluation or first paint is still counted. */
export function beginBoot(){if(bootId||typeof window==='undefined')return;bootId=crypto.randomUUID();writeEntries([...readEntries(),{id:bootId,at:Date.now()}]);try{void navigator.locks?.request(bootLock(bootId),()=>new Promise<void>(resolve=>{releaseBoot=resolve;})).catch(()=>{});}catch{/* Timestamps remain as the fallback. */}window.addEventListener('pagehide',()=>{if(!failed)clearBoot();});}
function clearBoot(){writeEntries(readEntries().filter(e=>e.id!==bootId));releaseBoot?.();releaseBoot=undefined;}
/** A healthy start ends the failure streak, so it also clears older markers. */
export function markBootHealthy(){if(settled||!bootId)return;settled=true;const self=readEntries().find(e=>e.id===bootId);writeEntries(readEntries().filter(e=>e.id!==bootId&&!!self&&e.at>self.at));releaseBoot?.();releaseBoot=undefined;}
/** Render failures survive the reload that follows them, unlike a clean exit. */
export function markBootFailed(){failed=true;if(!bootId)return;writeEntries([...readEntries().filter(e=>e.id!==bootId),{id:bootId,at:Date.now(),failed:true}]);}
export function requestSafeMode(){try{store()?.setItem(REQUEST_KEY,'1');}catch{/* The URL form still works in a browser. */}}
const urlRequested=()=>{try{return new URLSearchParams(location.search).get('safe-mode')==='1';}catch{return false;}};
/** Resolved once per boot before any document opens; the request is one-shot so a normal reload leaves safe mode. */
export async function resolveSafeMode():Promise<SafeMode>{
 let live:Set<string>|undefined;try{const held=(await navigator.locks?.query())?.held;if(held)live=new Set(held.map(l=>l.name??'').filter(n=>n.startsWith('forma-boot:')).map(n=>n.slice(11)));}catch{live=undefined;}
 let requested=false;try{const s=store();requested=s?.getItem(REQUEST_KEY)==='1';s?.removeItem(REQUEST_KEY);}catch{requested=false;}
 const dead=failedBoots(readEntries(),bootId,live,Date.now()),repeated=dead.length>=STARTUP_LIMITS.failures,reason=requested?'requested':urlRequested()?'url':repeated?'repeated-failures':'',mode:SafeMode={active:!!reason,reason,interrupted:dead.length};
 if(mode.active&&dead.length){const gone=new Set(dead.map(e=>e.id));writeEntries(readEntries().filter(e=>!gone.has(e.id)));}
 useSafeMode.setState(mode);return mode;
}
/** Leaves safe mode through a plain reload of the same page. */
export function restartNormally(){const url=new URL(location.href);url.searchParams.delete('safe-mode');location.replace(url.href);}
