import {assertClipboardCutSafe,CLIPBOARD_LIMIT,makeDesignClipboard,parseDesignClipboard,pasteDesignClipboard} from './clipboard-transfer';
import {exportNodes,exportSvg,importSvg,notifyError} from './files';
import {assetsForUsage,projectFontUsage,registerFonts} from './fonts';
import {blankDocument,node,parseDocument} from './model';
import {drawingDefaults} from './preferences';
import {useEditor} from './store';
import {readClipboardRaster} from './raster-clipboard';
import {pngClipboardDimensions,renderClipboardPng} from './png-clipboard';
import {visualBounds} from './transforms';
import {isSvgMarkup} from './clipboard-svg';
import {figClipboardRoots,figmaClipboardBytes,isFigmaClipboardHtml} from './fig-clipboard';
import {importFigBytes} from './fig-import';
import {beginImportSession} from './import-session';

export interface NativeClipboardRead {kind:'nodes'|'svg'|'image'|'text'|'figma'|'empty';data?:string;}
let localCopy:{raw:string;document:ReturnType<typeof useEditor.getState>['doc']}|undefined;
let pngGeneration=0;
/** Read-only raster copy; a stale task must never consume a newer copy grant. */
export async function copyEditorSelectionAsPng(){
 const generation=++pngGeneration,before=useEditor.getState(),doc=before.doc,pageId=before.pageId,selection=before.selection.join('\0'),time=before.motionTime,motion=before.motionOpen;
 if(!before.selection.length){before.set({toast:'Select artwork to copy as PNG.'});return false;}
 if(typeof window==='undefined'||!window.desktop?.clipboardWrite){before.set({toast:'Copy as PNG is available in the Mac app. Use PNG export in the browser.'});return false;}
 const nodes=exportNodes();if(!nodes.length)throw Error('Select artwork to copy as PNG.');
 const bounds=visualBounds(nodes),size=pngClipboardDimensions(bounds.width,bounds.height),svg=exportSvg(nodes);
 let editingFocused=false;
 const onFocus=(event:FocusEvent)=>{if(event.target instanceof Element&&event.target.closest('input,textarea,[contenteditable=true]'))editingFocused=true;};
 document.addEventListener('focusin',onFocus,true);
 try{
  const png=await renderClipboardPng(svg,size),current=useEditor.getState();
  if(editingFocused||generation!==pngGeneration||current.doc!==doc||current.pageId!==pageId||current.selection.join('\0')!==selection||current.motionOpen!==motion||current.motionTime!==time){current.set({toast:'PNG copy cancelled because the project, selection, animation or editing focus changed. Copy again.'});return false;}
  const written=await window.desktop.clipboardWrite({png});
  useEditor.getState().set({toast:written?'Selection copied as PNG to the Mac clipboard.':'The Mac clipboard was not updated.'});return written;
 }finally{document.removeEventListener('focusin',onFocus,true);}
}
/** Invoked only by an explicit Copy/Cut command. A failed system write never cuts. */
export async function copyEditorSelection(cut=false,onCut?:()=>void){
 pngGeneration++;
 const before=useEditor.getState(),doc=before.doc,pageId=before.pageId,selection=before.selection.join('\0');
 if(!before.selection.length)return false;
 if(typeof window==='undefined'||!window.desktop?.clipboardWrite){before.copy();if(cut)(onCut??before.remove)();return true;}
 if(cut)assertClipboardCutSafe(doc,pageId,before.selection);
 const payload=makeDesignClipboard(doc,pageId,before.selection);payload.project.fonts=assetsForUsage(projectFontUsage(payload.project),payload.project.fonts);
 const raw=JSON.stringify(payload);parseDesignClipboard(raw);const nodes=payload.project.pages[0].nodes,svg=exportSvg(nodes),text=nodes.filter(n=>n.type==='text').map(n=>n.text).join('\n');
 if(new TextEncoder().encode(raw+svg+text).length>CLIPBOARD_LIMIT)throw Error('Clipboard representations exceed 20 MB. Copy fewer layers or use a .oui project.');
 const written=await window.desktop.clipboardWrite({nodes:raw,svg,text});if(!written){useEditor.getState().set({toast:'The Mac clipboard was not updated. No layers were cut.'});return false;}
 const current=useEditor.getState();if(current.doc!==doc||current.pageId!==pageId||current.selection.join('\0')!==selection){current.set({toast:'Selection copied. The editor changed, so Cut was cancelled.'});return true;}
 localCopy={raw,document:doc};current.copy();if(cut)(onCut??current.remove)();current.set({toast:cut?'Selection cut to the Mac clipboard.':'Selection copied to the Mac clipboard.'});return true;
}
/** Conversion runs in the owned .fig worker behind the import panel's Cancel, and nothing reaches the document until the whole paste validates. */
export async function pasteFigmaClipboard(html:string,parentId?:string,isCurrentTarget:()=>boolean=()=>true){
 const session=beginImportSession('fig',1,html.length),{task}=session;
 try{
  const bytes=figmaClipboardBytes(html);task.update({stage:'decoding',bytes:html.length});
  const result=await importFigBytes(bytes,'Pasted from Figma',task.signal,(stage,layers)=>task.update({stage,layers}),true);session.check();if(!isCurrentTarget())throw new DOMException('Import target changed.','AbortError');
  const roots=figClipboardRoots(result.document);if(!roots)throw new Error('The Figma clipboard has no layers Forma can paste.');
  const payload=makeDesignClipboard(result.document,roots.pageId,roots.roots);payload.project.fonts=assetsForUsage(projectFontUsage(payload.project),payload.project.fonts);
  const live=session.check(),candidate=structuredClone(live.doc),ids=pasteDesignClipboard(candidate,live.pageId,payload,parentId,false);parseDocument(JSON.stringify(candidate));
  session.dispose();task.finish();live.edit(d=>{Object.assign(d,candidate);});
  const reduced=result.issues.length,first=result.issues[0]?.message;live.set({selection:ids,toast:'Layers pasted from Figma. Undo is available.'+(reduced?` ${reduced} reduction${reduced===1?'':'s'}${first?`, first: ${first}`:''}`:'')});
 }catch(error){const reason=task.fail(error);if(!task.signal.aborted)throw new Error(reason??'The Figma paste could not finish.');}finally{session.dispose();}
}
/** Reads once on explicit Paste. A changed document cancels the pending transfer. */
export async function pasteEditorClipboard(parentId?:string,isCurrentTarget:()=>boolean=()=>true){
 pngGeneration++;
 const initial=useEditor.getState();if(typeof window==='undefined'||!window.desktop?.clipboardRead){initial.paste(parentId);return;}
 const content=await window.desktop.clipboardRead(),current=useEditor.getState();if(current.doc!==initial.doc||current.pageId!==initial.pageId||!isCurrentTarget())throw Error('The project changed while reading the clipboard. Paste again.');
 if(content.kind==='empty'){current.set({toast:'The Mac clipboard has no supported layers, SVG, image or text.'});return;}
 if(typeof content.data!=='string'||new TextEncoder().encode(content.data).length>CLIPBOARD_LIMIT)throw Error('Clipboard content exceeds 20 MB.');
 if(content.kind==='figma'||content.kind==='text'&&isFigmaClipboardHtml(content.data))return pasteFigmaClipboard(content.data,parentId,isCurrentTarget);
 if(content.kind==='svg'||content.kind==='text'&&isSvgMarkup(content.data)){if(parentId)throw Error('SVG clipboard paste is available on the design canvas. Paste there, review the import, then copy its editable layers into your slide.');await importSvg(content.data,'Pasted SVG');return;}
 if(content.kind!=='nodes'&&content.kind!=='text'&&content.kind!=='image')throw Error('Unsupported clipboard content.');
 let payload;
 if(content.kind==='image'){
  const raster=await readClipboardRaster(content.data);
  if(useEditor.getState().doc!==initial.doc||useEditor.getState().pageId!==initial.pageId||!isCurrentTarget())throw Error('The project changed while decoding the clipboard image. Paste again.');
  const document=blankDocument(),image=node('image',{...raster,name:'Pasted image',x:parentId?0:Math.max(-999000,Math.min(999000,(200-current.pan.x)/current.zoom)),y:parentId?0:Math.max(-999000,Math.min(999000,(200-current.pan.y)/current.zoom))});document.pages[0].nodes.push(image);payload=makeDesignClipboard(document,document.pages[0].id,[image.id]);
 }else if(content.kind==='text'){if(content.data.length>100000)throw Error('Paste text in sections of at most 100,000 characters.');const document=blankDocument(),text=node('text',{...drawingDefaults('text'),name:content.data.slice(0,60)||'Pasted text',text:content.data,x:parentId?0:Math.max(-999000,Math.min(999000,(200-current.pan.x)/current.zoom)),y:parentId?0:Math.max(-999000,Math.min(999000,(200-current.pan.y)/current.zoom)),textResize:'auto-height',width:320,height:100});document.pages[0].nodes.push(text);payload=makeDesignClipboard(document,document.pages[0].id,[text.id]);}else payload=parseDesignClipboard(content.data);
 const proven=content.kind==='nodes'&&localCopy?.raw===content.data&&(current.doc===localCopy.document||current.past.includes(localCopy.document)||current.future.includes(localCopy.document));
 const candidate=structuredClone(current.doc),ids=pasteDesignClipboard(candidate,current.pageId,payload,parentId,proven);parseDocument(JSON.stringify(candidate));
 current.edit(d=>{Object.assign(d,candidate);});current.set({selection:ids,toast:['Layers pasted. Undo is available.',...payload.warnings].join(' ')});
 const committed=useEditor.getState().doc;try{await registerFonts(payload.project.fonts??[]);if(useEditor.getState().doc===committed)useEditor.getState().refreshFonts();}catch(error){notifyError(error);}
}

/** Copies a captured visual selection as SVG and plain XML, retaining Mac editable paste data. */
export async function copyEditorSelectionAsSvg(){
 const generation=++pngGeneration,before=useEditor.getState();
 if(!before.selection.length)throw Error('Select artwork to copy as SVG.');
 const svg=exportSvg(exportNodes());let written:boolean;
 if(typeof window!=='undefined'&&window.desktop?.clipboardWrite){
  const payload=makeDesignClipboard(before.doc,before.pageId,before.selection);payload.project.fonts=assetsForUsage(projectFontUsage(payload.project),payload.project.fonts);
  const raw=JSON.stringify(payload);parseDesignClipboard(raw);
  if(new TextEncoder().encode(raw+svg+svg).length>CLIPBOARD_LIMIT)throw Error('Clipboard representations exceed 20 MB. Copy fewer layers.');
  written=await window.desktop.clipboardWrite({nodes:raw,svg,text:svg});
  const current=useEditor.getState();if(written&&generation===pngGeneration&&current.doc===before.doc&&current.pageId===before.pageId&&current.selection.join('\0')===before.selection.join('\0'))localCopy={raw,document:before.doc};
 }else{
  if(typeof navigator==='undefined'||!navigator.clipboard?.writeText)throw Error('SVG clipboard access is unavailable. Export SVG instead.');
  if(new TextEncoder().encode(svg).length>CLIPBOARD_LIMIT)throw Error('SVG clipboard content exceeds 20 MB.');
  await navigator.clipboard.writeText(svg);written=true;
 }
 if(generation===pngGeneration)useEditor.getState().set({toast:written?'Selection copied as SVG markup.':'The clipboard was not updated.'});return written;
}
