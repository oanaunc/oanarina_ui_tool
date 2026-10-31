import {useEditor} from './store';
const CHANNEL='forma-file-tabs',TARGET=/^#forma-file=([^&]{1,1600})$/;
export function fileTabUrl(id:string,base:string){const url=new URL(base);url.search='';url.hash='forma-file='+encodeURIComponent(id);return url.href;}
/** The target is only a local document id. A malformed fragment is ignored. */
export function fileTabTarget(hash:string){const match=TARGET.exec(hash);if(!match)return;try{const id=decodeURIComponent(match[1]);return id&&id.length<=500&&!/[\u0000-\u001f]/.test(id)?id:undefined;}catch{return undefined;}}
export function clearFileTabTarget(){history.replaceState(history.state,'',location.pathname+location.search);}
/** Each tab answers for the document it holds; ids stay on this origin's channel. */
export function watchFileTabs(){if(typeof BroadcastChannel==='undefined')return()=>{};const channel=new BroadcastChannel(CHANNEL);channel.onmessage=e=>{const m=e.data;if(m?.type==='query'&&m.id===useEditor.getState().doc.id)channel.postMessage({type:'held',nonce:m.nonce});};return()=>channel.close();}
export function fileHeldElsewhere(id:string,wait=150){if(typeof BroadcastChannel==='undefined')return Promise.resolve(false);return new Promise<boolean>(resolve=>{const channel=new BroadcastChannel(CHANNEL),nonce=crypto.randomUUID(),finish=(held:boolean)=>{clearTimeout(timer);channel.close();resolve(held);},timer=setTimeout(()=>finish(false),wait);channel.onmessage=e=>{if(e.data?.type==='held'&&e.data.nonce===nonce)finish(true);};channel.postMessage({type:'query',id,nonce});});}
/** Two editors on one document would overwrite each other's recovery, so an already open file is refused. */
export async function openFileInNewTab(id:string){if(window.desktop)throw Error('The Mac app opens each file in its own window. Use Open file.');if(useEditor.getState().doc.id===id)throw Error('This file is already open in this tab.');if(await fileHeldElsewhere(id))throw Error('This file is already open in another tab.');const opened=window.open(fileTabUrl(id,location.href),'_blank');if(!opened)throw Error('The new tab was blocked. Allow pop-ups for Forma and try again.');opened.opener=null;}
