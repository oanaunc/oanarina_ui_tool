import {useSyncExternalStore} from 'react';
import type {DesignNode,NodeKind} from './model';

/** User preferences are local to this app/browser origin and never serialized in .oui. */
export interface EditorPreferences {
 smallNudge:number;largeNudge:number;rotationSnapIncrement:number;
 showFrameNames:boolean;showSectionNames:boolean;showCanvasScrollbars:boolean;showOverviewMinimap:boolean;
 keepDrawingTool:boolean;hoverHighlight:boolean;showSelectionDimensions:boolean;
 wheelZoom:boolean;zoomSensitivity:number;invertZoom:boolean;rightButtonPan:boolean;
 defaultFrameFill:string;defaultShapeFill:string;defaultShapeStrokeEnabled:boolean;
 defaultStrokeColor:string;defaultStrokeWidth:number;defaultTextFill:string;
 defaultFontFamily:string;defaultFontSize:number;defaultFontWeight:number;
 defaultFontStyle:'normal'|'italic';defaultLineHeight:number;
}
export const PREFERENCES_KEY='oui-preferences';
export const defaultPreferences:Readonly<EditorPreferences>=Object.freeze({
 smallNudge:1,largeNudge:10,rotationSnapIncrement:15,
 showFrameNames:true,showSectionNames:true,showCanvasScrollbars:false,showOverviewMinimap:false,
 keepDrawingTool:false,hoverHighlight:true,showSelectionDimensions:true,
 wheelZoom:false,zoomSensitivity:1,invertZoom:false,rightButtonPan:false,
 defaultFrameFill:'#ffffff',defaultShapeFill:'#d8c9f2',defaultShapeStrokeEnabled:false,
 defaultStrokeColor:'#2b2935',defaultStrokeWidth:2,defaultTextFill:'#202027',
 defaultFontFamily:'Inter',defaultFontSize:24,defaultFontWeight:400,
 defaultFontStyle:'normal',defaultLineHeight:1.3,
});
const ranges:Partial<Record<keyof EditorPreferences,readonly[number,number]>>={smallNudge:[.01,1000],largeNudge:[.01,10000],rotationSnapIncrement:[.1,180],zoomSensitivity:[.05,5],defaultStrokeWidth:[0,1000],defaultFontSize:[1,1000],defaultFontWeight:[1,1000],defaultLineHeight:[.5,10]};
const colors=new Set(['defaultFrameFill','defaultShapeFill','defaultStrokeColor','defaultTextFill']);
export function validatePreferences(value:unknown):EditorPreferences {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Preferences must be an object.');
 const fields=Object.keys(defaultPreferences) as (keyof EditorPreferences)[],record=value as Record<string,unknown>;
 if(Object.keys(record).some(key=>!Object.hasOwn(defaultPreferences,key))||fields.some(key=>!Object.hasOwn(record,key)))throw Error('Invalid preference fields.');
 const out={} as EditorPreferences;
 for(const key of fields){let v=record[key];const range=ranges[key];
  if(range){if(typeof v!=='number'||!Number.isFinite(v)||v<range[0]||v>range[1])throw Error(`${key} must be between ${range[0]} and ${range[1]}.`);}
  else if(colors.has(key)){if(typeof v!=='string'||(!/^#[\da-f]{6}$/i.test(v)&&!(['defaultFrameFill','defaultShapeFill'].includes(key)&&v==='none')))throw Error('Choose a valid preference color.');v=v.toLowerCase();}
  else if(key==='defaultFontFamily'){if(typeof v!=='string'||!v.trim()||v.length>512||/[\u0000-\u001f<>]/.test(v))throw Error('Choose a valid default font family.');v=v.trim();}
  else if(key==='defaultFontStyle'){if(v!=='normal'&&v!=='italic')throw Error('Choose normal or italic text.');}
  else if(typeof v!=='boolean')throw Error('Invalid preference toggle.');
  (out as unknown as Record<string,unknown>)[key]=v;
 }
 return out;
}
let cached:Readonly<EditorPreferences>|undefined,lastRaw:string|null|undefined;
const listeners=new Set<()=>void>();
function rawPreferences(){try{return typeof localStorage==='undefined'?null:localStorage.getItem(PREFERENCES_KEY);}catch{return null;}}
function decode(raw:string|null):Readonly<EditorPreferences>{if(!raw)return defaultPreferences;try{if(raw.length>16000)return defaultPreferences;const data=JSON.parse(raw);if(!data||data.version!==1)return defaultPreferences;return Object.freeze(validatePreferences({...{showFrameNames:true,showSectionNames:true,showCanvasScrollbars:false,showOverviewMinimap:false},...data.values}));}catch{return defaultPreferences;}}
export function getPreferences():Readonly<EditorPreferences>{const raw=rawPreferences();if(!cached||raw!==lastRaw){lastRaw=raw;cached=decode(raw);}return cached;}
function emit(){for(const listener of [...listeners])listener();}
/** Re-read local storage, including changes made by another app window. */
export function reloadPreferences(){const previous=cached;getPreferences();if(previous!==cached)emit();return getPreferences();}
function onStorage(e:StorageEvent){if(e.key===PREFERENCES_KEY||e.key===null)reloadPreferences();}
export function subscribePreferences(listener:()=>void){if(!listeners.size&&typeof window!=='undefined')window.addEventListener('storage',onStorage);listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',onStorage);};}
export function usePreferences(){return useSyncExternalStore(subscribePreferences,getPreferences,()=>defaultPreferences);}
/** Validate and persist first; blocked/quota-limited storage never silently claims success. */
export function updatePreferences(patch:Partial<EditorPreferences>):Readonly<EditorPreferences>{
 if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(key=>!Object.hasOwn(defaultPreferences,key)))throw Error('Invalid preference update.');
 const next=Object.freeze(validatePreferences({...getPreferences(),...patch}));
 const raw=JSON.stringify({version:1,values:next});if(raw===rawPreferences())return getPreferences();try{if(typeof localStorage==='undefined')throw Error();localStorage.setItem(PREFERENCES_KEY,raw);}catch{throw Error('Preferences could not be saved. Allow local storage or free some storage space.');}
 lastRaw=raw;cached=next;emit();return next;
}
export function resetPreferences():Readonly<EditorPreferences>{try{if(typeof localStorage==='undefined')throw Error();localStorage.removeItem(PREFERENCES_KEY);}catch{throw Error('Preferences could not be reset. Allow local storage or free some storage space.');}lastRaw=null;cached=defaultPreferences;emit();return defaultPreferences;}
/** Creation defaults for caller-owned insertion paths; never changes existing document nodes. */
export function drawingDefaults(type:NodeKind,prefs:Readonly<EditorPreferences>=getPreferences()):Partial<DesignNode>{
 if(type==='text')return {fill:prefs.defaultTextFill,fontFamily:prefs.defaultFontFamily,fontSize:prefs.defaultFontSize,fontWeight:prefs.defaultFontWeight,fontStyle:prefs.defaultFontStyle,lineHeight:prefs.defaultLineHeight,stroke:'',strokeWidth:prefs.defaultStrokeWidth};
 const line=['path','line','arrow'].includes(type),fill=['frame','component','section'].includes(type)?prefs.defaultFrameFill:line?'none':prefs.defaultShapeFill;
 return {fill,stroke:line||prefs.defaultShapeStrokeEnabled?prefs.defaultStrokeColor:'',strokeWidth:prefs.defaultStrokeWidth};
}
