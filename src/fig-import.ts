import {FIG_LIMITS} from './fig-limits';
import {validateFigSceneRasters} from './fig-scene';
import type {FigImportIssue,FigImportSummary,FigSceneImport} from './fig-scene';
import type {DesignDocument} from './model';

export interface FigImportResult {source?:'rest';document:DesignDocument;issues:FigImportIssue[];complete:boolean;fontFamilies:string[];summary?:FigImportSummary;}
type Stage=(stage:'validating'|'decoding'|'converting',layers?:number)=>void;
/** One owned worker decodes and converts. Terminating it stops either stage at once, and nothing reaches the document. */
export function convertFigInWorker(bytes:Uint8Array,name:string,signal?:AbortSignal,onStage?:Stage,clipboard=false):Promise<FigSceneImport>{
 if(!(bytes instanceof Uint8Array)||bytes.length>FIG_LIMITS.inputBytes)return Promise.reject(new Error('.fig input exceeds 50 MB limit'));if(signal?.aborted)return Promise.reject(new DOMException('.fig import cancelled','AbortError'));
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./fig-import.worker.ts',import.meta.url),{type:'module'});let done=false,timer:ReturnType<typeof setTimeout>;
  const finish=(error?:unknown,result?:FigSceneImport)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.onmessage=worker.onerror=worker.onmessageerror=null;worker.terminate();if(error)reject(error);else resolve(result!);},abort=()=>finish(new DOMException('.fig import cancelled','AbortError')),limit=(ms:number,message:string)=>{clearTimeout(timer);timer=setTimeout(()=>finish(new Error(message)),ms);};
  limit(FIG_LIMITS.workerTimeoutMs,'.fig decoding exceeded its 15-second work limit. Try a smaller file.');signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=()=>finish(new Error('Unable to start the offline .fig decoder'));worker.onmessageerror=()=>finish(new Error('The offline .fig decoder returned an unreadable result'));
  worker.onmessage=(event:MessageEvent<{kind:string;layers?:number;result?:FigSceneImport;error?:string}>)=>{const m=event.data;if(m.kind==='decoded'){limit(FIG_LIMITS.sceneTimeoutMs,'.fig conversion exceeded its 60-second work limit. Try a smaller file.');onStage?.('converting');}else if(m.kind==='progress')onStage?.('converting',m.layers);else if(m.kind==='done')finish(undefined,m.result);else finish(new Error(m.error||'Unable to decode .fig file'));};
  try{const copy=new Uint8Array(bytes);worker.postMessage({bytes:copy,name,...(clipboard?{clipboard}:{})},[copy.buffer]);}catch(error){finish(error);}
 });
}
/** Selected bytes only. No network access, source paths, or document mutation. */
export async function importFigBytes(bytes:Uint8Array,name:string,signal?:AbortSignal,onStage?:Stage,clipboard=false):Promise<FigImportResult>{
 if(bytes.byteLength>=50_000_000)throw Error('Choose a Figma file smaller than 50 MB.');
 onStage?.('decoding');const result=await convertFigInWorker(bytes,name.replace(/\.fig$/i,'').slice(0,120)||'Imported Figma file',signal,onStage,clipboard);
 if(signal?.aborted)throw new DOMException('Figma import cancelled.','AbortError');
 onStage?.('decoding');await validateFigSceneRasters(result.document,signal);
 if(signal?.aborted)throw new DOMException('Figma import cancelled.','AbortError');
 onStage?.('validating');
 return result;
}
export function selectedFigBytes(base64:string):Uint8Array{
 if(!base64||base64.length>66_666_668||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))throw Error('Invalid selected Figma file data.');
 let binary:string;try{binary=atob(base64);}catch{throw Error('Invalid selected Figma file data.');}
 if(binary.length>=50_000_000)throw Error('Choose a Figma file smaller than 50 MB.');
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
let report:FigImportResult|undefined;
export function setFigImportReport(result:FigImportResult){report=result;}
export function getFigImportReport(){return report;}
export function clearFigImportReport(){report=undefined;}
