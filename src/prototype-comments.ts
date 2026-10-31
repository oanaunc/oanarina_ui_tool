import {sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {anchorAt,commentAnchorLookup,commentPosition,createComment} from './comment-threads';
import {descendants} from './model';
import type {Comment,DesignDocument,DesignNode} from './model';
export const PROTOTYPE_COMMENT_PANEL_LIMIT=200;
/**
 * Presentation guards refuse a replaced document, because any artwork edit invalidates the running prototype.
 * A comment write replaces the document object without touching artwork, so documents joined here count as one
 * artwork source. Membership is only ever granted inside commentOnlyEdit; Undo/Redo return to joined objects.
 */
const artworkSource=new WeakMap<DesignDocument,object>();
export function sameArtworkSource(a:DesignDocument,b:DesignDocument){if(a===b)return true;const source=artworkSource.get(a);return !!source&&source===artworkSource.get(b);}
export function samePresentedContext(origin:ColorEditContext,live:ColorEditContext){if(origin.doc===live.doc)return sameColorContext(origin,live);return sameArtworkSource(origin.doc,live.doc)&&sameColorContext({...origin,doc:live.doc,selection:live.selection},live);}
export interface CommentWrite {from:DesignDocument;to:DesignDocument;}
/** Runs through the ordinary edit path (one Undo step, branch protection, validation), joined to its predecessor before publication. */
export function commentOnlyEdit(store:{getState:()=>{doc:DesignDocument;edit:(fn:(d:DesignDocument)=>void)=>void}},fn:(d:DesignDocument)=>void):CommentWrite|null{
 const live=store.getState(),from=live.doc;live.edit(d=>{fn(d);const source=artworkSource.get(from)??{};artworkSource.set(from,source);artworkSource.set(d,source);});const to=store.getState().doc;return to===from?null:{from,to};
}
export interface PresentationEditor {modal:string|null;home:boolean;uiHidden:boolean;motionOpen:boolean;mode:string;doc:DesignDocument;}
export function prototypeCommentWriteAllowed(s:PresentationEditor){return s.modal==='present'&&!s.home&&!s.uiHidden&&!s.motionOpen&&(s.mode==='design'||s.mode==='prototype')&&s.doc.workspace!=='slides';}
/** Page coordinates of a click in a presented frame; the rendered rectangle already includes every CSS scale and native scroll. */
export function presentedFramePoint(frame:{x:number;y:number},box:{left:number;top:number;width:number;height:number},view:{width:number;height:number},client:{x:number;y:number}){
 if(!(box.width>0)||!(box.height>0))throw Error('This frame is not visible yet. Wait for it to appear, then click again.');const x=frame.x+(client.x-box.left)/box.width*view.width,y=frame.y+(client.y-box.top)/box.height*view.height;
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e6||Math.abs(y)>1e6)throw Error('This comment position is outside the supported canvas.');return {x,y};
}
/** A prototype comment is an ordinary local thread anchored to a frame's own axes, so it follows that frame in Design too. */
export function createPrototypeComment(document:DesignDocument,pageId:string,input:{frameId:string;x:number;y:number;text:string;author:string},threadId?:ReturnType<typeof crypto.randomUUID>,now?:string){
 const page=document.pages.find(p=>p.id===pageId);if(!page)throw Error('This comment page was removed.');const frame=page.nodes.find(n=>n.id===input.frameId);if(!frame||frame.type!=='frame')throw Error('This prototype frame was removed.');
 const anchor=anchorAt(page.nodes,frame.id,input.x,input.y);if(!anchor)throw Error('This frame cannot hold a comment because its transform has collapsed.');
 return createComment(document,pageId,{text:input.text,author:input.author,x:input.x,y:input.y,anchor,surface:'prototype'},threadId,now);
}
export interface PrototypeThread {thread:Comment;ordinal:number;x:number;y:number;}
/** Threads anchored to a frame or a layer inside it, numbered like canvas pins. Duplicate legacy identities stay in View → Comments, which marks them read-only. */
export function prototypeFrameThreads(nodes:DesignNode[],comments:Comment[],frame:{id:string;x:number;y:number}){
 const ids=new Set(descendants(nodes,[frame.id])),counts=new Map<string,number>(),lookup=commentAnchorLookup(nodes);for(const c of comments)counts.set(c.id,(counts.get(c.id)??0)+1);
 const threads:PrototypeThread[]=[];let hidden=0,matches=0;comments.forEach((c,i)=>{if(!c.anchor||!ids.has(c.anchor.nodeId))return;const position=commentPosition(c,lookup);if(!position.valid||counts.get(c.id)!==1){hidden++;return;}if(++matches>PROTOTYPE_COMMENT_PANEL_LIMIT)return;threads.push({thread:c,ordinal:i+1,x:position.x-frame.x,y:position.y-frame.y});});
 return {threads,hidden,overflow:Math.max(0,matches-PROTOTYPE_COMMENT_PANEL_LIMIT)};
}
