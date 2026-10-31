import {useSyncExternalStore} from 'react';
import {create} from 'zustand';
import {saveDocument} from './repository';
import {useEditor} from './store';
export interface FileSaveInput {updatedAt:string;recoveryAt:string;savedAt:string;recoveryFailed:boolean;}
export interface FileSaveStatus {state:'failed'|'saving'|'local'|'file';label:string;detail:string;}
const clock=(value:string)=>{const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'';};
/** Timestamps come from the editor; no file path crosses into the renderer. */
export function fileSaveStatus({updatedAt,recoveryAt,savedAt,recoveryFailed}:FileSaveInput):FileSaveStatus{
 if(recoveryFailed)return {state:'failed',label:'Not saved',detail:'Local recovery could not be saved. Save a .oui file to keep this work.'};
 if(savedAt&&savedAt===updatedAt)return {state:'file',label:'Saved to .oui',detail:`All changes are in the .oui file you saved at ${clock(savedAt)}.`};
 if(recoveryAt&&recoveryAt===updatedAt)return {state:'local',label:'Saved locally',detail:`Local recovery saved at ${clock(recoveryAt)} on this device. Save a .oui file for a portable copy.`};
 return {state:'saving',label:'Saving…',detail:'Saving local recovery on this device.'};
}
export const useRecoveryFailure=create<{failed:boolean}>(()=>({failed:false}));
export const setRecoveryFailed=(failed:boolean)=>{if(useRecoveryFailure.getState().failed!==failed)useRecoveryFailure.setState({failed});};
export async function retryLocalRecovery(){const doc=useEditor.getState().doc,saved=await saveDocument(doc);if(!saved)throw Error('This project has been permanently removed from local storage.');setRecoveryFailed(false);if(useEditor.getState().doc.id===doc.id)useEditor.getState().set({recoveryAt:doc.updatedAt});}
const subscribeConnection=(listener:()=>void)=>{window.addEventListener('online',listener);window.addEventListener('offline',listener);return()=>{window.removeEventListener('online',listener);window.removeEventListener('offline',listener);};};
/** Reports the device network interface. Editing and saving never depend on it. */
export const useDeviceOnline=()=>useSyncExternalStore(subscribeConnection,()=>navigator.onLine,()=>true);
export const connectionLabel=(online:boolean)=>online?'On your Mac':'On your Mac · Offline';
export const connectionDetail=(online:boolean)=>online?'Your files stay on this device. Network available for font downloads and guide links.':'No network connection. Editing and local saves keep working. Font downloads and guide links need a network.';
