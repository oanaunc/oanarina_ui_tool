import type {FigImportResult} from './fig-import';
import {ImportInputError} from './import-task';
export const DESIGN_JSON_WORKER_MS=30_000;
/** Design JSON conversion rebuilds and checks live structure, so it runs in an owned worker the import panel can stop. */
export function convertDesignJsonInWorker(text:string,name:string,signal:AbortSignal):Promise<FigImportResult>{
 signal.throwIfAborted();return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./design-json-import.worker.ts',import.meta.url),{type:'module'});let done=false;
  const finish=(error?:unknown,result?:FigImportResult)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);worker.onmessage=worker.onerror=worker.onmessageerror=null;worker.terminate();if(error)reject(error);else resolve(result!);},abort=()=>finish(new DOMException('Design JSON import cancelled.','AbortError')),invalid=()=>finish(new ImportInputError('Invalid design JSON structure or values. Nothing was opened.')),timer=setTimeout(()=>finish(new ImportInputError('Converting this design JSON exceeded 30 seconds. Nothing was opened.')),DESIGN_JSON_WORKER_MS);
  signal.addEventListener('abort',abort,{once:true});worker.onerror=invalid;worker.onmessageerror=invalid;
  worker.onmessage=(event:MessageEvent<{kind:string;result?:FigImportResult;error?:string}>)=>{if(event.data.kind==='done')finish(undefined,event.data.result);else if(event.data.error)finish(new ImportInputError(event.data.error));else invalid();};
  worker.postMessage({text,name});
 });
}
