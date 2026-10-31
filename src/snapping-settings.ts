import {useSyncExternalStore} from 'react';
import {decodePreferences,getPreferences,PREFERENCES_KEY,subscribePreferences} from './preferences';
import {snappingPreferenceKey} from './snapping-preferences';
let revision=0,lastKey:string|undefined,stop:(()=>void)|undefined;
const listeners=new Set<()=>void>();
function observe(next:string){if(next===lastKey)return;lastKey=next;revision++;for(const listener of [...listeners])listener();}
/** Observe event snapshots as well as current storage: remote away/back writes must not revive a gesture. */
function storage(event:StorageEvent){if(event.key!==PREFERENCES_KEY&&event.key!==null)return;const next=snappingPreferenceKey(decodePreferences(event.newValue)),previous=snappingPreferenceKey(decodePreferences(event.oldValue));if(event.key===null||next!==previous)observe(next);}
export const snappingSettingsRevision=()=>revision;
export function subscribeSnappingSettings(listener:()=>void){
 if(!listeners.size){lastKey=snappingPreferenceKey(getPreferences());stop=subscribePreferences(()=>observe(snappingPreferenceKey(getPreferences())));if(typeof window!=='undefined')window.addEventListener('storage',storage);}
 listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size){stop?.();stop=undefined;if(typeof window!=='undefined')window.removeEventListener('storage',storage);}};
}
export function useSnappingSettingsRevision(){return useSyncExternalStore(subscribeSnappingSettings,snappingSettingsRevision,()=>0);}
