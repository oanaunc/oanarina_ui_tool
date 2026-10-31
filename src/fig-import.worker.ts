import {decodeFigContainerInWorker} from './fig-container-core';
import {mapFigScene} from './fig-scene';
/** Decoding and conversion share one owned worker, so cancelling terminates either stage immediately. */
self.onmessage=(event:MessageEvent<{bytes:Uint8Array;name:string}>)=>{
 try{const decoded=decodeFigContainerInWorker(event.data.bytes);self.postMessage({kind:'decoded'});const result=mapFigScene(decoded,event.data.name,layers=>self.postMessage({kind:'progress',layers}));self.postMessage({kind:'done',result});}
 catch(error){self.postMessage({kind:'error',error:error instanceof Error?error.message:'Unable to decode .fig file'});}
};
