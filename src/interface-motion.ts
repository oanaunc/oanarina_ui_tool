import {useSyncExternalStore} from 'react';

export type InterfaceMotion='system'|'reduce'|'allow';
export const INTERFACE_MOTION_KEY='oui-interface-motion';
const listeners=new Set<()=>void>();
export function parseInterfaceMotion(raw:unknown):InterfaceMotion{return raw==='reduce'||raw==='allow'?raw:'system';}
export function resolvedInterfaceMotion(choice:InterfaceMotion,systemReduced:boolean){return choice==='system'?systemReduced:choice==='reduce';}
export function getInterfaceMotion():InterfaceMotion{try{return parseInterfaceMotion(localStorage.getItem(INTERFACE_MOTION_KEY));}catch{return 'system';}}
function emit(){for(const listener of [...listeners])listener();}
function storage(event:StorageEvent){if(event.key===INTERFACE_MOTION_KEY||event.key===null)emit();}
export function subscribeInterfaceMotion(listener:()=>void){if(!listeners.size&&typeof window!=='undefined')window.addEventListener('storage',storage);listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',storage);};}
export function useInterfaceMotion(){return useSyncExternalStore(subscribeInterfaceMotion,getInterfaceMotion,()=>'system' as const);}
/** Persist first: a failed write never advertises a saved local override. */
export function updateInterfaceMotion(choice:InterfaceMotion){if(!['system','reduce','allow'].includes(choice))throw Error('Choose a valid interface motion preference.');try{localStorage.setItem(INTERFACE_MOTION_KEY,choice);}catch{throw Error('Interface motion could not be saved. Allow local storage or free some storage space.');}emit();}
export function resetInterfaceMotion(){try{localStorage.removeItem(INTERFACE_MOTION_KEY);}catch{throw Error('Interface motion could not be reset. Allow local storage or free some storage space.');}emit();}
/** No document/animation state is read or changed by this subscription. */
export function watchInterfaceMotion(apply:(reduced:boolean)=>void){
 let media:MediaQueryList|null=null;try{if(typeof window.matchMedia==='function')media=window.matchMedia('(prefers-reduced-motion: reduce)');}catch{/* Unsupported system query defaults to the quieter policy. */}
 const refresh=()=>apply(resolvedInterfaceMotion(getInterfaceMotion(),media?.matches??true)),off=subscribeInterfaceMotion(refresh);
 if(typeof media?.addEventListener==='function')media.addEventListener('change',refresh);else media?.addListener?.(refresh);
 refresh();return()=>{off();if(typeof media?.removeEventListener==='function')media.removeEventListener('change',refresh);else media?.removeListener?.(refresh);};
}
