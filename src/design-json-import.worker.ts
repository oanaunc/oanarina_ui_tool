import {importDesignJson} from './design-json-import';
import {ImportInputError} from './import-task';
self.onmessage=(event:MessageEvent<{text:string;name:string}>)=>{
 try{self.postMessage({kind:'done',result:importDesignJson(JSON.parse(event.data.text),event.data.name)});}
 catch(error){self.postMessage({kind:'error',error:error instanceof ImportInputError?error.message:undefined});}
};
