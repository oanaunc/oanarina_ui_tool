import {runImportParseJob} from './import-parse-core';
import type {ImportParseJob} from './import-parse-core';
/** .oui JSON, SVG and final schema validation share one owned worker, so Cancel stops the parser itself rather than waiting for it. */
self.onmessage=(event:MessageEvent<ImportParseJob>)=>{
 try{self.postMessage({kind:'done',result:runImportParseJob(event.data)});}
 catch(error){self.postMessage({kind:'error',name:error instanceof Error?error.name:'Error',message:error instanceof Error?error.message:''});}
};
