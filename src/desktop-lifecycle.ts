import type {DesignDocument} from './model';
import {useEditor} from './store';
export interface DesktopDocumentState {id:string;name:string;revision:number;dirty:boolean;}
export interface DesktopBootstrap {kind:'new'|'file'|'recovery';command?:string;raw?:string;documentId?:string;restoreActive?:boolean;dirty?:boolean;explicitOpen?:boolean;}
/** One tracker per renderer. Timestamps do not turn undo-to-saved content dirty. */
export class DesktopDocumentTracker {
 private baseline=new Map<string,{content:string;dirty:boolean}>();private last='';private revision=0;
 private content(doc:DesignDocument){return JSON.stringify({...doc,updatedAt:undefined});}
 mark(doc:DesignDocument,dirty=false){this.baseline.set(doc.id,{content:this.content(doc),dirty});}
 state(doc:DesignDocument):DesktopDocumentState{const content=this.content(doc),key=doc.id+'\0'+content;if(key!==this.last){this.last=key;this.revision++;}const baseline=this.baseline.get(doc.id);return {id:doc.id,name:doc.name,revision:this.revision,dirty:!baseline||baseline.dirty||baseline.content!==content};}
}
export const desktopDocuments=new DesktopDocumentTracker();
export function desktopDocumentState(){return desktopDocuments.state(useEditor.getState().doc);}
export async function reportDesktopDocument(){if(typeof window!=='undefined'&&window.desktop?.reportDocument)await window.desktop.reportDocument(desktopDocumentState());}
export async function markDesktopSaved(doc:DesignDocument){desktopDocuments.mark(doc);await reportDesktopDocument();}
