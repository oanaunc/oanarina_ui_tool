import {buildIconGeometryIndex,matchIconGeometry} from './icon-detection';
import type {IconGeometryIndex} from './icon-detection';
let index:IconGeometryIndex|undefined;
self.onmessage=event=>{try{const {id,catalog,signature}=event.data;if(!Number.isSafeInteger(id)||id<1)throw Error();index??=buildIconGeometryIndex(catalog);self.postMessage({id,ok:true,result:matchIconGeometry(index,signature)});}catch{self.postMessage({id:event.data?.id,ok:false});}};
