import {useSyncExternalStore} from 'react';

/** Accent and contrast are device preferences, outside .oui, and never touch artwork colors. */
export const INTERFACE_ACCENTS=['forma','blue','purple','pink','red','orange','green','graphite'] as const;
export type InterfaceAccent=typeof INTERFACE_ACCENTS[number];
export type InterfaceContrast='system'|'more'|'standard';
export const INTERFACE_ACCENT_KEY='oui-interface-accent';
export const INTERFACE_CONTRAST_KEY='oui-interface-contrast';
const listeners=new Set<()=>void>();
export function parseInterfaceAccent(raw:unknown):InterfaceAccent{return INTERFACE_ACCENTS.includes(raw as InterfaceAccent)?raw as InterfaceAccent:'forma';}
export function parseInterfaceContrast(raw:unknown):InterfaceContrast{return raw==='more'||raw==='standard'?raw:'system';}
export function resolvedInterfaceContrast(choice:InterfaceContrast,systemMore:boolean){return choice==='system'?systemMore:choice==='more';}
function read(key:string){try{return typeof localStorage==='undefined'?null:localStorage.getItem(key);}catch{return null;}}
export function getInterfaceAccent(){return parseInterfaceAccent(read(INTERFACE_ACCENT_KEY));}
export function getInterfaceContrast(){return parseInterfaceContrast(read(INTERFACE_CONTRAST_KEY));}
function emit(){for(const listener of [...listeners])listener();}
function storage(e:StorageEvent){if(e.key===INTERFACE_ACCENT_KEY||e.key===INTERFACE_CONTRAST_KEY||e.key===null)emit();}
function subscribe(listener:()=>void){if(!listeners.size&&typeof window!=='undefined')window.addEventListener('storage',storage);listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',storage);};}
export function useInterfaceAccent(){return useSyncExternalStore(subscribe,getInterfaceAccent,()=>'forma' as const);}
export function useInterfaceContrast(){return useSyncExternalStore(subscribe,getInterfaceContrast,()=>'system' as const);}
/** Persist first: a failed write never advertises a saved local override. */
export function updateInterfaceAccent(accent:InterfaceAccent){if(!INTERFACE_ACCENTS.includes(accent))throw Error('Choose a valid accent color.');try{localStorage.setItem(INTERFACE_ACCENT_KEY,accent);}catch{throw Error('Accent color could not be saved. Allow local storage or free some storage space.');}emit();}
export function updateInterfaceContrast(choice:InterfaceContrast){if(!['system','more','standard'].includes(choice))throw Error('Choose a valid contrast preference.');try{localStorage.setItem(INTERFACE_CONTRAST_KEY,choice);}catch{throw Error('Contrast preference could not be saved. Allow local storage or free some storage space.');}emit();}
export function resetInterfaceAccessibility(){try{localStorage.removeItem(INTERFACE_ACCENT_KEY);localStorage.removeItem(INTERFACE_CONTRAST_KEY);}catch{throw Error('Accent and contrast could not be reset. Allow local storage or free some storage space.');}emit();}
/** No document state is read or changed; both attributes only select CSS tokens on the root element. */
export function watchInterfaceAccessibility(root:HTMLElement=document.documentElement){
 let media:MediaQueryList|null=null;try{if(typeof window.matchMedia==='function')media=window.matchMedia('(prefers-contrast: more)');}catch{/* Unsupported system query keeps standard contrast. */}
 const refresh=()=>{const accent=getInterfaceAccent();if(accent==='forma')root.removeAttribute('data-accent');else root.setAttribute('data-accent',accent);if(resolvedInterfaceContrast(getInterfaceContrast(),media?.matches??false))root.setAttribute('data-contrast','more');else root.removeAttribute('data-contrast');},off=subscribe(refresh);
 media?.addEventListener?.('change',refresh);refresh();
 return()=>{off();media?.removeEventListener?.('change',refresh);root.removeAttribute('data-accent');root.removeAttribute('data-contrast');};
}
