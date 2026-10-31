import {importFigmaRestJson} from './figma-rest-import';
import {ImportInputError} from './import-task';
self.onmessage=(event:MessageEvent<{text:string;name:string}>)=>{
 try{self.postMessage({kind:'done',result:importFigmaRestJson(JSON.parse(event.data.text),event.data.name)});}
 catch(error){self.postMessage({kind:'error',error:error instanceof ImportInputError?error.message:undefined});}
};
