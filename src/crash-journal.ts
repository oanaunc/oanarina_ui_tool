import type {DesignDocument} from './model';
import {parseDocument} from './model';
import {applyDocumentPatch,documentPatch} from './edit-history';
import type {DocumentPatch} from './edit-history';

/** Small synchronous write-ahead note between autosaves. The repository stays the source of truth;
 * a journal only ever applies on top of the exact stored revision it was computed from. */
export const CRASH_JOURNAL_LIMITS={bytes:2_000_000} as const;
export interface CrashJournal {schema:1;documentId:string;baseAt:string;writtenAt:string;patch:string;}
type JournalStore=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export const crashJournalKey=(id:string)=>'forma-crash-journal-v1:'+id;
/** False means nothing durable was written: too large, or storage refused. Autosave remains the only protection then. */
export function writeCrashJournal(store:JournalStore,base:DesignDocument,doc:DesignDocument){
 const key=crashJournalKey(doc.id);
 try{if(base.id!==doc.id)return false;const patch=JSON.stringify(documentPatch(base,doc));if(patch.length>CRASH_JOURNAL_LIMITS.bytes){store.removeItem(key);return false;}const entry:CrashJournal={schema:1,documentId:doc.id,baseAt:base.updatedAt,writtenAt:doc.updatedAt,patch};store.setItem(key,JSON.stringify(entry));return true;}
 catch{try{store.removeItem(key);}catch{/* Storage is unavailable; autosave still applies. */}return false;}
}
export function clearCrashJournal(store:JournalStore,id:string){try{store.removeItem(crashJournalKey(id));}catch{/* Nothing to clear. */}}
export function readCrashJournal(store:JournalStore,id:string):CrashJournal|undefined{
 try{const raw=store.getItem(crashJournalKey(id));if(!raw||raw.length>CRASH_JOURNAL_LIMITS.bytes*2)return undefined;const e=JSON.parse(raw) as CrashJournal;if(e?.schema!==1||e.documentId!==id||typeof e.baseAt!=='string'||typeof e.writtenAt!=='string'||typeof e.patch!=='string'||e.patch.length>CRASH_JOURNAL_LIMITS.bytes)return undefined;return e;}catch{return undefined;}
}
/** Refuses anything stale or invalid: a wrong base means the stored file already moved on. */
export function recoverCrashJournal(entry:CrashJournal,stored:DesignDocument){
 if(entry.documentId!==stored.id||entry.baseAt!==stored.updatedAt)return undefined;
 try{const doc=parseDocument(JSON.stringify(applyDocumentPatch(stored,JSON.parse(entry.patch) as DocumentPatch)));return doc.id===stored.id?doc:undefined;}catch{return undefined;}
}
