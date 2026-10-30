import {useSyncExternalStore} from 'react';
export const RECENT_COLORS_KEY='oui-recent-colors';
let cache:string[]=[];let hydrated=false;const listeners=new Set<()=>void>();
export function parseRecentColors(raw:string|null){if(raw&&raw.length>1024)return [];try{const value=JSON.parse(raw??'[]');if(!Array.isArray(value)||value.length>24)return [];return [...new Set(value.filter((x):x is string=>typeof x==='string'&&/^#[a-f\d]{6}$/i.test(x)).map(x=>x.toLowerCase()))];}catch{return [];}}
function hydrate(){if(hydrated)return;hydrated=true;try{cache=parseRecentColors(localStorage.getItem(RECENT_COLORS_KEY));}catch{/* in-memory editing */}}
export function rememberColor(value:string){if(!/^#[a-f\d]{6}$/i.test(value))throw Error('Choose a valid color.');hydrate();const color=value.toLowerCase();cache=[color,...cache.filter(c=>c!==color)].slice(0,24);try{localStorage.setItem(RECENT_COLORS_KEY,JSON.stringify(cache));}catch{/* recent colors remain usable without storage */}listeners.forEach(fn=>fn());}
export function clearRecentColors(){hydrate();cache=[];try{localStorage.removeItem(RECENT_COLORS_KEY);}catch{/* in-memory only */}listeners.forEach(fn=>fn());}
const read=()=>{hydrate();return cache;};
export function useRecentColors(){return useSyncExternalStore(fn=>{listeners.add(fn);const change=(e:StorageEvent)=>{if(e.key===RECENT_COLORS_KEY||e.key===null){cache=parseRecentColors(e.newValue);listeners.forEach(f=>f());}};window.addEventListener('storage',change);return()=>{listeners.delete(fn);window.removeEventListener('storage',change);};},read,()=>cache);}
