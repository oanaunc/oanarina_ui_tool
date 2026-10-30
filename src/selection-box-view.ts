import {create} from 'zustand';
import {useEditor} from './store';
import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import type {SelectionRect,BoxSelectionMode} from './selection-box';
import {validateSelectionRect} from './selection-box';
interface SelectionBoxView {preview:{context:ColorEditContext;box:SelectionRect;mode:BoxSelectionMode;count:number}|null;show:(box:SelectionRect,mode:BoxSelectionMode,count:number)=>void;clear:()=>void;}
export const useSelectionBoxView=create<SelectionBoxView>(set=>({preview:null,show:(box,mode,count)=>{validateSelectionRect(box);set({preview:{context:captureColorContext(useEditor.getState()),box:{...box},mode,count}});},clear:()=>set({preview:null})}));
useEditor.subscribe(s=>{const preview=useSelectionBoxView.getState().preview;if(preview&&(!sameColorContext(preview.context,s)||s.vectorEditId))useSelectionBoxView.getState().clear();});
