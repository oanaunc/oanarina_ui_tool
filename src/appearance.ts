import {useSyncExternalStore} from 'react';

export type Appearance='light'|'dark'|'system';
export const APPEARANCE_KEY='oui-theme';
const listeners=new Set<()=>void>();
export function parseAppearance(raw:unknown):Appearance{return raw==='light'||raw==='system'?raw:'dark';}
export function resolvedAppearance(choice:Appearance,systemDark:boolean):'light'|'dark'{return choice==='system'?(systemDark?'dark':'light'):choice;}
/** Preserve existing explicit light/dark choices; unavailable storage uses the original dark default. */
export function getAppearance():Appearance{try{return parseAppearance(localStorage.getItem(APPEARANCE_KEY));}catch{return 'dark';}}
function emit(){for(const listener of [...listeners])listener();}
function storage(e:StorageEvent){if(e.key===APPEARANCE_KEY||e.key===null)emit();}
export function subscribeAppearance(listener:()=>void){if(!listeners.size&&typeof window!=='undefined')window.addEventListener('storage',storage);listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',storage);};}
export function useAppearance(){return useSyncExternalStore(subscribeAppearance,getAppearance,()=>'dark' as const);}
/** Persist before changing the live UI, so a denied write never claims a saved preference. */
export function updateAppearance(choice:Appearance){if(choice!=='light'&&choice!=='dark'&&choice!=='system')throw Error('Choose a valid appearance.');try{localStorage.setItem(APPEARANCE_KEY,choice);}catch{throw Error('Appearance could not be saved. Allow local storage or free some storage space.');}emit();}
export function resetAppearance(){try{localStorage.removeItem(APPEARANCE_KEY);}catch{throw Error('Appearance could not be reset. Allow local storage or free some storage space.');}emit();}
/** The subscription owns no document state and removes both listeners when its editor unmounts. */
export function watchAppearance(apply:(theme:'light'|'dark')=>void){
 const media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null;
 const refresh=()=>apply(resolvedAppearance(getAppearance(),media?.matches??true));
 const unsubscribe=subscribeAppearance(refresh);media?.addEventListener('change',refresh);refresh();
 return()=>{unsubscribe();media?.removeEventListener('change',refresh);};
}
