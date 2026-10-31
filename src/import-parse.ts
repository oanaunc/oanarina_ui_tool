import type {EditableSvgImport} from './svg-import';
import type {ImportParseJob} from './import-parse-core';
import type {DesignDocument} from './model';
export const IMPORT_PARSE_LIMIT_MS=60_000;
/** Error classes decide the fixed message a person sees, so they survive the worker boundary by name. Nothing else does. */
export function importParseError(name:string,message:string){return name==='SyntaxError'?new SyntaxError(message):name==='RangeError'?new RangeError(message):new Error(message);}
/** One owned worker per job. Abort terminates it, and a late result reaches nothing. Headless callers have no worker and run the same checks inline. */
function run<T>(job:ImportParseJob,signal?:AbortSignal):Promise<T>{
 if(signal?.aborted)return Promise.reject(new DOMException('Import cancelled.','AbortError'));
 if(typeof Worker==='undefined')return import('./import-parse-core').then(core=>core.runImportParseJob(job) as T);
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./import-parse.worker.ts',import.meta.url),{type:'module'});let done=false;
  const finish=(error?:unknown,result?:T)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.onmessage=worker.onerror=worker.onmessageerror=null;worker.terminate();if(error)reject(error);else resolve(result as T);},abort=()=>finish(new DOMException('Import cancelled.','AbortError')),timer=setTimeout(()=>finish(new Error('Reading this file exceeded its 60-second work limit. Try a smaller file.')),IMPORT_PARSE_LIMIT_MS);
  signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=()=>finish(new Error('Unable to start the offline import parser'));worker.onmessageerror=()=>finish(new Error('The offline import parser returned an unreadable result'));
  worker.onmessage=(event:MessageEvent<{kind:string;result?:T;name?:string;message?:string}>)=>{const m=event.data;if(m.kind==='done')finish(undefined,m.result);else finish(importParseError(m.name??'Error',m.message??''));};
  try{worker.postMessage(job);}catch(error){finish(error);}
 });
}
export type ParsedProject={rest:true;document?:undefined}|{rest?:undefined;document:DesignDocument};
export const parseProjectInWorker=(raw:string,signal?:AbortSignal)=>run<ParsedProject>({kind:'project',raw},signal);
export const parseSvgInWorker=(raw:string,name:string,signal?:AbortSignal)=>run<EditableSvgImport>({kind:'svg',raw,name},signal);
export const validateDocumentInWorker=(document:DesignDocument,signal?:AbortSignal)=>run<DesignDocument>({kind:'validate',document},signal);
