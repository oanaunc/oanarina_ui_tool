import {strToU8,zipSync} from 'fflate';
import {EXPORT_ASSET_LIMIT,EXPORT_BYTE_LIMIT} from './export-plan';
import {exportFilename} from './frame-export-settings';
import type {ArtworkFormat} from './frame-export-settings';
/** A session-only render queue: each row is an immutable job snapshot, so one failure never touches the rest. */
export interface QueueSpec {format:ArtworkFormat;scale:number;suffix:string;}
export const queuePresets:{id:string;label:string;specs:QueueSpec[]}[]=[
 {id:'web',label:'Web: SVG, PNG @1x and @2x',specs:[{format:'svg',scale:1,suffix:''},{format:'png',scale:1,suffix:''},{format:'png',scale:2,suffix:'@2x'}]},
 {id:'ios',label:'iOS: PNG @1x, @2x and @3x',specs:[{format:'png',scale:1,suffix:''},{format:'png',scale:2,suffix:'@2x'},{format:'png',scale:3,suffix:'@3x'}]},
 {id:'android',label:'Android: mdpi to xxxhdpi PNG',specs:[{format:'png',scale:1,suffix:'-mdpi'},{format:'png',scale:1.5,suffix:'-hdpi'},{format:'png',scale:2,suffix:'-xhdpi'},{format:'png',scale:3,suffix:'-xxhdpi'},{format:'png',scale:4,suffix:'-xxxhdpi'}]},
 {id:'review',label:'Review: JPG and SVG',specs:[{format:'jpg',scale:1,suffix:''},{format:'svg',scale:1,suffix:''}]},
];
export type QueueStatus='queued'|'running'|'done'|'failed'|'cancelled';
export interface QueueJob {name:string;format:ArtworkFormat;width:number;height:number;scale:number;}
export interface QueueItem<J extends QueueJob=QueueJob> {id:string;layer:string;page:string;job:J;status:QueueStatus;bytes?:Uint8Array;error?:string;}
const key=(name:string)=>name.normalize('NFKC').toLowerCase();
/** Filenames stay unique across the whole queue, including rows already rendered. */
export function uniqueQueueName(existing:readonly {job:{name:string}}[],name:string){const used=new Set(existing.map(i=>key(i.job.name)));if(!used.has(key(name)))return name;const dot=name.lastIndexOf('.'),base=name.slice(0,dot),ext=name.slice(dot+1);let i=2,next=name;while(used.has(key(next)))next=exportFilename(base,'-'+i++,ext);return next;}
export function enqueue<J extends QueueJob>(queue:readonly QueueItem<J>[],rows:readonly {layer:string;page:string;job:J}[]):QueueItem<J>[]{if(queue.length+rows.length>EXPORT_ASSET_LIMIT)throw Error('The queue holds up to '+EXPORT_ASSET_LIMIT+' files.');const next=[...queue];for(const row of rows)next.push({id:crypto.randomUUID(),layer:row.layer,page:row.page,job:{...row.job,name:uniqueQueueName(next,row.job.name)},status:'queued'});return next;}
export interface QueueSummary {total:number;queued:number;running:number;done:number;failed:number;cancelled:number;bytes:number;}
export function queueSummary(queue:readonly QueueItem[]):QueueSummary{const s:QueueSummary={total:queue.length,queued:0,running:0,done:0,failed:0,cancelled:0,bytes:0};for(const i of queue){s[i.status]++;s.bytes+=i.bytes?.byteLength??0;}return s;}
const message=(e:unknown)=>e instanceof Error?e.message:'This file could not be rendered.';
/** Renders sequentially through the supplied renderer. `update` receives every state change; an abort stops the current and later rows. */
export async function runExportQueue<J extends QueueJob>(queue:readonly QueueItem<J>[],render:(job:J,signal:AbortSignal)=>Promise<Uint8Array>,update:(queue:QueueItem<J>[])=>void,signal:AbortSignal){
 let state=[...queue],total=state.reduce((sum,i)=>sum+(i.bytes?.byteLength??0),0);const put=(id:string,patch:Partial<QueueItem<J>>)=>{state=state.map(i=>i.id===id?{...i,...patch}:i);update(state);};
 for(const item of queue){if(item.status!=='queued')continue;if(signal.aborted){put(item.id,{status:'cancelled'});continue;}put(item.id,{status:'running',error:undefined});try{const bytes=await render(item.job,signal);if(signal.aborted)throw Error('Artwork export cancelled.');total+=bytes.byteLength;if(total>EXPORT_BYTE_LIMIT){total-=bytes.byteLength;throw Error('The queue exceeds 100 MB. Remove some files.');}put(item.id,{status:'done',bytes});}catch(e){put(item.id,signal.aborted?{status:'cancelled'}:{status:'failed',error:message(e)});}}
 return state;
}
export const retryable=<J extends QueueJob>(queue:readonly QueueItem<J>[])=>queue.map(i=>i.status==='failed'||i.status==='cancelled'?{...i,status:'queued' as const,error:undefined}:i);
/** Packs finished rows only; the manifest lists what is missing so a partial archive cannot pass for a complete one. */
export function queueArchive(queue:readonly QueueItem[],documentName:string){const done=queue.filter(i=>i.status==='done'&&i.bytes);if(!done.length)throw Error('No finished files to save.');const files:Record<string,Uint8Array>={};for(const i of done)files['assets/'+i.job.name]=i.bytes!;files['manifest.json']=strToU8(JSON.stringify({format:'forma-export-queue',version:1,documentName,files:done.map(i=>({file:'assets/'+i.job.name,layer:i.layer,page:i.page,format:i.job.format,scale:i.job.scale,width:i.job.width,height:i.job.height,bytes:i.bytes!.byteLength})),missing:queue.filter(i=>i.status!=='done').map(i=>({file:i.job.name,status:i.status,error:i.error}))},null,2));const zip=zipSync(files,{level:0});if(zip.byteLength>EXPORT_BYTE_LIMIT)throw Error('The archive exceeds 100 MB. Remove some files.');return zip;}
/** Retained across dialog closes for the session. Project artwork in this queue is never persisted. */
let session:QueueItem<any>[]=[];const listeners=new Set<()=>void>();
export const getExportQueue=()=>session;
export function setExportQueue<J extends QueueJob>(queue:QueueItem<J>[]){session=queue;for(const listener of [...listeners])listener();}
export const subscribeExportQueue=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
