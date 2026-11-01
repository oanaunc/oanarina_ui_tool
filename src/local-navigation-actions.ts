import {packedProject} from './image-sharing';
import {captureColorContext,sameColorContext} from './color-edit-context';
import {desktopDocuments} from './desktop-lifecycle';
import {documentById,saveDocument,openReviewedLocalDocument} from './repository';
import {useEditor} from './store';
import {localLinkedPageCamera,parseLocalNavigationLink,resolveLocalNavigationLink} from './local-navigation-links';
import type {LocalNavigationTarget} from './local-navigation-links';
import {presentLocalLinkedFlow} from './local-flow-presentation';
const message=(e:unknown)=>e instanceof Error?e.message:String(e);
export function captureLocalNavigationAction(){const origin=captureColorContext(useEditor.getState()),controller=new AbortController();let valid=origin.modal==='local-links'&&!origin.motionOpen&&!origin.uiHidden;
 const stop=useEditor.subscribe(s=>{if(!sameColorContext(origin,s)){valid=false;controller.abort();}});return {origin,signal:controller.signal,check(){const s=useEditor.getState();if(!valid||!sameColorContext(origin,s))throw Error('The local link context changed. Review the link again.');return s;},dispose(){valid=false;controller.abort();stop();}};
}
export type LocalNavigationAction=ReturnType<typeof captureLocalNavigationAction>;
export interface LocalLinkReview {target:LocalNavigationTarget;stored:string|null;}
function content(target:LocalNavigationTarget){const raw=packedProject(target.document);if(new TextEncoder().encode(raw).length>50_000_000)throw Error('Local links open projects smaller than 50 MB.');return raw;}
export async function reviewLocalNavigationLink(proof:LocalNavigationAction,value:string):Promise<LocalLinkReview>{const s=proof.check(),link=parseLocalNavigationLink(value);if(link.documentId===s.doc.id)return {target:resolveLocalNavigationLink(s.doc,link),stored:null};
 if(typeof window!=='undefined'&&window.desktop)throw Error('This link belongs to another local file. Open its matching .oui file on this Mac first, then paste the link again.');
 const document=await documentById(link.documentId);proof.check();if(!document)throw Error('The linked local file is unavailable. Open it in Forma first, or restore it from Trash.');const target=resolveLocalNavigationLink(document,link);return {target,stored:content(target)};
}
/** Confirm exact target data again after retention; unavailable/Trash records are never revived. */
export async function openReviewedLocalNavigationLink(proof:LocalNavigationAction,review:LocalLinkReview){const before=proof.check(),cross=review.target.document!==before.doc;if(review.target.link.kind==='flow'&&before.mode!=='design')throw Error('Return to Design before opening a linked prototype flow.');let target=resolveLocalNavigationLink(review.target.document,review.target.link);
 const page=target.link.kind==='file'&&!cross?before.doc.pages.find(p=>p.id===before.pageId)??target.page:target.page,svg=typeof document==='undefined'?null:document.querySelector<SVGSVGElement>('#forma-design-canvas'),viewport={width:svg?.clientWidth||1000,height:svg?.clientHeight||750},camera=target.document.workspace==='slides'?undefined:localLinkedPageCamera(page,viewport);
 const install=()=>{proof.check();proof.dispose();if(cross){desktopDocuments.mark(target.document);useEditor.getState().load(target.document);}const current=useEditor.getState();current.set({pageId:page.id,home:false,modal:null,motionOpen:false,motionPlaying:false,vectorEditId:null,vectorSelection:[],selection:target.flow?[target.flow.frameId]:[],toast:target.flow?'Opening linked prototype flow':'Local link opened'});if(camera)useEditor.getState().setCamera(camera);if(target.flow)presentLocalLinkedFlow(target.document,page.id,target.flow.id);else focusLinkedPage(target.document,page.id,!svg);};
 if(!cross){install();return;}if(typeof window!=='undefined'&&window.desktop)throw Error('Open the matching .oui file on this Mac before following this link.');if(review.stored===null)throw Error('Review the saved local target again.');
 const candidate=await documentById(target.link.documentId);proof.check();if(!candidate||content(resolveLocalNavigationLink(candidate,target.link))!==review.stored)throw Error('The linked local file changed or became unavailable. Review it again.');
 const mustRetain=desktopDocuments.state(before.doc).dirty||before.past.length>0&&before.savedAt!==before.doc.updatedAt;let retained=false;
 try{retained=await saveDocument(before.doc,proof.signal);proof.check();if(!retained&&mustRetain)throw Error('The current edited file cannot be retained.');if(retained){const recovered=await documentById(before.doc.id);proof.check();if(!recovered||JSON.stringify(recovered)!==JSON.stringify(before.doc))throw Error('The current file recovery copy could not be verified.');}}
 catch(error){proof.check();if(mustRetain||retained)throw Error('Save a .oui backup of your current edits before opening another linked file. '+message(error));}
 const delivery=await openReviewedLocalDocument(target.link.documentId,review.stored,proof.signal,()=>proof.check());try{proof.check();target=resolveLocalNavigationLink(delivery.document,target.link);delivery.deliver(()=>install());}catch(error){await delivery.rollback();throw error;}
}

function focusLinkedPage(document:LocalNavigationTarget['document'],pageId:string,fit:boolean){if(typeof window==='undefined')return;const s=useEditor.getState(),origin=captureColorContext(s),zoom=s.zoom,pan=s.pan;let valid=true;const off=useEditor.subscribe(live=>{if(!sameColorContext(origin,live)||live.zoom!==zoom||live.pan.x!==pan.x||live.pan.y!==pan.y)valid=false;});requestAnimationFrame(()=>{off();if(!valid||!sameColorContext(origin,useEditor.getState())||document!==useEditor.getState().doc)return;const svg=window.document.querySelector<SVGSVGElement>('#forma-design-canvas');if(svg){if(fit)try{useEditor.getState().setCamera(localLinkedPageCamera(document.pages.find(p=>p.id===pageId)!,{width:svg.clientWidth,height:svg.clientHeight}));}catch{}svg.focus({preventScroll:true});}});}
