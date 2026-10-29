import {assertClipboardCutSafe,CLIPBOARD_LIMIT,makeDesignClipboard,parseDesignClipboard,pasteDesignClipboard} from './clipboard-transfer';
import {exportSvg,importSvg,notifyError} from './files';
import {assetsForUsage,projectFontUsage,registerFonts} from './fonts';
import {blankDocument,node,parseDocument} from './model';
import {drawingDefaults} from './preferences';
import {useEditor} from './store';
import {readClipboardRaster} from './raster-clipboard';

export interface NativeClipboardRead {kind:'nodes'|'svg'|'image'|'text'|'empty';data?:string;}
let localCopy:{raw:string;document:ReturnType<typeof useEditor.getState>['doc']}|undefined;
/** Invoked only by an explicit Copy/Cut command. A failed system write never cuts. */
export async function copyEditorSelection(cut=false,onCut?:()=>void){
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
/** Reads once on explicit Paste. A changed document cancels the pending transfer. */
export async function pasteEditorClipboard(parentId?:string,isCurrentTarget:()=>boolean=()=>true){
 const initial=useEditor.getState();if(typeof window==='undefined'||!window.desktop?.clipboardRead){initial.paste(parentId);return;}
 const content=await window.desktop.clipboardRead(),current=useEditor.getState();if(current.doc!==initial.doc||current.pageId!==initial.pageId||!isCurrentTarget())throw Error('The project changed while reading the clipboard. Paste again.');
 if(content.kind==='empty'){current.set({toast:'The Mac clipboard has no supported layers, SVG, image or text.'});return;}
 if(typeof content.data!=='string'||new TextEncoder().encode(content.data).length>CLIPBOARD_LIMIT)throw Error('Clipboard content exceeds 20 MB.');
 if(content.kind==='svg'){if(parentId)throw Error('SVG clipboard paste is available on the design canvas. Paste there, review the import, then copy its editable layers into your slide.');await importSvg(content.data,'Pasted SVG');return;}
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
