import {isLocked,node} from './model';
import type {DesignDocument,DesignNode} from './model';
import {validateVideo} from './media';
import type {EmbeddedVideo} from './media';
import {createPaint} from './paints';
import {managedLayer} from './layer-operations';
export function videoNodeProps(media:EmbeddedVideo):Partial<DesignNode>{validateVideo(media);return {media:structuredClone(media),image:media.poster,paints:[{...createPaint('#000000','image'),image:media.poster,imageWidth:media.width,imageHeight:media.height}],fill:'none'};}
export function addEmbeddedVideo(doc:DesignDocument,pageId:string,media:EmbeddedVideo,name:string){validateVideo(media);const page=doc.pages.find(p=>p.id===pageId);if(!page)throw Error('The video page is missing.');const n=node('image',{...videoNodeProps(media),name:name.slice(0,200)||'Video',x:120,y:120,width:Math.min(media.width,640),height:Math.min(media.width,640)*media.height/media.width});if(JSON.stringify(doc).length+JSON.stringify(n).length>50_000_000)throw Error('This video would exceed the 50 MB project limit. Use a smaller clip.');page.nodes.push(n);return n.id;}
export function updateEmbeddedVideo(doc:DesignDocument,pageId:string,id:string,patch:Partial<EmbeddedVideo>){const page=doc.pages.find(p=>p.id===pageId),n=page?.nodes.find(n=>n.id===id);if(!page||!n?.media)throw Error('Choose an existing video layer.');if(isLocked(n,page.nodes)||managedLayer(n,page.nodes))throw Error('Unlock and detach the video hierarchy before editing its settings.');const media={...n.media,...patch};validateVideo(media);const props=videoNodeProps(media);if(JSON.stringify(doc).length-JSON.stringify(n).length+JSON.stringify({...n,...props}).length>50_000_000)throw Error('This video would exceed the 50 MB project limit.');Object.assign(n,props);}
