import type {DesignDocument} from './model';

/** An asynchronous color operation belongs to one document target and editor mode. */
export interface ColorEditContext {
 doc:DesignDocument;pageId:string;selection:string[];mode:string;home:boolean;
 motionOpen:boolean;motionTime:number;modal:string|null;uiHidden:boolean;
}
const remeasured=new WeakMap<DesignDocument,DesignDocument>();
/** A font finishing its load re-measures text and replaces the document. Nobody edited anything, so work begun on the old one still stands. */
export function noteRemeasured(next:DesignDocument,from:DesignDocument){remeasured.set(next,from);}
function remeasuredFrom(origin:DesignDocument,doc:DesignDocument){let at:DesignDocument|undefined=doc;for(let i=0;at&&i<64;i++,at=remeasured.get(at))if(at===origin)return true;return false;}
export function captureColorContext(s:ColorEditContext):ColorEditContext{return {doc:s.doc,pageId:s.pageId,selection:[...s.selection],mode:s.mode,home:s.home,motionOpen:s.motionOpen,motionTime:s.motionTime,modal:s.modal,uiHidden:s.uiHidden};}
export function sameColorContext(a:ColorEditContext,b:ColorEditContext){return (a.doc===b.doc||remeasuredFrom(a.doc,b.doc)||remeasuredFrom(b.doc,a.doc))&&a.pageId===b.pageId&&a.mode===b.mode&&a.home===b.home&&a.motionOpen===b.motionOpen&&a.motionTime===b.motionTime&&a.modal===b.modal&&a.uiHidden===b.uiHidden&&a.selection.length===b.selection.length&&a.selection.every((id,i)=>id===b.selection[i]);}
