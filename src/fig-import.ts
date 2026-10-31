import {decodeFigFile} from './fig-container';
import {mapFigScene,validateFigSceneRasters} from './fig-scene';
import type {FigImportIssue} from './fig-scene';
import type {DesignDocument} from './model';
import {parseDocument} from './model';
import {serializeFontDocument} from './font-data';

export interface FigImportResult {source?:'rest';document:DesignDocument;issues:FigImportIssue[];complete:boolean;fontFamilies:string[];}
/** Selected bytes only. No network access, source paths, or document mutation. */
export async function importFigBytes(bytes:Uint8Array,name:string,signal?:AbortSignal,onStage?:(stage:'validating'|'decoding')=>void):Promise<FigImportResult>{
 if(bytes.byteLength>=50_000_000)throw Error('Choose a Figma file smaller than 50 MB.');
 onStage?.('decoding');const decoded=await decodeFigFile(bytes,{signal});
 if(signal?.aborted)throw new DOMException('Figma import cancelled.','AbortError');
 onStage?.('validating');if(onStage)await new Promise<void>(resolve=>setTimeout(resolve,0));signal?.throwIfAborted();const result=mapFigScene(decoded,name.replace(/\.fig$/i,'').slice(0,120)||'Imported Figma file');
 onStage?.('decoding');await validateFigSceneRasters(result.document,signal);
 if(signal?.aborted)throw new DOMException('Figma import cancelled.','AbortError');
 onStage?.('validating');
 // Apply the same readable-file byte budget used by Save, before accepting it.
 const raw=serializeFontDocument(result.document,result.document.fonts??[]);
 if(new TextEncoder().encode(raw).byteLength>=50_000_000)throw Error('The converted project exceeds the 50 MB project limit.');
 return {...result,document:parseDocument(raw)};
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
