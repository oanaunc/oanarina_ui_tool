import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {DesignDocument} from './model';
type Editor=ReturnType<typeof useEditor.getState>;
export type OwnedEditDelivery=Partial<Pick<Editor,'selection'|'pageId'|'vectorEditId'|'vectorSelection'|'pan'|'zoom'|'leftTab'>>;
/** Publish one ephemeral result only into the exact edit this action owns.
 * Validation stays in the normal store transaction. Its final candidate is an identity
 * proof, not a JSON comparison; any observed context departure stays invalid after ABA.
 * A true no-op can deliver into its untouched origin only if no store update occurred.
 */
export function editWithOwnedDelivery(change:(doc:DesignDocument)=>void,validate:(doc:DesignDocument)=>void,delivery:()=>OwnedEditDelivery):boolean{
 const before=useEditor.getState(),origin=captureColorContext(before),camera={x:before.pan.x,y:before.pan.y},vectorSelection=[...before.vectorSelection];let candidate:DesignDocument|undefined,valid=true,observed=false;
 const same=(s:Editor,doc:DesignDocument)=>sameColorContext({...origin,doc},s)&&s.fontRevision===before.fontRevision&&s.leftTab===before.leftTab&&s.tool===before.tool&&s.zoom===before.zoom&&s.pan.x===camera.x&&s.pan.y===camera.y&&s.vectorEditId===before.vectorEditId&&s.outlines===before.outlines&&s.vectorSelection.length===vectorSelection.length&&s.vectorSelection.every((id,i)=>id===vectorSelection[i]);
 const off=useEditor.subscribe(s=>{observed=true;if(!candidate||!same(s,candidate)||!same(useEditor.getState(),candidate))valid=false;});
 const current=()=>valid&&(candidate!==undefined&&same(useEditor.getState(),candidate)||!observed&&same(useEditor.getState(),before.doc));
 try{before.edit(change,d=>{validate(d);candidate=d;});if(!current())return false;const patch=delivery();if(!current())return false;useEditor.getState().set(patch);return true;}finally{off();}
}
