import {create} from 'zustand';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {useEditor} from './store';
import {playgroundMainId,playgroundSourceIndex} from './component-playground';
export interface PlaygroundRequest {serial:number;origin:ColorEditContext;fontRevision:number;mainId:string;leftTab:string;}
let serial=0;
export const useComponentPlayground=create<{request:PlaygroundRequest|null}>(()=>({request:null}));
export function playgroundRequestCurrent(request:PlaygroundRequest){const s=useEditor.getState();return useComponentPlayground.getState().request===request&&s.doc===request.origin.doc&&s.pageId===request.origin.pageId&&s.mode===request.origin.mode&&s.fontRevision===request.fontRevision&&s.leftTab===request.leftTab&&!s.home&&!s.uiHidden&&!s.motionOpen&&s.modal==='component-playground'&&s.selection.length===request.origin.selection.length&&s.selection.every((id,i)=>id===request.origin.selection[i]);}
export function openComponentPlayground(origin:ColorEditContext,fontRevision:number,nodeId:string,mainId?:string){const s=useEditor.getState();if(!sameColorContext(origin,s)||s.fontRevision!==fontRevision||s.modal||s.home||s.uiHidden||s.motionOpen||!['design','inspect'].includes(s.mode)||s.doc.workspace==='slides')throw Error('The playground source changed. Choose the current component again.');const chosen=mainId??playgroundMainId(s.doc,nodeId);if(playgroundSourceIndex(s.doc).byId.get(chosen)?.type!=='component')throw Error('The component source is unavailable.');useComponentPlayground.setState({request:{serial:++serial,origin:captureColorContext(s),fontRevision,mainId:chosen,leftTab:s.leftTab}});s.set({modal:'component-playground'});}
useEditor.subscribe(s=>{const r=useComponentPlayground.getState().request;if(r&&!playgroundRequestCurrent(r)){useComponentPlayground.setState({request:null});if(s.modal==='component-playground')s.set({modal:null});}});
