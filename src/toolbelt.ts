import {create} from 'zustand';
import {useEditor} from './store';
import type {Tool} from './model';
export type ToolbeltMode='design'|'draw';
/** View state only: which tools the toolbar leads with. It never reaches the document, history or .oui files. */
export const useToolbelt=create<{mode:ToolbeltMode}>(()=>({mode:'design'}));
const drawingTools:readonly Tool[]=['pen','pencil','brush'];
export function setToolbeltMode(mode:ToolbeltMode){if(mode!=='design'&&mode!=='draw')throw Error('Choose Design or Draw tools.');if(useToolbelt.getState().mode===mode)return;const s=useEditor.getState();if(mode==='design'){useToolbelt.setState({mode});if(drawingTools.includes(s.tool))s.set({tool:'move'});return;}if(s.home||s.uiHidden||s.modal||s.motionOpen||s.doc.workspace==='slides')throw Error('Close Motion and open a Design or Whiteboard canvas before using Draw mode.');useToolbelt.setState({mode});s.set({mode:'design',...(drawingTools.includes(s.tool)?{}:{tool:'pencil' as const})});}
export const toggleDrawMode=()=>setToolbeltMode(useToolbelt.getState().mode==='draw'?'design':'draw');
