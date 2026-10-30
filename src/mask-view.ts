import {previewMaskNodes} from './mask-view-geometry';
import {create} from 'zustand';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import type {MaskMode} from './masks';
import {useEditor} from './store';
export interface MaskPreview {context:ColorEditContext;sourceId:string;mode:MaskMode;}
interface MaskView {outlines:boolean;outlineContext:ColorEditContext|null;preview:MaskPreview|null;setOutlines:(enabled:boolean)=>void;previewMode:(sourceId:string,mode:MaskMode)=>void;clearPreview:()=>void;reset:()=>void;}
export const useMaskView=create<MaskView>((set,get)=>({outlines:false,outlineContext:null,preview:null,setOutlines:enabled=>{const s=useEditor.getState();if(enabled&&(s.home||s.modal||s.uiHidden||s.motionOpen||s.doc.workspace==='slides'))throw Error('Open the Design or Whiteboard canvas and close Motion to inspect mask outlines.');set({outlines:enabled,outlineContext:enabled?captureColorContext(s):null,preview:null});},previewMode:(sourceId,mode)=>{const s=useEditor.getState();if(s.home||s.modal||s.uiHidden||s.motionOpen||s.doc.workspace==='slides')return;const nodes=s.doc.pages.find(p=>p.id===s.pageId)!.nodes;previewMaskNodes(nodes,sourceId,mode);set({preview:{context:captureColorContext(s),sourceId,mode}});},clearPreview:()=>{if(get().preview)set({preview:null});},reset:()=>set({outlines:false,outlineContext:null,preview:null})}));
useEditor.subscribe(s=>{const view=useMaskView.getState();if(view.preview&&!sameColorContext(view.preview.context,s))view.clearPreview();const c=view.outlineContext;if(c&&(c.doc!==s.doc||c.pageId!==s.pageId||c.mode!==s.mode||c.home!==s.home||c.modal!==s.modal||c.uiHidden!==s.uiHidden||c.motionOpen!==s.motionOpen||c.motionTime!==s.motionTime))view.reset();});
