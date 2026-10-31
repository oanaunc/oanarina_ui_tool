import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import {anchorAt,commentPosition,commentAnchorLookup,findComment} from './comment-threads';
import type {CommentAnchor} from './comment-threads';
import type {DesignDocument} from './model';
let localName='Local author';
export const getLocalCommentName=()=>localName;
export const setLocalCommentName=(name:string)=>{localName=name;};
interface CommentRequest {origin:ReturnType<typeof captureColorContext>;valid:boolean;x:number;y:number;anchor?:CommentAnchor;}
let request:CommentRequest|null=null,stop:(()=>void)|undefined;
let focus:{doc:DesignDocument;pageId:string;threadId:string;replyId?:string}|null=null;
export function commentWriteAllowed(s:ReturnType<typeof useEditor.getState>){return s.mode==='design'&&!s.home&&!s.uiHidden&&!s.motionOpen&&s.doc.workspace!=='slides';}
export function beginComment(x:number,y:number,nodeId?:string){const s=useEditor.getState(),page=s.doc.pages.find(p=>p.id===s.pageId);if(!commentWriteAllowed(s)||s.modal||!page)throw Error('Close Motion and return to the Design canvas to add a local comment.');if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e6||Math.abs(y)>1e6)throw Error('This comment position is outside the supported canvas.');stop?.();const anchor=anchorAt(page.nodes,nodeId,x,y);s.set({modal:'comment:new'});const origin=captureColorContext(useEditor.getState());request={origin,valid:true,x,y,...(anchor?{anchor}:{})};const captured=request;stop=useEditor.subscribe(live=>{if(!sameColorContext(origin,live))captured.valid=false;if(live.modal!=='comment:new'&&request===captured){request=null;stop?.();stop=undefined;}});}
export function getCommentRequest(){return request;}
export function commentRequestValid(value:CommentRequest|null){return !!value?.valid&&value===request&&sameColorContext(value.origin,useEditor.getState())&&commentWriteAllowed(useEditor.getState());}
export function clearCommentRequest(){request=null;stop?.();stop=undefined;}
export function openCommentThread(document:DesignDocument,pageId:string,threadId:string,replyId?:string){const s=useEditor.getState();if(s.doc!==document||s.pageId!==pageId||s.modal||s.home||s.uiHidden)throw Error('This comment pin belongs to an earlier canvas context.');findComment(s.doc,pageId,threadId);focus={doc:s.doc,pageId,threadId,...(replyId?{replyId}:{})};s.set({modal:'comments'});}
export function focusedComment(){const s=useEditor.getState();return focus?.doc===s.doc?focus:null;}
/** Read-only navigation: page/camera/selection change, never the saved document or Undo history. */
export function jumpToComment(document:DesignDocument,pageId:string,threadId:string,viewport:{width:number;height:number}){
 const s=useEditor.getState();if(s.doc!==document||s.home||s.uiHidden||s.modal!=='comments')throw Error('The comment context changed. Reopen the thread before jumping.');if(s.doc.workspace==='slides')throw Error('Canvas comment navigation is unavailable in Slides.');const {page,thread}=findComment(document,pageId,threadId),location=commentPosition(thread,commentAnchorLookup(page.nodes));if(!location.valid||viewport.width<=0||viewport.height<=0)throw Error('This saved comment position cannot be displayed on the current canvas.');const anchor=thread.anchor&&page.nodes.some(n=>n.id===thread.anchor!.nodeId)?[thread.anchor.nodeId]:[];s.selectPage(pageId);s.set({modal:null,home:false,mode:'design',motionOpen:false,selection:anchor,tool:'move',toast:location.status});s.setCamera({pan:{x:viewport.width/2-location.x*s.zoom,y:viewport.height/2-location.y*s.zoom},zoom:s.zoom});return location;
}
