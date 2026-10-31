import {trustedImportDiagnostic} from './trusted-import-diagnostics';
/** Ephemeral import delivery state. Never serialized into a project or exported. */
export type ImportFormat='project'|'fig'|'rest'|'pdf'|'sketch'|'audio'|'raster'|'svg';
export type ImportStage='reading'|'validating'|'decoding'|'converting'|'retaining'|'opening';
export interface ImportTaskState {id:number;format:ImportFormat;stage:ImportStage;status:'active'|'cancelled'|'failed';file:number;files:number;bytes:number;totalBytes:number;layers?:number;reason?:string;}
const labels:Record<ImportStage,string>={reading:'Reading selected bytes',validating:'Validating file structure',decoding:'Decoding embedded artwork',converting:'Converting layers and components',retaining:'Keeping the current project',opening:'Preparing the imported project'};
export const importStageLabel=(stage:ImportStage)=>labels[stage];
let serial=0,state:ImportTaskState|undefined,active:AbortController|undefined;
const listeners=new Set<()=>void>();
const emit=()=>{for(const l of listeners)l();};
export const subscribeImportTask=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const getImportTask=()=>state;
export function dismissImportTask(expectedId?:number){if(expectedId!==undefined&&state?.id!==expectedId)return;if(state?.status!=='active'){state=undefined;emit();}}
export function cancelImportTask(expectedId?:number){if(expectedId!==undefined&&state?.id!==expectedId)return;if(state?.status!=='active')return;active?.abort();state={...state,status:'cancelled',reason:'Import cancelled. Nothing was added or opened.'};emit();}
export class ImportInputError extends Error {}
export function importFailureReason(error:unknown,stage:ImportStage){
 if(error instanceof ImportInputError)return error.message;
 if(error instanceof SyntaxError)return 'The selected project is not valid JSON. Export a new .oui copy from the original app.';
 if(error instanceof RangeError)return 'The selected file exceeds the supported complexity or memory limits.';
 const message=error instanceof Error?error.message:'';
 const fixed=trustedImportDiagnostic(message);if(fixed)return fixed;
 // Only fixed schema diagnostics are admitted. Never display parser excerpts, user names, URLs or raw bytes.
 if(/^Invalid (?:page\.|or duplicate layer\.|document identity or timestamp\.|canvas background\.|layer flag\.|layer settings\.|text property\.|layer property: (?:x|y|width|height|rotation|opacity|fontSize|strokeWidth|radius|gap|padding|columns|lineHeight|letterSpacing|blur))$/.test(message))return message+' The source project was left unchanged.';
 if(/Figma.*(?:geometry|numeric|dimensions|size)|(?:geometry|numeric|dimensions).*Figma/i.test(message))return 'Invalid Figma geometry or numeric values. Export a new Design file from the original app.';
 if(/ZIP|\.fig.*(?:container|archive|compression)|(?:container|archive).*\.fig/i.test(message))return 'The .fig container is invalid, truncated, or uses unsupported compression. Export a new Design file from Figma.';
 if(message.startsWith('Choose an Oanarina .oui file'))return 'Choose a Forma project with supported .oui version 1 or 2. Use File → Open for a supported binary .fig Design file.';
 if(message==='Layer values out of range.')return 'A layer contains geometry or opacity outside the supported range.';
 if(stage==='reading')return 'The selected file could not be read completely. Select the file again from local storage.';
 if(stage==='decoding'||stage==='converting')return 'The selected artwork could not be decoded, or exceeded the supported image limits.';
 if(stage==='retaining')return 'Your current project could not be retained in local recovery. Save a .oui backup before trying again.';
 if(stage==='opening')return 'The imported project could not be prepared safely. Your current project is unchanged.';
 return 'The file is damaged, unsupported, or exceeds an import limit. Try a new export from the original app.';
}
export function beginImportTask(format:ImportFormat,files:number,totalBytes:number){
 active?.abort();const controller=new AbortController(),id=++serial;active=controller;
 state={id,format,files,file:1,totalBytes,bytes:0,stage:'reading',status:'active'};emit();
 const check=()=>{controller.signal.throwIfAborted();if(active!==controller||state?.id!==id)throw new DOMException('Import superseded.','AbortError');};
 const update=(patch:Partial<Pick<ImportTaskState,'stage'|'bytes'|'file'|'files'|'format'|'layers'>>)=>{check();state={...state!,...patch};emit();};
 return {signal:controller.signal,abort:()=>controller.abort(),check,update,
  async checkpoint(stage:ImportStage){update({stage});await new Promise<void>(r=>setTimeout(r,0));check();},
  finish(){check();active=undefined;state=undefined;emit();},
  fail(error:unknown){if(active!==controller||state?.id!==id)return;const reason=importFailureReason(error,state.stage);if(controller.signal.aborted){state={...state,status:'cancelled',reason:'Import cancelled. Nothing was added or opened.'};}else state={...state,status:'failed',reason};active=undefined;emit();return reason;}
 };
}
export type ImportTask=ReturnType<typeof beginImportTask>;
/** Real FileReader progress, abortable reads, and a bounded wait; no probes or remote fetches. */
export function readImportFile(file:File,mode:'text'|'bytes'|'data',signal:AbortSignal,onProgress:(bytes:number)=>void=()=>{}){
 signal.throwIfAborted();return new Promise<string|ArrayBuffer>((resolve,reject)=>{const reader=new FileReader();let done=false;const finish=(error?:unknown)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);reader.onload=reader.onerror=reader.onabort=reader.onprogress=null;error?reject(error):resolve(reader.result as string|ArrayBuffer);};const abort=()=>{finish(new DOMException('Import cancelled.','AbortError'));if(reader.readyState===1)reader.abort();};const timer=setTimeout(()=>{finish(new ImportInputError('Reading the selected file exceeded 30 seconds. Try a smaller local file.'));if(reader.readyState===1)reader.abort();},30_000);reader.onload=()=>{if(done)return;try{signal.throwIfAborted();onProgress(file.size);finish();}catch(error){finish(error);}};reader.onerror=()=>finish(new ImportInputError('The selected file could not be read completely.'));reader.onabort=()=>finish(new DOMException('Import cancelled.','AbortError'));reader.onprogress=e=>{if(done||signal.aborted)return;try{onProgress(Math.min(file.size,e.loaded));}catch(error){finish(error);}};signal.addEventListener('abort',abort,{once:true});try{if(mode==='text')reader.readAsText(file);else if(mode==='data')reader.readAsDataURL(file);else reader.readAsArrayBuffer(file);}catch(error){finish(error);}});
}
export function decodeImportImage(data:string,signal:AbortSignal){signal.throwIfAborted();return new Promise<{width:number;height:number}>((resolve,reject)=>{const image=new Image();let done=false;const finish=(error?:unknown)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);image.onload=image.onerror=null;const size={width:image.naturalWidth,height:image.naturalHeight};image.src='';error?reject(error):resolve(size);};const abort=()=>finish(new DOMException('Import cancelled.','AbortError'));const timer=setTimeout(()=>finish(new ImportInputError('Image decoding exceeded 15 seconds. Try a smaller image.')),15_000);image.onload=()=>{if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>16384||image.naturalHeight>16384||image.naturalWidth*image.naturalHeight>80_000_000)finish(new ImportInputError('Choose images up to 16,384 pixels per side and 80 million pixels each.'));else finish();};image.onerror=()=>finish(new ImportInputError('The image bytes are damaged or use an unsupported codec.'));signal.addEventListener('abort',abort,{once:true});image.src=data;});}

export function svgImportFailureReason(error:unknown){const message=error instanceof Error?error.message:'';if(message==='SVG document types and custom entities are not supported.')return message;if(message==='Invalid SVG. Choose a well-formed SVG file.')return message;return 'The SVG could not be imported safely. It may be malformed, unsupported, or exceed the destination page limit. Nothing was added.';}
