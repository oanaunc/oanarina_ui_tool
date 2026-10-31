import {desktopDocuments,desktopDocumentState,reportDesktopDocument,setDesktopMenuProvider} from './desktop-lifecycle';
import type {DesktopMenuState} from './desktop-lifecycle';
import {exportNodes,exportSvg} from './files';
import {parseDocument} from './model';
import {renderClipboardPng} from './png-clipboard';
import {getPreferences,subscribePreferences} from './preferences';
import type {EditorPreferences} from './preferences';
import type {SlideDocument} from './slides';
import {useEditor} from './store';
import {dragAssetName} from './drag-asset';
import {receiveScreenColor} from './screen-color';
import {visualBounds} from './transforms';

export type ExternalReload='reloaded'|'dirty'|'busy'|'invalid';
export const LIVE_ARTWORK_SIDE=4096;
type EditorState=ReturnType<typeof useEditor.getState>;
/** Only state already visible in the editor UI; the shell uses it to enable and check its menu items. */
export function desktopMenuState(s:Pick<EditorState,'past'|'future'|'selection'|'grid'|'snap'|'rulers'|'outlines'|'home'>,p:Pick<EditorPreferences,'showFrameNames'|'showSectionNames'|'showCanvasScrollbars'|'showOverviewMinimap'>,editing:boolean):DesktopMenuState{
 const checks:[string,boolean][]=[['grid',s.grid],['snap',s.snap],['rulers',s.rulers],['outlines',s.outlines],['frame-names',p.showFrameNames],['section-names',p.showSectionNames],['canvas-scrollbars',p.showCanvasScrollbars],['overview-minimap',p.showOverviewMinimap]];
 return {undo:s.past.length>0,redo:s.future.length>0,selection:!s.home&&s.selection.length>0,editing,checked:checks.filter(c=>c[1]).map(c=>c[0])};
}
/** Longest side capped, never upscaled; an empty area has no artwork. */
export function liveArtworkSize(width:number,height:number){if(![width,height].every(v=>Number.isFinite(v)&&v>0))return undefined;const scale=Math.min(1,LIVE_ARTWORK_SIDE/Math.max(width,height)),w=Math.max(1,Math.ceil(width*scale)),h=Math.max(1,Math.ceil(height*scale));return w*h>16_000_000?undefined:{width:w,height:h};}
export function bytesToBase64(bytes:Uint8Array){let text='';for(let i=0;i<bytes.length;i+=32_768)text+=String.fromCharCode(...bytes.subarray(i,i+32_768));return btoa(text);}
const safeName=(name:string,extension:string)=>(name.replace(/[^\p{L}\p{N} ._-]/gu,'').trim().slice(0,80)||'Forma')+'.'+extension;
let pointerDown=false;
const editingFocus=()=>typeof document!=='undefined'&&!!(document.activeElement as Element|null)?.closest?.('input,textarea,[contenteditable=true]');
/** Clean windows follow their saved file. Never replaces unsaved work or an interaction in progress:
 * the shell retries 'busy' and leaves 'dirty' to the existing Save conflict decision. */
export async function reloadExternalDocument(raw:string):Promise<ExternalReload>{
 const before=useEditor.getState();if(desktopDocumentState().dirty)return 'dirty';if(before.home||before.motionOpen||before.modal||pointerDown||editingFocus())return 'busy';
 let incoming;try{incoming=parseDocument(raw);}catch{return 'invalid';}if(incoming.id!==before.doc.id)return 'invalid';
 const selection=before.selection;try{before.restoreVersion(incoming);}catch{return 'invalid';}
 const s=useEditor.getState(),page=s.doc.pages.find(p=>p.id===s.pageId);desktopDocuments.mark(s.doc);s.set({selection:selection.filter(id=>page?.nodes.some(n=>n.id===id)),toast:'Saved file changed outside Forma and was reloaded. Undo is available.'});await reportDesktopDocument();return 'reloaded';
}
/** A macOS file version replaces this window's content as one undoable, unsaved edit. */
export function restoreSavedVersion(raw:string){const s=useEditor.getState();if(s.home||s.motionOpen)throw Error('Close Motion and open the file before restoring a version.');s.restoreVersion(parseDocument(raw));useEditor.getState().set({toast:'macOS version restored. Undo is available; Save keeps it.'});return true;}
/** Reverting makes the window equal the saved file again, so it is clean; Undo returns to the discarded edits. */
export async function revertToSavedFile(raw:string){restoreSavedVersion(raw);const s=useEditor.getState();desktopDocuments.mark(s.doc);s.set({toast:'Reverted to the saved file. Undo is available.'});await reportDesktopDocument();return true;}
let cachedArtwork:{key:string;value:unknown}|undefined;
async function liveArtwork(s:EditorState){
 const key=[desktopDocumentState().revision,s.pageId,s.selection.join('\0')].join('\u0001');if(cachedArtwork?.key===key)return cachedArtwork.value;
 let value:unknown=null;try{const nodes=exportNodes(),bounds=visualBounds(nodes),size=nodes.length?liveArtworkSize(bounds.width,bounds.height):undefined;if(size){const data=await renderClipboardPng(exportSvg(nodes),size),current=useEditor.getState();if(current.doc===s.doc&&current.pageId===s.pageId&&current.selection===s.selection)value={...size,scope:s.selection.length?'selection':'page',data:data.slice('data:image/png;base64,'.length)};else return null;}}catch{value=null;}
 cachedArtwork={key,value};return value;
}
/** Answers a shell pull. `previous` lets an unchanged editor skip all rendering. */
export async function desktopLiveContext(previous:string){
 const s=useEditor.getState(),state=desktopDocumentState(),page=s.doc.pages.find(p=>p.id===s.pageId);if(!page||s.home)return null;
 const key=[state.revision,s.pageId,s.selection.join('\0'),s.zoom,s.pan.x,s.pan.y,s.modal??''].join('\u0001');if(key===previous)return {unchanged:true};
 return {key,documentId:state.id,documentName:state.name,dirty:state.dirty,pageId:page.id,pageName:page.name,selection:s.selection.slice(0,5000),viewport:{zoom:s.zoom,panX:s.pan.x,panY:s.pan.y},artwork:await liveArtwork(s)};
}
/** Print and Share reuse the editor's own PDF/PNG delivery paths; the shell supplies only the system UI. */
export async function desktopDelivery(kind:'print'|'share'){
 const s=useEditor.getState();if(s.home)throw Error('Open a project first.');
 if(s.doc.workspace==='slides'){const {exportSlidePdf}=await import('./slides-export');return {name:safeName(s.doc.name,'pdf'),mime:'application/pdf',data:bytesToBase64(await exportSlidePdf(s.doc as SlideDocument))};}
 if(kind==='share'&&s.selection.length){const nodes=exportNodes(),bounds=visualBounds(nodes),{pngClipboardDimensions}=await import('./png-clipboard'),data=await renderClipboardPng(exportSvg(nodes),pngClipboardDimensions(bounds.width,bounds.height));return {name:safeName(s.doc.name,'png'),mime:'image/png',data:data.slice('data:image/png;base64,'.length)};}
 const {prepareDesignPdf,renderDesignPdf}=await import('./design-pdf'),base={scale:2,includeHidden:false,includeGuides:false,includeOverlaps:false,vector:true,embedAssets:true};let source;
 if(s.selection.length)source=prepareDesignPdf({...base,mode:'artwork'});else try{source=prepareDesignPdf({...base,mode:'page-frames'});}catch{source=prepareDesignPdf({...base,mode:'artwork'});}
 return {name:safeName(s.doc.name,'pdf'),mime:'application/pdf',data:bytesToBase64(await renderDesignPdf(source))};
}
/** Shell-initiated calls only. No renderer-to-shell message type is added by any of these. */
export function installDesktopNative(onFonts:(families:string[])=>void){
 if(typeof window==='undefined'||!window.desktop?.onNative)return ()=>{};
 const desktop=window.desktop,off=desktop.onNative!(async(name,value)=>{
  if(name==='external-document'&&typeof value==='string')return reloadExternalDocument(value);
  if(name==='restore-version'&&typeof value==='string')return restoreSavedVersion(value);
  if(name==='revert'&&typeof value==='string')return revertToSavedFile(value);
  if(name==='external-notice'&&typeof value==='string'&&value.length<=300){useEditor.getState().set({toast:value});return true;}
  if(name==='live-context'&&typeof value==='string')return desktopLiveContext(value);
  if(name==='delivery'&&(value==='print'||value==='share'))return desktopDelivery(value);
  if(name==='drag-asset-name')return dragAssetName();
  if(name==='screen-color')return receiveScreenColor(value);
  if(name==='fonts-changed'){const families=await desktop.fonts?.()??[];onFonts(families);useEditor.getState().refreshFonts();window.dispatchEvent(new Event('oanarina-fonts-changed'));window.dispatchEvent(new Event('oanarina-system-fonts-changed'));return families.length;}
  throw Error('Unsupported native request.');
 });
 let last='';const menu=()=>desktopMenuState(useEditor.getState(),getPreferences(),editingFocus()),changed=()=>{const next=JSON.stringify(menu());if(next!==last){last=next;void reportDesktopDocument().catch(()=>{});}};
 setDesktopMenuProvider(menu);const down=()=>{pointerDown=true;},up=()=>{pointerDown=false;},offStore=useEditor.subscribe(changed),offPreferences=subscribePreferences(changed);
 window.addEventListener('pointerdown',down,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);document.addEventListener('focusin',changed);document.addEventListener('focusout',changed);changed();
 return ()=>{off();setDesktopMenuProvider(undefined);offStore();offPreferences();window.removeEventListener('pointerdown',down,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);document.removeEventListener('focusin',changed);document.removeEventListener('focusout',changed);};
}
