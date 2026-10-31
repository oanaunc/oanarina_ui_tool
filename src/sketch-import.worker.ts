import {readSketchZip} from './sketch-archive';
import {convertSketchArchive} from './sketch-convert';
import {SketchImportError} from './sketch-limits';
self.onmessage=(event:MessageEvent<{bytes:Uint8Array;name:string}>)=>{try{let entries:Map<string,Uint8Array>;try{entries=readSketchZip(event.data.bytes,(entry,total)=>self.postMessage({kind:'progress',entry,total}));}catch{throw new SketchImportError('archive');}const result=convertSketchArchive(entries,event.data.name);self.postMessage({kind:'done',result});}catch(error){self.postMessage({kind:'error',code:error instanceof SketchImportError?error.code:'invalid'});}};
