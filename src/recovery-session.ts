import type {DesignDocument} from './model';
import {clearCrashJournal,readCrashJournal,recoverCrashJournal,writeCrashJournal} from './crash-journal';
import {announceSaved,documentSessionSettled,reportWindowConflict,useWindowSession} from './document-session';
import {EditHistoryEncoder,editHistoryKey,restoreHistory} from './edit-history';
import {observeDocumentRevision,repositoryRead,setRecoveryHooks,storedValue} from './repository';
import {reportStorageFull} from './storage-health';
import {isSafeMode,isUntouchedPlaceholder} from './startup-health';
import {useEditor} from './store';

/** Keeps Undo and the write-ahead journal attached to the stored document. Every failure here falls back to plain recovery. */
const encoder=new EditHistoryEncoder(),restoring=new Set<string>(),journal=()=>{try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}};
const HISTORY_SAVE_BUDGET_MS=40;
let persisted:DesignDocument|undefined,timer:ReturnType<typeof setTimeout>|undefined,journalDelay=60;
const clearTimer=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;};
function flushJournal(){timer=undefined;const doc=useEditor.getState().doc,store=journal(),session=useWindowSession.getState();if(!store||!persisted||persisted.id!==doc.id||session.conflict)return;if(persisted===doc){clearCrashJournal(store,doc.id);return;}const started=performance.now();writeCrashJournal(store,persisted,doc);journalDelay=Math.min(1000,Math.max(60,(performance.now()-started)*10));}
const pause=()=>new Promise<void>(resolve=>setTimeout(resolve));
async function afterLoad(doc:DesignDocument){
 persisted=doc;if(isSafeMode())return;restoring.add(doc.id);
 try{const raw=await repositoryRead(tx=>storedValue<unknown>(tx.objectStore('metadata').get(editHistoryKey(doc.id)))).catch(()=>undefined),restored=await restoreHistory(raw,doc,pause),live=useEditor.getState();encoder.seed(restored.links);
  if(live.doc.id===doc.id&&(restored.past.length||restored.future.length))useEditor.setState({past:[...restored.past,...live.past].slice(-100),future:live.future.length?live.future:restored.future});
  const store=journal(),entry=store&&readCrashJournal(store,doc.id);if(!store||!entry)return;
  if(!await documentSessionSettled())return;const recovered=recoverCrashJournal(entry,doc),current=useEditor.getState();if(!recovered){clearCrashJournal(store,doc.id);return;}if(current.doc.id!==doc.id||current.home||current.motionOpen)return;current.restoreVersion(recovered,true);useEditor.getState().set({toast:'Recovered edits from the interrupted session. Undo removes them.'});
 }finally{restoring.delete(doc.id);}
}
export function watchRecoverySession(){
 setRecoveryHooks({
  skip:isUntouchedPlaceholder,
  attachment:doc=>{const s=useEditor.getState();if(s.doc!==doc||restoring.has(doc.id)||!s.past.length&&!s.future.length)return undefined;return {key:editHistoryKey(doc.id),value:encoder.record(doc,s.past,s.future,HISTORY_SAVE_BUDGET_MS)};},
  stored:doc=>{if(useEditor.getState().doc.id!==doc.id)return;persisted=doc;const store=journal();if(store&&useEditor.getState().doc===doc)clearCrashJournal(store,doc.id);announceSaved(doc);},
  conflict:reportWindowConflict,quota:reportStorageFull,
 });
 const initial=useEditor.getState().doc;observeDocumentRevision(initial.id,initial.updatedAt);
 const off=useEditor.subscribe((state,previous)=>{if(state.doc===previous.doc)return;const switched=state.doc.id!==previous.doc.id;if(switched)observeDocumentRevision(state.doc.id,state.doc.updatedAt);if(switched||!state.past.length&&!state.future.length&&(previous.past.length||previous.future.length)){clearTimer();void afterLoad(state.doc);return;}if(state.doc===persisted){clearTimer();flushJournal();return;}if(timer===undefined)timer=setTimeout(flushJournal,journalDelay);});
 const leaving=()=>{if(timer!==undefined){clearTimer();flushJournal();}};globalThis.addEventListener?.('pagehide',leaving);
 return()=>{off();clearTimer();globalThis.removeEventListener?.('pagehide',leaving);setRecoveryHooks({});};
}
