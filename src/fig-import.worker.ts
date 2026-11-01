import {decodeFigContainerInWorker} from './fig-container-core';
import {figClipboardMessage} from './fig-clipboard';
import {mapFigScene} from './fig-scene';
import {serializeFontDocument} from './font-data';
import {packImages} from './image-sharing';
/** Decoding and conversion share one owned worker, so cancelling terminates either stage immediately. */
self.onmessage=(event:MessageEvent<{bytes:Uint8Array;name:string;clipboard?:boolean}>)=>{
 try{const decoded=decodeFigContainerInWorker(event.data.bytes);self.postMessage({kind:'decoded'});const result=mapFigScene(event.data.clipboard?{...decoded,message:figClipboardMessage(decoded.message as Record<string,unknown>)}:decoded,event.data.name,layers=>self.postMessage({kind:'progress',layers}));if(new TextEncoder().encode(serializeFontDocument(result.document,result.document.fonts??[])).byteLength>=50_000_000)throw Error('The converted project exceeds the 50 MB project limit.');self.postMessage({kind:'done',result:{...result,document:packImages(result.document)}});}
 catch(error){self.postMessage({kind:'error',error:error instanceof Error?error.message:'Unable to decode .fig file'});}
};
