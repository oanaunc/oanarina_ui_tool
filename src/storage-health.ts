import {create} from 'zustand';
import {useEditor} from './store';

/** Quota is reported, never silently absorbed: a full disk is when a user most needs to export. */
export const STORAGE_THRESHOLDS={warning:.8,critical:.95} as const;
export type StorageLevel='ok'|'warning'|'critical'|'full'|'unknown';
export interface StorageReport {level:StorageLevel;usage:number;quota:number;ratio:number;persisted:boolean|undefined;}
export function storageLevel(usage:number,quota:number):StorageLevel{if(!Number.isFinite(usage)||!Number.isFinite(quota)||quota<=0||usage<0)return 'unknown';const ratio=usage/quota;return ratio>=STORAGE_THRESHOLDS.critical?'critical':ratio>=STORAGE_THRESHOLDS.warning?'warning':'ok';}
export const formatBytes=(bytes:number)=>!Number.isFinite(bytes)||bytes<0?'unknown':bytes<1024?`${bytes} B`:bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:bytes<1073741824?`${(bytes/1048576).toFixed(1)} MB`:`${(bytes/1073741824).toFixed(2)} GB`;
export const useStorageHealth=create<StorageReport>(()=>({level:'unknown',usage:0,quota:0,ratio:0,persisted:undefined}));
const notified=new Set<StorageLevel>(),messages:Partial<Record<StorageLevel,(r:StorageReport)=>string>>={warning:r=>`Local storage is ${Math.round(r.ratio*100)}% full. Open File → Storage and recovery to free space.`,critical:r=>`Local storage is ${Math.round(r.ratio*100)}% full. Save a .oui backup now and free space.`,full:()=>'Local storage is full, so this change was not saved here. Save a .oui backup, then free space in File → Storage and recovery.'};
const notify=(report:StorageReport)=>{if(notified.has(report.level))return;const message=messages[report.level];if(!message)return;notified.add(report.level);useEditor.getState().set({toast:message(report)});};
export async function refreshStorageHealth(){
 const manager=typeof navigator!=='undefined'?navigator.storage:undefined;if(!manager?.estimate)return useStorageHealth.getState();
 try{const {usage=0,quota=0}=await manager.estimate(),persisted=await manager.persisted?.().catch(()=>undefined),level=storageLevel(usage,quota),current=useStorageHealth.getState().level,report:StorageReport={level:current==='full'&&level!=='ok'?'full':level,usage,quota,ratio:quota?usage/quota:0,persisted};useStorageHealth.setState(report);if(level==='ok')notified.clear();notify(report);return report;}catch{return useStorageHealth.getState();}
}
export function reportStorageFull(){const report={...useStorageHealth.getState(),level:'full' as const};useStorageHealth.setState(report);notify(report);}
/** Explicit only: the browser may prompt, and eviction protection is the user's decision. */
export async function requestDurableStorage(){const manager=navigator.storage;if(!manager?.persist)throw Error('This environment cannot request durable storage.');const granted=await manager.persist();await refreshStorageHealth();return granted;}
export function watchStorageHealth(){void refreshStorageHealth();let last=0;const off=useEditor.subscribe((state,previous)=>{if(state.recoveryAt===previous.recoveryAt)return;const now=Date.now();if(now-last<60000)return;last=now;void refreshStorageHealth();});return off;}
