import {captureColorContext,sameColorContext} from './color-edit-context';
import {useEditor} from './store';
import {createFromTemplate,insertTemplatePage} from './templates';
import type {DesignDocument} from './model';
import {openDocumentForEditing,saveDocument} from './repository';
import {desktopDocuments} from './desktop-lifecycle';
export function captureTemplateAction(){const origin=captureColorContext(useEditor.getState()),controller=new AbortController();let valid=(origin.modal==='templates'||origin.modal==='resource-library')&&!origin.uiHidden&&!origin.motionOpen;
 if(!valid)throw Error('Open the template gallery with Motion closed.');const stop=useEditor.subscribe(live=>{if(!sameColorContext(origin,live)){valid=false;controller.abort();}});
 return {origin,signal:controller.signal,check(){const live=useEditor.getState();if(!valid||!sameColorContext(origin,live))throw Error('The template target changed. Reopen the gallery and retry.');return live;},dispose(){valid=false;controller.abort();stop();}};}
export type TemplateAction=ReturnType<typeof captureTemplateAction>;
export function insertTemplate(proof:TemplateAction,source:DesignDocument,pageId:string){const live=proof.check();if(live.home||live.mode!=='design')throw Error('Insert templates from the editable Design or Whiteboard canvas.');const result=insertTemplatePage(live.doc,live.pageId,source,pageId);proof.check();live.edit(d=>Object.assign(d,result.document));const next=useEditor.getState();next.set({selection:result.roots,modal:null,tool:'move',vectorEditId:null,vectorSelection:[],toast:result.warnings.join(' ')});next.findSelection();}
export async function openTemplate(proof:TemplateAction,source:DesignDocument,name:string){const before=proof.check(),doc=createFromTemplate(source,name);
 // A new native window preserves this window's unsaved state and uses existing IPC.
 if(typeof window!=='undefined'&&window.desktop?.openDocument){proof.check();if(!await window.desktop.openDocument(JSON.stringify(doc)))throw Error('The new template window could not be opened.');proof.check().set({modal:null,toast:'Template opened in a new window'});return;}
 const mustRetain=desktopDocuments.state(before.doc).dirty||before.past.length>0&&before.savedAt!==before.doc.updatedAt;
 try{const retained=await saveDocument(before.doc,proof.signal);if(!retained&&mustRetain)throw Error('The current edited project cannot be retained.');}catch(e){proof.signal.throwIfAborted();if(mustRetain)throw Error('Save a .oui backup of the current edits before creating another file.',{cause:e});}
 proof.check();const opened=await openDocumentForEditing(doc,proof.signal);proof.check();proof.dispose();desktopDocuments.mark(opened.document,true);useEditor.getState().load(opened.document);useEditor.getState().set({modal:null,...(opened.warning?{toast:opened.warning,recoveryAt:''}:{toast:'New editable project created from template'})});
 const current=useEditor.getState();current.fit();
}
