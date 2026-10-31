import {useSyncExternalStore} from 'react';
import type {DesignNode,NodeKind} from './model';

/** User preferences are local to this app/browser origin and never serialized in .oui. */
export interface EditorPreferences {
 uiScale:number;fontPreview:boolean;autosaveIntervalMs:number;recentFileLimit:number;
 exportHiddenLayers:boolean;defaultExportFormat:'svg'|'png'|'jpg';colorPickerFormat:'HEX'|'RGB'|'HSL'|'HSB';duplicateNaming:'preserve'|'copy'|'increment';keyboardZoomSelection:boolean;controlClickContextMenu:boolean;numberKeyOpacity:boolean;smartTextSubstitution:boolean;
 pixelSnapping:'document'|'none'|'pixel'|'half'|'device';objectSnapping:'document'|'on'|'off';vectorGeometrySnapping:'document'|'on'|'off';
 smallNudge:number;largeNudge:number;rotationSnapIncrement:number;
 showFrameNames:boolean;showSectionNames:boolean;showCanvasScrollbars:boolean;showOverviewMinimap:boolean;showSlices:boolean;
 viewportCulling:boolean;highContrastSelection:boolean;keepDrawingTool:boolean;hoverHighlight:boolean;parentHoverOutline:boolean;showSelectionDimensions:boolean;
 wheelZoom:boolean;zoomSensitivity:number;invertZoom:boolean;rightButtonPan:boolean;
 defaultFrameFill:string;defaultShapeFill:string;defaultShapeStrokeEnabled:boolean;
 defaultStrokeColor:string;defaultStrokeWidth:number;defaultTextFill:string;
 defaultFontFamily:string;defaultFontSize:number;defaultFontWeight:number;
 defaultFontStyle:'normal'|'italic';defaultLineHeight:number;
}
export const PREFERENCES_KEY='oui-preferences';
export const defaultPreferences:Readonly<EditorPreferences>=Object.freeze({
 uiScale:1,fontPreview:true,autosaveIntervalMs:600,recentFileLimit:0,exportHiddenLayers:false,defaultExportFormat:'svg',colorPickerFormat:'HEX',duplicateNaming:'preserve',keyboardZoomSelection:false,controlClickContextMenu:true,numberKeyOpacity:true,smartTextSubstitution:false,
 pixelSnapping:'document',objectSnapping:'document',vectorGeometrySnapping:'document',
 smallNudge:1,largeNudge:10,rotationSnapIncrement:15,
 showFrameNames:true,showSectionNames:true,showCanvasScrollbars:false,showOverviewMinimap:false,showSlices:true,
 viewportCulling:true,highContrastSelection:false,keepDrawingTool:false,hoverHighlight:true,parentHoverOutline:false,showSelectionDimensions:true,
 wheelZoom:false,zoomSensitivity:1,invertZoom:false,rightButtonPan:false,
 defaultFrameFill:'#ffffff',defaultShapeFill:'#d8c9f2',defaultShapeStrokeEnabled:false,
 defaultStrokeColor:'#2b2935',defaultStrokeWidth:2,defaultTextFill:'#202027',
 defaultFontFamily:'Inter',defaultFontSize:24,defaultFontWeight:400,
 defaultFontStyle:'normal',defaultLineHeight:1.3,
});
const ranges:Partial<Record<keyof EditorPreferences,readonly[number,number]>>={uiScale:[.85,1.25],autosaveIntervalMs:[100,60000],recentFileLimit:[0,1000],smallNudge:[.01,1000],largeNudge:[.01,10000],rotationSnapIncrement:[.1,180],zoomSensitivity:[.05,5],defaultStrokeWidth:[0,1000],defaultFontSize:[1,1000],defaultFontWeight:[1,1000],defaultLineHeight:[.5,10]};
const colors=new Set(['defaultFrameFill','defaultShapeFill','defaultStrokeColor','defaultTextFill']);
export function validatePreferences(value:unknown):EditorPreferences {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Preferences must be an object.');
 const fields=Object.keys(defaultPreferences) as (keyof EditorPreferences)[],record=value as Record<string,unknown>;
 if(Object.keys(record).some(key=>!Object.hasOwn(defaultPreferences,key))||fields.some(key=>!Object.hasOwn(record,key)))throw Error('Invalid preference fields.');
 const out={} as EditorPreferences;
 for(const key of fields){let v=record[key];const range=ranges[key];
  if(range){if(typeof v!=='number'||!Number.isFinite(v)||v<range[0]||v>range[1])throw Error(`${key} must be between ${range[0]} and ${range[1]}.`);}
  else if(key==='pixelSnapping'){if(!['document','none','pixel','half','device'].includes(v as string))throw Error('Choose document, off, pixels, half pixels or device pixels for local pixel snapping.');}
  else if(key==='objectSnapping'||key==='vectorGeometrySnapping'){if(!['document','on','off'].includes(v as string))throw Error('Choose document, on or off for local snapping.');}
  else if(key==='defaultExportFormat'){if(!['svg','png','jpg'].includes(v as string))throw Error('Choose SVG, PNG or JPG as the default export format.');}
  else if(key==='colorPickerFormat'){if(!['HEX','RGB','HSL','HSB'].includes(v as string))throw Error('Choose HEX, RGB, HSL or HSB as the color picker format.');}
  else if(key==='duplicateNaming'){if(!['preserve','copy','increment'].includes(v as string))throw Error('Choose a valid duplicate naming style.');}
  else if(colors.has(key)){if(typeof v!=='string'||(!/^#[\da-f]{6}$/i.test(v)&&!(['defaultFrameFill','defaultShapeFill'].includes(key)&&v==='none')))throw Error('Choose a valid preference color.');v=v.toLowerCase();}
  else if(key==='defaultFontFamily'){if(typeof v!=='string'||!v.trim()||v.length>512||/[\u0000-\u001f<>]/.test(v))throw Error('Choose a valid default font family.');v=v.trim();}
  else if(key==='defaultFontStyle'){if(v!=='normal'&&v!=='italic')throw Error('Choose normal or italic text.');}
  else if(typeof v!=='boolean')throw Error('Invalid preference toggle.');
  if((key==='autosaveIntervalMs'||key==='recentFileLimit')&&!Number.isSafeInteger(v))throw Error('Use a whole number for recovery interval and recent-file limit.');
  (out as unknown as Record<string,unknown>)[key]=v;
 }
 return out;
}
let cached:Readonly<EditorPreferences>|undefined,lastRaw:string|null|undefined;
const listeners=new Set<()=>void>();
function rawPreferences(){try{return typeof localStorage==='undefined'?null:localStorage.getItem(PREFERENCES_KEY);}catch{return null;}}
export function decodePreferences(raw:string|null):Readonly<EditorPreferences>{if(!raw)return defaultPreferences;try{if(raw.length>16000)return defaultPreferences;const data=JSON.parse(raw);if(!data||data.version!==1)return defaultPreferences;return Object.freeze(validatePreferences({...{pixelSnapping:'document',objectSnapping:'document',vectorGeometrySnapping:'document',viewportCulling:true,highContrastSelection:false,parentHoverOutline:false,uiScale:1,fontPreview:true,autosaveIntervalMs:600,recentFileLimit:0,exportHiddenLayers:false,defaultExportFormat:'svg',colorPickerFormat:'HEX',duplicateNaming:'preserve',keyboardZoomSelection:false,controlClickContextMenu:true,numberKeyOpacity:true,smartTextSubstitution:false,showFrameNames:true,showSectionNames:true,showCanvasScrollbars:false,showOverviewMinimap:false,showSlices:true},...data.values}));}catch{return defaultPreferences;}}
export function getPreferences():Readonly<EditorPreferences>{const raw=rawPreferences();if(!cached||raw!==lastRaw){lastRaw=raw;cached=decodePreferences(raw);}return cached;}
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
 if(type==='code')return {stroke:'',strokeWidth:0};
 const line=['path','line','arrow'].includes(type),fill=['frame','component','section'].includes(type)?prefs.defaultFrameFill:line?'none':prefs.defaultShapeFill;
 return {fill,stroke:line||prefs.defaultShapeStrokeEnabled?prefs.defaultStrokeColor:'',strokeWidth:prefs.defaultStrokeWidth};
}
