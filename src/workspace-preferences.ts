import {useSyncExternalStore} from 'react';

/** Canvas gesture, delivery and retention choices. Local to this app/browser origin; never serialized in .oui. */
export interface WorkspacePreferences {
 flipWhileResizing:boolean;hideCanvasUiDuringChanges:boolean;commandOptionRotation:boolean;
 trashRetentionDays:number;exportDestination:'browser'|'ask';exportNaming:'layer'|'document-layer'|'page-layer';
}
export const WORKSPACE_PREFERENCES_KEY='forma-workspace-preferences';
export const trashRetentionChoices=[0,7,30,90] as const;
export const defaultWorkspacePreferences:Readonly<WorkspacePreferences>=Object.freeze({flipWhileResizing:false,hideCanvasUiDuringChanges:false,commandOptionRotation:false,trashRetentionDays:0,exportDestination:'browser',exportNaming:'layer'});
export function validateWorkspacePreferences(value:unknown):WorkspacePreferences {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Workspace preferences must be an object.');
 const r=value as Record<string,unknown>,fields=Object.keys(defaultWorkspacePreferences);
 if(Object.keys(r).some(k=>!fields.includes(k))||fields.some(k=>!Object.hasOwn(r,k)))throw Error('Invalid workspace preference fields.');
 for(const k of ['flipWhileResizing','hideCanvasUiDuringChanges','commandOptionRotation'])if(typeof r[k]!=='boolean')throw Error('Invalid workspace preference toggle.');
 if(!trashRetentionChoices.includes(r.trashRetentionDays as 0))throw Error('Choose how long Trash keeps files.');
 if(!['browser','ask'].includes(r.exportDestination as string))throw Error('Choose a valid export destination.');
 if(!['layer','document-layer','page-layer'].includes(r.exportNaming as string))throw Error('Choose a valid export naming pattern.');
 return {...r} as unknown as WorkspacePreferences;
}
let cached:Readonly<WorkspacePreferences>=defaultWorkspacePreferences,lastRaw:string|null|undefined;
const listeners=new Set<()=>void>();
function raw(){try{return typeof localStorage==='undefined'?null:localStorage.getItem(WORKSPACE_PREFERENCES_KEY);}catch{return null;}}
export function decodeWorkspacePreferences(value:string|null):Readonly<WorkspacePreferences>{if(!value||value.length>2000)return defaultWorkspacePreferences;try{const data=JSON.parse(value);if(data?.version!==1||!data.values||typeof data.values!=='object')return defaultWorkspacePreferences;const known=Object.fromEntries(Object.keys(defaultWorkspacePreferences).filter(k=>Object.hasOwn(data.values,k)).map(k=>[k,data.values[k]]));return Object.freeze(validateWorkspacePreferences({...defaultWorkspacePreferences,...known}));}catch{return defaultWorkspacePreferences;}}
export function getWorkspacePreferences():Readonly<WorkspacePreferences>{const value=raw();if(value!==lastRaw){lastRaw=value;cached=decodeWorkspacePreferences(value);}return cached;}
function emit(){for(const listener of [...listeners])listener();}
function storage(e:StorageEvent){if(e.key===WORKSPACE_PREFERENCES_KEY||e.key===null){getWorkspacePreferences();emit();}}
export function subscribeWorkspacePreferences(listener:()=>void){if(!listeners.size&&typeof window!=='undefined')window.addEventListener('storage',storage);listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',storage);};}
export function useWorkspacePreferences(){return useSyncExternalStore(subscribeWorkspacePreferences,getWorkspacePreferences,()=>defaultWorkspacePreferences);}
/** Validate and persist first; blocked storage never claims a saved choice. */
export function updateWorkspacePreferences(patch:Partial<WorkspacePreferences>){if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!Object.hasOwn(defaultWorkspacePreferences,k)))throw Error('Invalid workspace preference update.');const next=Object.freeze(validateWorkspacePreferences({...getWorkspacePreferences(),...patch})),value=JSON.stringify({version:1,values:next});try{if(typeof localStorage==='undefined')throw Error();localStorage.setItem(WORKSPACE_PREFERENCES_KEY,value);}catch{throw Error('Workspace preferences could not be saved. Allow local storage or free some storage space.');}lastRaw=value;cached=next;emit();return next;}
export function resetWorkspacePreferences(){try{if(typeof localStorage==='undefined')throw Error();localStorage.removeItem(WORKSPACE_PREFERENCES_KEY);}catch{throw Error('Workspace preferences could not be reset. Allow local storage or free some storage space.');}lastRaw=null;cached=defaultWorkspacePreferences;emit();}
