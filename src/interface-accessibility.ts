import {useSyncExternalStore} from 'react';

/** Accent and contrast are device preferences, outside .oui, and never touch artwork colors. */
export const INTERFACE_ACCENTS=['forma','blue','purple','pink','red','orange','green','graphite'] as const;
export type InterfaceAccent=typeof INTERFACE_ACCENTS[number];
export type InterfaceAccentChoice=InterfaceAccent|'system';
export type InterfaceContrast='system'|'more'|'standard';
export const INTERFACE_ACCENT_KEY='oui-interface-accent';
export const INTERFACE_CONTRAST_KEY='oui-interface-contrast';
const listeners=new Set<()=>void>();
export function parseInterfaceAccent(raw:unknown):InterfaceAccentChoice{return raw==='system'||INTERFACE_ACCENTS.includes(raw as InterfaceAccent)?raw as InterfaceAccentChoice:'forma';}
export function parseInterfaceContrast(raw:unknown):InterfaceContrast{return raw==='more'||raw==='standard'?raw:'system';}
export function resolvedInterfaceContrast(choice:InterfaceContrast,systemMore:boolean){return choice==='system'?systemMore:choice==='more';}
function read(key:string){try{return typeof localStorage==='undefined'?null:localStorage.getItem(key);}catch{return null;}}
export function getInterfaceAccent(){return parseInterfaceAccent(read(INTERFACE_ACCENT_KEY));}
export function getInterfaceContrast(){return parseInterfaceContrast(read(INTERFACE_CONTRAST_KEY));}
function emit(){for(const listener of [...listeners])listener();}
function storage(e:StorageEvent){if(e.key===INTERFACE_ACCENT_KEY||e.key===INTERFACE_CONTRAST_KEY||e.key===null)emit();}
function subscribe(listener:()=>void){if(!listeners.size&&typeof window!=='undefined')window.addEventListener('storage',storage);listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',storage);};}
export function useInterfaceAccent(){return useSyncExternalStore(subscribe,getInterfaceAccent,()=>'forma' as InterfaceAccentChoice);}
export function useInterfaceContrast(){return useSyncExternalStore(subscribe,getInterfaceContrast,()=>'system' as const);}
/** Persist first: a failed write never advertises a saved local override. */
export function updateInterfaceAccent(accent:InterfaceAccentChoice){if(accent!=='system'&&!INTERFACE_ACCENTS.includes(accent))throw Error('Choose a valid accent color.');try{localStorage.setItem(INTERFACE_ACCENT_KEY,accent);}catch{throw Error('Accent color could not be saved. Allow local storage or free some storage space.');}emit();}
export function updateInterfaceContrast(choice:InterfaceContrast){if(!['system','more','standard'].includes(choice))throw Error('Choose a valid contrast preference.');try{localStorage.setItem(INTERFACE_CONTRAST_KEY,choice);}catch{throw Error('Contrast preference could not be saved. Allow local storage or free some storage space.');}emit();}
export function resetInterfaceAccessibility(){try{localStorage.removeItem(INTERFACE_ACCENT_KEY);localStorage.removeItem(INTERFACE_CONTRAST_KEY);}catch{throw Error('Accent and contrast could not be reset. Allow local storage or free some storage space.');}emit();}
const channel=(v:number)=>{const c=v/255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4;};
const luminance=(hex:string)=>{const n=parseInt(hex.slice(1),16);return .2126*channel(n>>16&255)+.7152*channel(n>>8&255)+.0722*channel(n&255);};
export const contrastRatio=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const mix=(hex:string,target:number,amount:number)=>{const n=parseInt(hex.slice(1),16),step=(v:number)=>Math.round(v+(target-v)*amount).toString(16).padStart(2,'0');return '#'+step(n>>16&255)+step(n>>8&255)+step(n&255);};
/** Lightest and darkest interface surfaces of each theme: the system color moves toward white or black until it clears 4.5:1 on all of them. */
const SURFACES={dark:['#2c2b30','#343338','#242328'],light:['#ffffff','#f4f2f6','#e9e7ec']};
export function systemAccentTokens(hex:string){
 const shade=(surfaces:string[],target:number)=>{for(let i=0;i<=20;i++){const color=mix(hex,target,i/20);if(surfaces.every(s=>contrastRatio(color,s)>=4.5))return color;}return target?'#ffffff':'#000000';},on=(color:string)=>contrastRatio(color,'#ffffff')>=4.5?'#ffffff':'#101014',dark=shade(SURFACES.dark,255),light=shade(SURFACES.light,0);
 return {dark,onDark:on(dark),light,onLight:on(light)};
}
let systemAccent='';
/** Pushed by the Mac shell with the macOS accent. Anything else is refused, and the browser never receives it. */
export function setSystemAccent(value:unknown){if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw Error('Invalid system accent.');systemAccent=value.toLowerCase();emit();return true;}
export const systemAccentAvailable=()=>Boolean(systemAccent);
/** No document state is read or changed; both attributes only select CSS tokens on the root element. */
export function watchInterfaceAccessibility(root:HTMLElement=document.documentElement){
 let media:MediaQueryList|null=null;try{if(typeof window.matchMedia==='function')media=window.matchMedia('(prefers-contrast: more)');}catch{/* Unsupported system query keeps standard contrast. */}
 const refresh=()=>{const accent=getInterfaceAccent();if(accent==='forma'||accent==='system'&&!systemAccent)root.removeAttribute('data-accent');else root.setAttribute('data-accent',accent);if(accent==='system'&&systemAccent){const tokens=systemAccentTokens(systemAccent);for(const [name,value] of Object.entries(tokens))root.style.setProperty('--system-accent-'+name.toLowerCase(),value);}if(resolvedInterfaceContrast(getInterfaceContrast(),media?.matches??false))root.setAttribute('data-contrast','more');else root.removeAttribute('data-contrast');},off=subscribe(refresh);
 media?.addEventListener?.('change',refresh);refresh();
 return()=>{off();media?.removeEventListener?.('change',refresh);root.removeAttribute('data-accent');root.removeAttribute('data-contrast');};
}
