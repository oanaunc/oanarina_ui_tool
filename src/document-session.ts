import {create} from 'zustand';
import type {DesignDocument} from './model';
import {cloneLocalDocument} from './file-browser';
import {documentById,importLocalDocuments,observeDocumentRevision,saveDocument} from './repository';
import {useEditor} from './store';

/** Web Locks prove liveness, BroadcastChannel carries saves between windows and the repository
 * compare-and-write is the final guard, so a missing browser API degrades detection but never safety. */
export interface WindowConflict {documentId:string;storedAt:string;source:'write'|'announced';}
export interface WindowSession {documentId:string;primary:boolean;peers:boolean;dismissed:boolean;conflict?:WindowConflict;}
export const useWindowSession=create<WindowSession>(()=>({documentId:'',primary:true,peers:false,dismissed:false}));
type SessionMessage={type:'open'|'here'|'left';window:string;document:string}|{type:'saved';window:string;document:string;updatedAt:string};
export const WINDOW_ID=typeof crypto!=='undefined'?crypto.randomUUID():'window';
let channel:BroadcastChannel|undefined,releaseLock:(()=>void)|undefined,lockEpoch=0,settled:Promise<boolean>=Promise.resolve(true);
const post=(message:SessionMessage)=>{try{channel?.postMessage(message);}catch{/* A closed channel only reduces detection. */}};
const update=(patch:Partial<WindowSession>)=>useWindowSession.setState(patch);
function holdDocumentLock(id:string){
 releaseLock?.();releaseLock=undefined;const epoch=++lockEpoch,locks=typeof navigator!=='undefined'?navigator.locks:undefined;
 if(!locks){settled=new Promise(resolve=>{post({type:'open',window:WINDOW_ID,document:id});setTimeout(()=>resolve(!useWindowSession.getState().peers),150);});return;}
 const name='forma-document:'+id,hold=()=>new Promise<void>(resolve=>{releaseLock=resolve;});
 settled=new Promise(resolve=>{void locks.request(name,{ifAvailable:true},async lock=>{if(epoch!==lockEpoch)return;if(lock){resolve(true);update({primary:true});return hold();}resolve(false);update({primary:false,peers:true,dismissed:false});
  // Queue behind the holder; the browser releases a crashed window's lock, which ends this warning without any heartbeat.
  void locks.request(name,async()=>{if(epoch!==lockEpoch)return;update({primary:true,peers:false});return hold();}).catch(()=>{});return undefined;}).catch(()=>resolve(true));});
}
/** True when no other live window holds this document. Journals only replay in that case. */
export const documentSessionSettled=()=>settled;
export function reportWindowConflict(doc:DesignDocument,storedAt:string){if(useEditor.getState().doc.id===doc.id)update({conflict:{documentId:doc.id,storedAt,source:'write'}});}
export const announceSaved=(doc:DesignDocument)=>post({type:'saved',window:WINDOW_ID,document:doc.id,updatedAt:doc.updatedAt});
function receive(message:SessionMessage){
 if(!message||message.window===WINDOW_ID)return;const doc=useEditor.getState().doc;if(message.document!==doc.id)return;
 if(message.type==='open'){post({type:'here',window:WINDOW_ID,document:doc.id});update({peers:true,dismissed:false});}
 else if(message.type==='here')update({peers:true});
 else if(message.type==='left')update({peers:false});
 else if(message.type==='saved'&&message.updatedAt!==doc.updatedAt&&!useWindowSession.getState().conflict)update({conflict:{documentId:doc.id,storedAt:message.updatedAt,source:'announced'}});
}
export function watchDocumentSession(){
 if(typeof BroadcastChannel!=='undefined'){channel=new BroadcastChannel('forma-document-session-v1');channel.onmessage=e=>receive(e.data as SessionMessage);}
 const follow=(doc:DesignDocument)=>{update({documentId:doc.id,primary:true,peers:false,dismissed:false,conflict:undefined});holdDocumentLock(doc.id);post({type:'open',window:WINDOW_ID,document:doc.id});};
 follow(useEditor.getState().doc);
 const off=useEditor.subscribe((state,previous)=>{if(state.doc.id!==previous.doc.id){post({type:'left',window:WINDOW_ID,document:previous.doc.id});follow(state.doc);}});
 const leave=()=>post({type:'left',window:WINDOW_ID,document:useEditor.getState().doc.id}),recheck=()=>{const session=useWindowSession.getState();if(!session.peers||navigator.locks)return;update({peers:false});post({type:'open',window:WINDOW_ID,document:session.documentId});};
 window.addEventListener('pagehide',leave);window.addEventListener('focus',recheck);
 return()=>{off();leave();window.removeEventListener('pagehide',leave);window.removeEventListener('focus',recheck);channel?.close();channel=undefined;lockEpoch++;releaseLock?.();releaseLock=undefined;};
}
/** Discards this window's copy in favor of the stored revision. */
export async function loadStoredRevision(){const id=useEditor.getState().doc.id,doc=await documentById(id,{includeTrashed:true});if(!doc)throw Error('The stored copy is unavailable. Keep this window’s version or save a copy.');observeDocumentRevision(id,doc.updatedAt);useEditor.getState().load(doc);update({conflict:undefined});}
/** Explicit overwrite: re-observes the newest stored revision, then writes this window's copy over it. */
export async function keepWindowRevision(){const live=useEditor.getState(),stored=await documentById(live.doc.id,{includeTrashed:true}).catch(()=>null);observeDocumentRevision(live.doc.id,stored?.updatedAt??useWindowSession.getState().conflict?.storedAt??live.doc.updatedAt);if(!await saveDocument(live.doc))throw Error('This window’s version could not be stored. Save a .oui backup.');update({conflict:undefined});}
/** Keeps both: this window continues on a new local file and the stored revision stays as it is. */
export async function saveWindowRevisionAsCopy(){const live=useEditor.getState(),copy=cloneLocalDocument(live.doc,(live.doc.name.slice(0,100)+' (conflict copy)').slice(0,120)),[stored]=await importLocalDocuments([JSON.stringify(copy)]);update({conflict:undefined});useEditor.getState().load(stored);}
